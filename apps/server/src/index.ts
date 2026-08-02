import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use("/*", cors());
app.use("/*", logger());

app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 5101);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
