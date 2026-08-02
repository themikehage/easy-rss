# Easy RSS — Progress Checklist

> Read `about.md`, `steps.md`, and `AGENTS.md` before any session. Mark `[x]` only after the phase's verification commands pass.

## Phase 1 — Scaffold + Schema + Migrations
- [ ] Monorepo workspaces (apps/server, apps/client, packages/shared)
- [ ] Server responds on `GET /api/health` (port 5101)
- [ ] Client builds (port 5100, proxy `/api` → 5101)
- [ ] Shared package typechecks
- [ ] Drizzle schema for projects, feeds, posts with `UNIQUE(feed_id, guid)`
- [ ] Migration generated and applied; DB file at `apps/server/data/app.db`

## Phase 2 — CRUD Projects/Feeds
- [ ] `GET/POST /api/projects`
- [ ] `GET/POST /api/projects/:id/feeds`
- [ ] `GET/PATCH /api/feeds/:id`
- [ ] Zod validation → 400 on bad payloads, 404 on missing resources
- [ ] Full curl CRUD sequence passes

## Phase 3 — Adapters + Manual Fetch
- [ ] `FeedAdapter` interface + `adapterRegistry`
- [ ] RSS/Atom adapter (fast-xml-parser)
- [ ] `POST /api/feeds/:id/fetch` ingests and dedups posts
- [ ] `GET /api/projects/:id/posts` (status/since filters) + `PATCH /api/posts/:id`
- [ ] `last_fetched_at` / `last_error` updated per feed
- [ ] Fixture-based curl verification passes (no duplicates)

## Phase 4 — node-cron Daily Job
- [ ] Daily job (configurable via `FETCH_CRON`) iterates active feeds
- [ ] Per-feed try/catch; one broken feed never stops the rest
- [ ] Verification: cron every minute fetches automatically; inactive feeds skipped

## Phase 5 — Minimal UI
- [ ] Typed API client in client (`lib/api.ts`)
- [ ] Projects CRUD, add feed, posts list with status filter
- [ ] `bun run build` passes; full flow works in browser against live server

## Phase 6 — Second Adapter (JSON Feed)
- [ ] `json_feed` adapter registered with no core changes
- [ ] Fixture-based verification fetches JSON Feed posts
- [ ] `git diff` shows only adapter + registry touched → decoupling validated

## Deployment (deferred)
- [ ] Dockerfile + Coolify deployment plan (separate plan, not yet written)
