import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import projectsRouter from "./routes/projects";
import feedsRouter from "./routes/feeds";
import postsRouter from "./routes/posts";
import { startCron } from "./services/cron";
import { runMigrations } from "./db/migrate";

const app = new Hono();

app.use("/*", cors());
app.use("/*", logger());

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/projects", projectsRouter);
app.route("/api/feeds", feedsRouter);
app.route("/api", postsRouter);

app.use("/assets/*", serveStatic({ root: "./public" }));
app.use("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));
app.notFound(async (c) => {
  if (c.req.path.startsWith("/api")) return c.json({ error: "Not Found" }, 404);
  const index = await readFile(join(process.cwd(), "public", "index.html"));
  return c.html(index.toString());
});

runMigrations();
startCron();

const port = Number(process.env.PORT ?? 5101);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
