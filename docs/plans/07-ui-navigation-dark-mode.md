# Plan 07 — UI: Dark Mode, Feed Posts, Post Detail, Routing

## Objective

Improve the UI without breaking the API-first, adapter-decoupled rules:
1. Dark mode **on by default** with a light toggle (persisted in `localStorage`).
2. See the posts of a single **feed** in its own view.
3. See the detail of a single **post** in its own view (summary, feed, link, status actions).
4. Introduce **react-router-dom** so each view is a deep-linkable route.

The client stays a thin consumer: no business logic, no DB access, no adapters. All new request/response shapes are Zod schemas in `packages/shared`.

## Preconditions

- Phase 6 done: RSS, Atom, and JSON Feed adapters working; API complete.
- Dark-mode CSS variables already defined in `apps/client/src/index.css` (`.dark` block) but not active by default.

## Routes

| Route | View | Data |
| --- | --- | --- |
| `/` | Overview / empty state | none (sidebar drives navigation) |
| `/projects/:projectId` | Posts of all feeds in a project (existing list) | `GET /api/projects/:id/posts` |
| `/feeds/:feedId` | Posts of a single feed | new `GET /api/feeds/:id/posts` |
| `/posts/:postId` | Post detail | new `GET /api/posts/:id` |

## Tasks

### 7.1 Shared schemas (`packages/shared/src/schemas.ts`)
- `PostWithFeed = Post.extend({ feedName: z.string() })` — returned by `GET /api/posts/:id` so the detail view shows the feed name in one request.

### 7.2 Server routes
- `apps/server/src/routes/feeds.ts`: `GET /:id/posts` with the existing `PostQuery` validator (`status`, `since`). 404 if the feed does not exist; ordered by `publishedAt desc`.
- `apps/server/src/routes/posts.ts`: `GET /posts/:id` returning `{ ...post, feedName }`. 404 if the post does not exist. (PATCH already exists.)

No schema/migration changes — the data model is untouched.

### 7.3 Typed API client (`apps/client/src/lib/api.ts`)
- `listFeedPosts(feedId, { status?, since? }) → Post[]`
- `getPost(id) → PostWithFeed`

### 7.4 Dependency
- `bun add react-router-dom` in `apps/client`.

### 7.5 Dark mode default + toggle
- `apps/client/src/lib/theme.ts`: `useTheme` hook. Default `"dark"`; reads `localStorage` key `easy-rss-theme`; applies/removes the `dark` class on `document.documentElement`; sets `color-scheme` so form controls match.
- `apps/client/src/main.tsx`: apply the initial theme class **before** `createRoot` renders to avoid a flash of light.
- Header toggle button (sun/moon) that flips and persists the theme.

### 7.6 Layout + routing (`apps/client/src/App.tsx`)
- Wrap in `BrowserRouter`; `App` becomes the layout: header (title + theme toggle), sidebar (`ProjectsPanel`), and `<Routes>`.
- Sidebar derives the active project from `useParams` (`projectId`, or `feedId` resolved via `GET /api/feeds/:id`), so it can highlight the project and load that project's feeds.
- Keep a lightweight posts-refresh signal (context holding `refreshKey`) so "Fetch now" / "Add feed" bumps the posts list even across routes.

### 7.7 Sidebar (`ProjectsPanel.tsx`)
- Project entries become `NavLink`s to `/projects/:id`.
- Feed entries become `NavLink`s to `/feeds/:id`; keep add-feed, pause/activate, and "Fetch now".
- Creating a project navigates to `/projects/:id`.

### 7.8 Posts list (`PostsList.tsx`)
- Generalize scope: `{ scope: "project", projectId } | { scope: "feed", feedId }`.
- Reuse the status filter and mark processed/discard actions; title links to `/posts/:id`.

### 7.9 Post detail (`apps/client/src/pages/PostDetail.tsx`)
- Fetch `getPost(id)`; show title, feed name, published date, summary (rendered as HTML — JSON Feed summaries are `content_html`), status, status actions, and a link to the original post + back-to-feed link.

### 7.10 Commit
Commit after verification: `feat(ui): dark mode, feed posts, post detail with routing`.

## Verification (Definition of Done)

```bash
cd packages/shared && bun run typecheck
cd apps/server && bun run typecheck
cd apps/server && bun run src/fixtures/serve-fixture.ts &   # :5999
cd apps/server && PORT=5101 bun run src/index.ts &          # :5101
```

New API curl smoke:

```bash
curl -s http://localhost:5101/api/feeds/1/posts | jq length   # only this feed's posts
curl -s http://localhost:5101/api/feeds/999999/posts          # {"error":"not found"}
curl -s http://localhost:5101/api/posts/1 | jq '{id, feedName, title}'
curl -s http://localhost:5101/api/posts/999999                # {"error":"not found"}
```

UI:

```bash
cd apps/client && bun run build       # must pass
cd apps/client && bun run dev &       # :5100
```

Browser flow at `http://localhost:5100`:
1. Page loads **dark**; toggle switches to light and persists across reloads.
2. Click a project → project posts (existing behavior, URL `/projects/:id`).
3. Click a feed → only that feed's posts (`/feeds/:id`); "Fetch now" refreshes the list.
4. Click a post → detail view (`/posts/:id`); status actions work; back button returns to the feed.
5. Direct-load each route URL (deep link) renders correctly.

Phase is **done** only when: both typechecks pass, client build passes, and the new curl smoke and browser flow work. `grep -r "fetch(" apps/client/src --include="*.ts*" -l` still only lists `lib/api.ts`.
