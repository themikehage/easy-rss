# Easy RSS

**Type:** PRODUCTION
**Description:** Minimalist, API-first tech-news feed aggregator. Ingests RSS, Atom, and JSON Feed sources organized by project, dedupes posts, and exposes them over a REST API. It is the ingestion layer of the YouTube-shorts pipeline but stays decoupled so any consumer (n8n, scripts, other services) can use it.
**Stack:** Bun, Hono, Zod, SQLite (`bun:sqlite`), Drizzle ORM, node-cron, fast-xml-parser, React, Vite, TypeScript, Tailwind CSS
**Deployment Target:** Deployed to Coolify (`https://easy-rss.pages.therry.dev`)
**Ports:** API `5101` (bound to `0.0.0.0`), UI `5100` (bound to `0.0.0.0`)

## Workspace layout

```
apps/server/      Bun + Hono + Zod + Drizzle (API, adapters, cron)
apps/client/      Vite + React + Tailwind (thin API consumer, no business logic)
packages/shared/  Zod schemas + shared TS types
docs/plans/       One implementation plan per phase (01-06)
```

## MVP success criteria

- Create a project, add 3+ feeds of different types (RSS + JSON Feed), and see new posts appear automatically every day with no duplicates.
- Adding a new adapter type requires no changes to API routes or the data model.
- The API works standalone, proven with curl.
