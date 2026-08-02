# Plan 03 — Adapters + Manual Fetch

## Objective

The core fetch pipeline is format-agnostic. `POST /api/feeds/:id/fetch` pulls a feed through its registered adapter, normalizes items, and persists them with dedup (`INSERT OR IGNORE` on `UNIQUE(feed_id, guid)`). Every fetch updates `last_fetched_at`; a failure records `last_error` without throwing.

## Preconditions

- Phase 2 done: a project and a feed can be created via curl.

## Tasks

### 3.1 Adapter contract (`apps/server/src/adapters/types.ts`)
```ts
export interface RawFeedItem {
  guid: string
  title: string
  link: string
  summary: string
  publishedAt: string | null
}

export interface FeedAdapter {
  fetch(feedUrl: string): Promise<RawFeedItem[]>
  normalize(item: RawFeedItem): NormalizedPost
}

export interface NormalizedPost {
  guid: string
  title: string
  link: string
  summary: string
  publishedAt: string | null
}
```

### 3.2 RSS/Atom adapter (`apps/server/src/adapters/rss-atom.ts`)
- Uses `fast-xml-parser`.
- Handles RSS 2.0 (`<item>`, `<guid>`, `<title>`, `<link>`, `<description>`, `<pubDate>`) and Atom (`<entry>`, `<id>`, `<title>`, `<link href>`, `<summary>`, `<published>`).
- Missing `guid` → fall back to `link`; missing `publishedAt` → `null`.
- Both `rss` and `atom` adapter types map to this one class.

### 3.3 Registry (`apps/server/src/adapters/index.ts`)
```ts
export const adapterRegistry: Record<AdapterType, FeedAdapter> = {
  rss: rssAtomAdapter,
  atom: rssAtomAdapter,
  json_feed: /* added in Plan 06 */ undefined as never, // placeholder, never called yet
}
```
Unknown `adapter_type` → throw a clear "unsupported adapter" error (surface as `last_error`, never a 500 crash of the job).

### 3.4 Fetch service (`apps/server/src/services/fetchFeed.ts`)
`fetchFeed(feedId: number): Promise<FetchResult>`:
1. Load the feed row; if missing or `adapter_type` unsupported → record `last_error`, return.
2. `adapter.fetch(feed.url)` → `RawFeedItem[]`.
3. Map to normalized inserts; **dedup via `INSERT OR IGNORE`** relying on `UNIQUE(feed_id, guid)`.
4. Set `feed.last_fetched_at = now`; on success clear `last_error`; on failure set `last_error` (message only, no stack) and **do not rethrow** — wrap the whole body in try/catch.

### 3.5 Route (`apps/server/src/routes/feeds.ts`)
- `POST /api/feeds/:id/fetch` → calls `fetchFeed(id)`; 200 `{ fetched: n, newPosts: m, feed: { last_fetched_at, last_error } }`; 404 if feed missing.

### 3.6 Posts routes (`apps/server/src/routes/posts.ts`)
- `GET /api/projects/:id/posts?status=new&since=ISO_DATE` → posts of the project's feeds; both filters optional, validated with Zod; ordered by `published_at` desc.
- `PATCH /api/posts/:id` → `{ status }` from `PostStatus`; 404 if post missing.

### 3.7 Fixture
- `apps/server/fixtures/sample-rss.xml`: a small RSS 2.0 feed with 2 items (stable guids).
- `apps/server/fixtures/serve-fixture.ts`: tiny `Bun.serve` static server on port `5999` for offline verification (dev tooling only).

### 3.8 Commit
Commit after verification: `feat(fetch): add adapters, posts routes, and manual fetch with dedup`.

## Verification (Definition of Done)

```bash
cd apps/server && bun run typecheck
cd packages/shared && bun run typecheck
cd apps/server && bun run src/fixtures/serve-fixture.ts &   # :5999
cd apps/server && PORT=5101 bun run src/index.ts &
```

```bash
curl -s http://localhost:5999/sample-rss.xml >/dev/null && echo "fixture up"
curl -s -X POST http://localhost:5101/api/projects -H 'Content-Type: application/json' -d '{"name":"Fetcher"}'
curl -s -X POST http://localhost:5101/api/projects/1/feeds -H 'Content-Type: application/json' \
  -d "{\"url\":\"http://localhost:5999/sample-rss.xml\",\"name\":\"Sample\",\"adapter_type\":\"rss\"}"
curl -s -X POST http://localhost:5101/api/feeds/1/fetch     # {"fetched":2,"newPosts":2,...}
curl -s -X POST http://localhost:5101/api/feeds/1/fetch     # again: newPosts=0 (dedup)
curl -s "http://localhost:5101/api/projects/1/posts"        # 2 posts, status "new"
curl -s "http://localhost:5101/api/projects/1/posts?status=new"   # both
curl -s -X PATCH http://localhost:5101/api/posts/1 -H 'Content-Type: application/json' \
  -d '{"status":"processed"}'                              # 200, status processed
curl -s "http://localhost:5101/api/projects/1/posts?status=processed"  # now 1
```

Error path: create a feed pointing at `http://localhost:5999/nonexistent.xml`, fetch it → response shows `newPosts: 0` and `feed.last_error` is non-empty; `GET /api/feeds/:id` shows `last_fetched_at` set and `last_error` populated. The server process is still healthy afterward (`GET /api/health` → ok).

Phase is **done** only when: the same feed fetched twice yields 2 then 0 new posts (dedup proven), error feeds record `last_error` without killing the server, and both typechecks pass.
