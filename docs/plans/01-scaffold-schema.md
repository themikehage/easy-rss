# Plan 01 — Scaffold + Schema + Migrations

## Objective

A working Bun monorepo where:
- The server answers `GET /api/health` on port `5101` (bound to `0.0.0.0`).
- The client builds and dev-serves on port `5100`, proxying `/api` to the server.
- The shared package typechecks and holds the Zod source of truth.
- The SQLite database is created **only** via a generated Drizzle migration, containing `projects`, `feeds`, and `posts` with `UNIQUE(feed_id, guid)`.

## Preconditions

- Empty repo on `master`, no commits.
- Follow the workspace layout in `about.md` and the conventions in `AGENTS.md`.

## Tasks

### 1.1 Workspace skeleton
1. Create `apps/server`, `apps/client`, `packages/shared`.
2. Root `package.json` with Bun workspaces: `["apps/*", "packages/*"]`.
3. Root `.gitignore`: `node_modules`, `dist`, `*.log`, `apps/server/data/`, `.env`.

### 1.2 Shared package (`packages/shared`)
1. `bun init`; `package.json` with `"type": "module"`, `"main": "./src/index.ts"`, `"types": "./src/index.ts"`.
2. `tsconfig.json`: strict, `moduleResolution: bundler`, `noEmit`.
3. Define initial Zod schemas in `src/schemas.ts`, re-export from `src/index.ts`:
   - `Project` (id, name, slug, createdAt)
   - `Feed` (id, projectId, url, name, adapterType, active, lastFetchedAt, lastError, createdAt)
   - `Post` (id, feedId, guid, title, link, summary, publishedAt, fetchedAt, status, rawJson)
   - `AdapterType = z.enum(["rss", "atom", "json_feed"])`
   - `PostStatus = z.enum(["new", "processed", "discarded"])`
   - `CreateProject` and `CreateFeed` input schemas.
   - Infer and export types with `z.infer`.
4. Add a `typecheck` script (`tsc --noEmit`).

### 1.3 Server (`apps/server`)
1. `bun init`; add scripts `dev` (watch on 5101), `build`, `typecheck`.
2. Install: `hono`, `zod`, `@hono/zod-validator`, `drizzle-orm`, `node-cron`, `fast-xml-parser`; dev: `@types/bun`, `typescript`, `drizzle-kit`.
3. `tsconfig.json`: strict, `noEmit`, `@/*` alias → `./src/*`.
4. `src/db/schema.ts` (Drizzle `sqliteTable`):
   - `projects`: `id` (int pk autoincrement), `name` (text notNull), `slug` (text notNull unique), `created_at` (text ISO notNull).
   - `feeds`: `id`, `project_id` (fk → projects.id), `url` (text notNull), `name` (text notNull), `adapter_type` (text notNull), `active` (int/bool default 1), `last_fetched_at` (text nullable), `last_error` (text nullable), `created_at`.
   - `posts`: `id`, `feed_id` (fk → feeds.id), `guid` (text notNull), `title`, `link`, `summary`, `published_at` (text nullable), `fetched_at`, `status` (text default `'new'`), `raw_json` (text). **Unique constraint `UNIQUE(feed_id, guid)`.**
5. `src/db/index.ts`: `Database` from `bun:sqlite` at `data/app.db` → `drizzle(sqlite, { schema })`.
6. `drizzle.config.ts`: schema, out `./drizzle`, dialect `sqlite`, DB file.
7. `src/index.ts`: Hono app with `cors()` + `logger()`, `GET /api/health` → `{ status: "ok" }`, listen on port from `PORT` env default `5101`, hostname `0.0.0.0`.
8. Run `bunx drizzle-kit generate` + `bunx drizzle-kit migrate`.

### 1.4 Client (`apps/client`)
1. `bun create vite . --template react-ts`; install `tailwindcss` (v4), `framer-motion`.
2. `tsconfig` strict + `@/*` alias; `vite.config.ts` alias + dev server `port: 5100`, `host: '0.0.0.0'`, proxy `/api` → `http://localhost:5101`.
3. Minimal `index.css` (Tailwind v4 `@import "tailwindcss"`, no custom reset rules).

### 1.5 First commit
Commit after verification: `chore(init): scaffold monorepo, schema, and migrations`.

## Verification (Definition of Done)

```bash
cd packages/shared && bun run typecheck
cd apps/server && bun run typecheck
cd apps/client && bun run build
```

Boot the server and check health:

```bash
cd apps/server && PORT=5101 bun run src/index.ts &
sleep 1
curl -s http://localhost:5101/api/health   # {"status":"ok"}
```

Confirm the database exists and was created by the migration:

```bash
ls apps/server/data/app.db
ls apps/server/drizzle                    # migration .sql files present
sqlite3 apps/server/data/app.db ".schema posts"   # shows UNIQUE(feed_id, guid)
```

Phase is **done** only when: all three typecheck/build commands pass, health returns `{"status":"ok"}`, the migration created `data/app.db` with the `UNIQUE(feed_id, guid)` constraint visible in the schema.
