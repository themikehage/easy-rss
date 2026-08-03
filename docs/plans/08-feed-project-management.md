# Plan 08 — Feed/Project Management: Edit, Delete, Max Posts

## Objective

Manage projects and feeds from the UI with modal-based editing:
1. **Feeds:** add, delete, toggle active, and **edit** name/url/adapter after creation.
2. **Projects:** **rename** and **delete** (cascade feeds + posts).
3. **Max posts per feed:** new `maxPosts` field (default 50) that caps how many items are ingested per fetch run.

API-first and typed end-to-end: every new/updated shape is a Zod schema in `packages/shared`. The schema change goes through Drizzle migrations (never by hand).

## Preconditions

- Phase 7 done: dark mode, routing (`/projects/:id`, `/feeds/:id`, `/posts/:id`), per-feed posts, post detail.

## Tasks

### 8.1 Schema + migration
- `apps/server/src/db/schema.ts`: add `maxPosts: integer("max_posts").notNull().default(50)` to `feeds`.
- `drizzle-kit generate` + `migrate` → new migration file in `apps/server/drizzle/`.

### 8.2 Shared schemas (`packages/shared/src/schemas.ts`)
- `Feed` → add `maxPosts: z.number()`.
- `CreateFeed` → add `maxPosts: z.number().int().min(1).max(500).optional()`.
- `UpdateFeed` → partial object `{ name?, url?, adapter_type?, active?, maxPosts? }` with `.refine()` requiring at least one field; `url` validated as URL, `adapter_type` as `AdapterType`, `maxPosts` as int 1–500.
- `UpdateProject` → `{ name: z.string().min(1) }`.

### 8.3 Server routes
- `projects.ts`:
  - `PATCH /:id` with `UpdateProject` → rename + regenerate `slug` (`slugify`), 404 if missing.
  - `DELETE /:id` → delete posts + feeds then project (cascade), 404 if missing.
- `feeds.ts`: `PATCH /:id` with the new partial `UpdateFeed` → apply only provided fields, 404 if missing.
- `services/fetchFeed.ts`: `const items = (await adapter.fetch(feed.url)).slice(0, feed.maxPosts)` — cap is **per run**; `fetched` reflects the capped count.

### 8.4 Typed API client (`apps/client/src/lib/api.ts`)
- `updateProject(id, { name })`, `deleteProject(id)`, `deleteFeed(id)`.
- `updateFeed(id, patch)` extended to partial `{ name?, url?, adapter_type?, active?, maxPosts? }`.

### 8.5 Modal components
- `components/Modal.tsx`: generic overlay — title, ESC + click-outside to close, children, footer. No portal dependency (fixed positioning).
- `components/FeedFormModal.tsx`: URL, name, adapter (from `AdapterType`), maxPosts number input. Used for **create** (empty) and **edit** (prefilled) via a `feed?: Feed` prop; calls `createFeed` or `updateFeed`, then reloads feeds and bumps posts refresh.
- `components/ProjectEditModal.tsx`: rename input; calls `updateProject`, updates list.

### 8.6 Sidebar integration (`ProjectsPanel.tsx`)
- Project row: "Edit" button (opens `ProjectEditModal`), "Delete" button (`window.confirm` → `deleteProject` → navigate to `/` if it was the active project).
- Feed row: "Edit" button (opens `FeedFormModal` prefilled), "Delete" button (`window.confirm` → `deleteFeed` → reload feeds + bump posts).
- Replace the inline add-feed form with a "+ Add feed" button that opens `FeedFormModal` in create mode.
- Modals surface API errors inline.

### 8.7 App state
- `App.tsx`: add `handleUpdateProject(id, name)` and `handleDeleteProject(id)` callbacks that update the `projects` state, passed to `ProjectsPanel`.

### 8.8 Commit
Commit after verification: `feat(ui): edit/delete projects and feeds, per-feed max posts`.

## Verification (Definition of Done)

```bash
cd packages/shared && bun run typecheck
cd apps/server && bun run typecheck
cd apps/server && bun run src/fixtures/serve-fixture.ts &   # :5999
cd apps/server && PORT=5101 bun run src/index.ts &          # :5101
```

API curl smoke:

```bash
curl -s http://localhost:5101/api/projects/1 | jq .maxPosts        # n/a
curl -s -X POST http://localhost:5101/api/projects/1/feeds -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:5999/sample-rss.xml","name":"Capped","adapter_type":"rss","maxPosts":1}'
curl -s -X POST http://localhost:5101/api/feeds/2/fetch | jq '{fetched,newPosts}'   # fetched=1 (capped)
curl -s -X PATCH http://localhost:5101/api/projects/1 -H 'Content-Type: application/json' -d '{"name":"Renamed"}'
curl -s -X PATCH http://localhost:5101/api/feeds/2 -H 'Content-Type: application/json' -d '{"maxPosts":50}'
curl -s -X DELETE http://localhost:5101/api/feeds/2
curl -s -X DELETE http://localhost:5101/api/projects/1
```

UI:

```bash
cd apps/client && bun run build       # must pass
cd apps/client && bun run dev &       # :5100
```

Browser flow at `http://localhost:5100`:
1. "+ Add feed" opens the modal → add feed with `maxPosts` → appears in sidebar.
2. Feed "Edit" opens prefilled modal → change name/maxPosts → persists.
3. Feed "Delete" → confirm → feed (and its posts) gone.
4. Project "Edit" renames it in place.
5. Project "Delete" → confirm → project, feeds, and posts gone; active project returns to `/`.

Phase is **done** only when: both typechecks pass, client build passes, curl smoke and browser flow work. `grep -r "fetch(" apps/client/src --include="*.ts*" -l` still only lists `lib/api.ts`.
