# Plan 02 — CRUD Projects/Feeds

## Objective

Working REST CRUD for projects and feeds, validated with Zod. The API is fully usable from curl with no UI attached.

```
GET    /api/projects
POST   /api/projects                 { name }
GET    /api/projects/:id/feeds
POST   /api/projects/:id/feeds       { url, name, adapter_type }
GET    /api/feeds/:id
PATCH  /api/feeds/:id                { active }
```

## Preconditions

- Phase 1 done: migrations applied, server boots on 5101, shared package exists.

## Tasks

### 2.1 Shared input schemas
Add to `packages/shared`:
- `CreateProject` (name, min 1; slug derived server-side from name).
- `CreateFeed` (url valid http(s) via `z.url()`, name min 1, `adapter_type` in `AdapterType`).
- `UpdateFeed` (partial: `active` boolean).

### 2.2 Routes
Create `apps/server/src/routes/projects.ts` and `apps/server/src/routes/feeds.ts`, register under `/api`.

- `GET /api/projects` → all projects.
- `POST /api/projects` → 201 + created project (`slug` auto-generated).
- `GET /api/projects/:id/feeds` → feeds of the project; 404 if project missing.
- `POST /api/projects/:id/feeds` → `zValidator('json', CreateFeed)`; 201 + created feed; 404 if project missing; 400 on invalid body.
- `GET /api/feeds/:id` → feed; 404 if missing.
- `PATCH /api/feeds/:id` → `zValidator('json', UpdateFeed)`; returns updated feed; 404 if missing.

### 2.3 Error handling
- Zod validation failures return `400` with the validator message (default `@hono/zod-validator` behavior is fine).
- Unknown resource ids return `404` with `{ error: "not found" }`.
- No `any` anywhere; handlers infer types from the Zod validators.

### 2.4 Commit
Commit after verification: `feat(api): add projects and feeds CRUD`.

## Verification (Definition of Done)

```bash
cd apps/server && bun run typecheck
cd packages/shared && bun run typecheck
cd apps/server && PORT=5101 bun run src/index.ts &
```

```bash
curl -s -X POST http://localhost:5101/api/projects -H 'Content-Type: application/json' \
  -d '{"name":"Tech News"}'                       # 201, has slug "tech-news"
curl -s http://localhost:5101/api/projects        # list contains Tech News
curl -s -X POST http://localhost:5101/api/projects/1/feeds -H 'Content-Type: application/json' \
  -d '{"url":"https://hnrss.org/frontpage","name":"HN","adapter_type":"rss"}'  # 201
curl -s http://localhost:5101/api/projects/1/feeds    # contains the feed
curl -s -X PATCH http://localhost:5101/api/feeds/1 -H 'Content-Type: application/json' \
  -d '{"active":false}'                          # 200, active=false
curl -s -X POST http://localhost:5101/api/projects -H 'Content-Type: application/json' \
  -d '{}'                                        # 400 (validation)
curl -s -X POST http://localhost:5101/api/projects/999/feeds -H 'Content-Type: application/json' \
  -d '{"url":"https://x.com/feed","name":"X","adapter_type":"rss"}'  # 404
```

Phase is **done** only when every command above returns the expected status code and body, and both typechecks pass. `POST /api/projects` with `{}` returns 400 (not 500).
