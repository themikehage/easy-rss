# Plan 04 — node-cron Daily Job

## Objective

A scheduled job inside the Bun process fetches **all active feeds** on a configurable schedule. Errors are caught **per feed**, so one broken feed never stops the others. Inactive feeds are skipped.

## Preconditions

- Phase 3 done: `fetchFeed(feedId)` works and handles per-feed errors.

## Tasks

### 4.1 Cron service (`apps/server/src/services/cron.ts`)
- `startCron()` called from `src/index.ts` after the server listens.
- Schedule from `FETCH_CRON` env, default `"0 8 * * *"` (daily 08:00).
- `runDailyFetch()`:
  1. Select all feeds where `active = true`.
  2. For each feed, `await fetchFeed(feed.id)` wrapped in its own try/catch (belt-and-braces; `fetchFeed` already never throws).
  3. Log a summary line: `[cron] N active feeds, M fetched, K failed`.
- No batch abort: if feed 3 fails, feeds 4..N still run.

### 4.2 Env
- Document `FETCH_CRON` in `AGENTS.md` (commands section) — optional, default daily.

### 4.3 Commit
Commit after verification: `feat(cron): add configurable daily fetch job`.

## Verification (Definition of Done)

```bash
cd apps/server && bun run typecheck
cd apps/server && bun run src/fixtures/serve-fixture.ts &   # :5999
FETCH_CRON="* * * * *" PORT=5101 bun run src/index.ts &      # every minute
```

With the fixture feed from Plan 03 still in the DB:

```bash
# 1) automatic fetch: wait ~65s, then:
curl -s http://localhost:5101/api/projects/1/posts    # posts appear WITHOUT manual fetch
# 2) inactive skipped:
curl -s -X PATCH http://localhost:5101/api/feeds/1 -H 'Content-Type: application/json' -d '{"active":false}'
# wait one cycle, note last_fetched_at does NOT advance (compare before/after)
# 3) broken feed doesn't stop others:
curl -s -X POST http://localhost:5101/api/projects/1/feeds -H 'Content-Type: application/json' \
  -d "{\"url\":\"http://localhost:5999/nonexistent.xml\",\"name\":\"Broken\",\"adapter_type\":\"rss\"}"
curl -s -X PATCH http://localhost:5101/api/feeds/1 -H 'Content-Type: application/json' -d '{"active":true}'
# wait one cycle: the good feed keeps advancing last_fetched_at, the broken one has last_error set
# server stays healthy throughout
curl -s http://localhost:5101/api/health
```

Phase is **done** only when: posts appear automatically without manual fetch, an inactive feed stops being fetched, and a broken feed records `last_error` while healthy feeds keep updating — all with the same server process staying alive.
