# AGENTS.md — Easy RSS

Non-negotiable rules for working in this repo. These are not suggestions. Every session starts by reading `about.md`, `steps.md`, and this file.

## Non-negotiable principles

1. **Adapters are decoupled from the core.** The fetch job, dedup, and persistence never know any feed format. They only talk to a `FeedAdapter` resolved from `adapterRegistry[feed.adapter_type]`. Adding a new feed type = add one adapter file + register it. Touching routes, models, or the fetch service to add a format is a violation.
2. **API-first.** The React app is a thin consumer. It contains zero business logic, zero DB access, and zero adapter logic. Everything it needs comes typed from `packages/shared`.
3. **Typed end-to-end, no `any`.** All request/response shapes and shared entities are Zod schemas in `packages/shared`, imported by both server and client. If a type isn't inferred from a Zod schema, it doesn't exist. `any` and `as unknown as X` are banned.
4. **Migrations, never sync.** All schema changes go through Drizzle (`drizzle-kit generate` + `migrate`). Never edit the DB by hand, never alter tables ad hoc.
5. **Robustness is per-feed, not per-batch.** Fetch errors are caught per feed and recorded in `feed.last_error` without aborting the job. One broken feed never takes down the daily run. Every fetch updates `last_fetched_at`.
6. **"Done" means verified.** No phase is complete until its curl smoke commands and typechecks pass. Never claim a phase is done on intent.
7. **No comments in production code.** Clear names carry intent. Comments are only allowed in test fixtures/documentation when they explain fixture data.
8. **Atomic conventional commits.** `type(scope): description` (e.g. `feat(api): add projects CRUD`). One logical change per commit, commit after each completed section, never commit secrets.
9. **Never use ports 5003 or 5551** (reserved for OpenCode Manager). Dev servers use `5100`–`5103` and bind `0.0.0.0`.

## Stack

- Runtime: Bun. Package manager: `bun` (workspaces). Use `bun add`, never npm/pnpm.
- API: Hono + Zod (`@hono/zod-validator`).
- DB: SQLite via `bun:sqlite` + Drizzle ORM. DB file: `apps/server/data/app.db`.
- Feeds: `fast-xml-parser` for RSS/Atom; custom adapter for JSON Feed.
- Scheduling: `node-cron` inside the Bun process.
- UI: Vite + React + TypeScript (strict) + Tailwind CSS.
- Verification: `bun run typecheck` (server/shared), `bun run build` (client), curl smoke scripts.

## Commands

```bash
bun install                 # workspace install (root)
cd apps/server && bun run dev          # watch mode on :5101
cd apps/server && bun run typecheck
cd apps/server && bun run build
cd apps/client && bun run dev          # :5100, proxies /api -> :5101
cd apps/client && bun run build
cd packages/shared && bun run typecheck
cd apps/server && bunx drizzle-kit generate && bunx drizzle-kit migrate
```

## Structure

```
apps/server/src/
  index.ts              Hono app bootstrap (CORS, logger, routes, cron start)
  routes/               One router per resource (projects, feeds, posts)
  db/schema.ts          Drizzle schema
  db/index.ts           DB connection (bun:sqlite -> drizzle)
  adapters/             FeedAdapter interface, registry, one file per format
  services/             fetchFeed, dedup, cron job
apps/client/src/
  lib/api.ts            Typed API client (only place that talks to the API)
  components/           UI components
packages/shared/src/    Zod schemas + inferred types (source of truth)
docs/plans/             Phase plans 01-06
```

## How to add a new adapter

1. Create `apps/server/src/adapters/<name>.ts` implementing `FeedAdapter`.
2. Register it in `apps/server/src/adapters/index.ts` under the new `adapter_type`.
3. Add the new value to the `adapter_type` Zod enum in `packages/shared`.
4. Run migrations only if the model changed (it shouldn't).
5. Verify with the curl flow from `docs/plans/06-json-feed-adapter.md`.

## Verification rules

- Server: `cd apps/server && bun run typecheck` then boot and curl.
- The API is the contract. If a change breaks a documented curl flow, the change is wrong.
- UI: `cd apps/client && bun run build` must pass.
- After finishing a phase, check off its box in `steps.md` and commit.

## Deploy

Deferred. No Dockerfile or deployment configuration yet. When it happens, document it here (platform, URLs, deploy commands, env vars).
