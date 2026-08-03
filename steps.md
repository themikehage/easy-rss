# Easy RSS — Progress Checklist

> Read `about.md`, `steps.md`, and `AGENTS.md` before any session. Mark `[x]` only after the phase's verification commands pass.

## Phase 1 — Scaffold + Schema + Migrations
- [x] Monorepo workspaces (apps/server, apps/client, packages/shared)
- [x] Server responds on `GET /api/health` (port 5101)
- [x] Client builds (port 5100, proxy `/api` → 5101)
- [x] Shared package typechecks
- [x] Drizzle schema for projects, feeds, posts with `UNIQUE(feed_id, guid)`
- [x] Migration generated and applied; DB file at `apps/server/data/app.db`

## Phase 2 — CRUD Projects/Feeds
- [x] `GET/POST /api/projects`
- [x] `GET/POST /api/projects/:id/feeds`
- [x] `GET/PATCH /api/feeds/:id`
- [x] Zod validation → 400 on bad payloads, 404 on missing resources
- [x] Full curl CRUD sequence passes

## Phase 3 — Adapters + Manual Fetch
- [x] `FeedAdapter` interface + `adapterRegistry`
- [x] RSS/Atom adapter (fast-xml-parser)
- [x] `POST /api/feeds/:id/fetch` ingests and dedups posts
- [x] `GET /api/projects/:id/posts` (status/since filters) + `PATCH /api/posts/:id`
- [x] `last_fetched_at` / `last_error` updated per feed
- [x] Fixture-based curl verification passes (no duplicates)

## Phase 4 — node-cron Daily Job
- [x] Daily job (configurable via `FETCH_CRON`) iterates active feeds
- [x] Per-feed try/catch; one broken feed never stops the rest
- [x] Verification: cron every minute fetches automatically; inactive feeds skipped

## Phase 5 — Minimal UI
- [x] Typed API client in client (`lib/api.ts`)
- [x] Projects CRUD, add feed, posts list with status filter
- [x] `bun run build` passes; full flow works in browser against live server

## Phase 6 — Second Adapter (JSON Feed)
- [x] `json_feed` adapter registered with no core changes
- [x] Fixture-based verification fetches JSON Feed posts
- [x] `git diff` shows only adapter + registry touched → decoupling validated

## Deployment (deferred)
- [x] Deploy to Coolify (`https://easy-rss.pages.therry.dev`), front + back served from one container, curl smoke passed
- [x] Persistent volume (`easy-rss-data` → `/app/data`) via dockercompose + `docker_compose_domains` routing — data survives redeploys
