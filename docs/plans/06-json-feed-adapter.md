# Plan 06 — Second Adapter (JSON Feed)

## Objective

Prove the adapter pattern is genuinely decoupled: adding `json_feed` support must require **zero changes** to routes, models, services, or the client. Only a new adapter file plus registry registration and the shared enum.

## Preconditions

- Phases 1-5 done and verified.

## Tasks

### 6.1 Adapter (`apps/server/src/adapters/json-feed.ts`)
- Implements `FeedAdapter` from `adapters/types.ts`.
- JSON Feed 1.x: items map `id` → `guid`, `title`, `url` → `link`, `content_html`/`content_text` → `summary`, `date_published` → `publishedAt`.

### 6.2 Registry (`apps/server/src/adapters/index.ts`)
- Register `json_feed: jsonFeedAdapter` (replaces the placeholder from Plan 03).

### 6.3 Fixture
- `apps/server/fixtures/sample-json-feed.json` with 2 items.

### 6.4 Commit
Commit after verification: `feat(feed): add JSON Feed adapter`.

## Verification (Definition of Done)

```bash
cd apps/server && bun run typecheck
cd packages/shared && bun run typecheck
cd apps/server && bun run src/fixtures/serve-fixture.ts &   # :5999
cd apps/server && PORT=5101 bun run src/index.ts &
```

```bash
curl -s -X POST http://localhost:5101/api/projects/1/feeds -H 'Content-Type: application/json' \
  -d "{\"url\":\"http://localhost:5999/sample-json-feed.json\",\"name\":\"JSON\",\"adapter_type\":\"json_feed\"}"
curl -s -X POST http://localhost:5101/api/feeds/2/fetch     # {"fetched":2,"newPosts":2}
curl -s -X POST http://localhost:5101/api/feeds/2/fetch     # newPosts=0 (dedup)
curl -s "http://localhost:5101/api/projects/1/posts"        # JSON items present, status "new"
```

**Decoupling proof** — confirm nothing outside the adapter/registry changed:

```bash
git status --short
# expect: apps/server/src/adapters/json-feed.ts (new)
#         apps/server/src/adapters/index.ts (modified)
#         apps/server/fixtures/sample-json-feed.json (new)
#         packages/shared (adapter_type enum already had json_feed)
# and NOTHING in routes/, services/, db/, client/
```

Phase is **done** only when: the JSON feed fetches and dedups exactly like RSS, `git status` shows no core changes, and all typechecks pass.

## Post-MVP checklist (not part of this phase)
- Check off Phase 6 in `steps.md`.
- MVP criteria met: 3+ feeds of different types, daily automatic fetch, no duplicates, API works standalone.
- Update `AGENTS.md` "How to add a new adapter" with the JSON Feed example if anything deviates.
