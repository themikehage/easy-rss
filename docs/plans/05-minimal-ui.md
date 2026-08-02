# Plan 05 — Minimal UI

## Objective

A thin Vite + React app that consumes the API. Zero business logic, zero DB access, zero adapter logic — everything typed from `packages/shared`. The user can manage projects, add feeds, and browse posts with a status filter. The UI is not required for the API to work.

## Preconditions

- Phase 4 done: server boots with cron, API complete.

## Tasks

### 5.1 Typed API client (`apps/client/src/lib/api.ts`)
The **only** place that talks to the API. Functions return types inferred from shared Zod schemas:
- `listProjects()`, `createProject(name)`
- `listFeeds(projectId)`, `createFeed(projectId, input)`, `updateFeed(id, patch)`
- `fetchFeed(id)`
- `listPosts(projectId, { status?, since? })`
- `updatePost(id, { status })`

### 5.2 Components
- `ProjectsPage`: list projects, create project, select active project.
- `FeedsPanel`: list feeds for the active project, add feed (url, name, adapter type from `AdapterType`), toggle `active`, button "Fetch now".
- `PostsList`: posts for the active project with a status filter (`new | processed | discarded`) and an "mark processed/discarded" action.
- Loading and error states; no placeholder business logic.

### 5.3 Styling
- Tailwind v4 tokens; mobile-first (375/768/1280). Minimal but clean; this is a tool, not a marketing site.

### 5.4 Commit
Commit after verification: `feat(client): add minimal projects/feeds/posts UI`.

## Verification (Definition of Done)

```bash
cd apps/client && bun run build          # must pass
cd apps/server && PORT=5101 bun run src/index.ts &    # :5101
cd apps/client && bun run dev &          # :5100, proxy /api -> :5101
```

Browser flow at `http://localhost:5100`:
1. Create a project "UI Test" → appears in the list.
2. Add the fixture feed (`http://localhost:5999/sample-rss.xml`, adapter `rss`) with `serve-fixture.ts` running → appears under the project.
3. Click "Fetch now" → 2 posts appear in `PostsList`.
4. Filter by status → shows only `new`; mark a post `processed` → filter reflects it.

Command-line cross-check that the UI is only a consumer (no API calls without server):

```bash
# stop the server, the UI still renders but shows errors (no silent local data)
```

Phase is **done** only when: `bun run build` passes, the full flow works in the browser, and a `grep -r "fetch(" apps/client/src --include="*.ts*" -l` shows API calls only inside `lib/api.ts`.
