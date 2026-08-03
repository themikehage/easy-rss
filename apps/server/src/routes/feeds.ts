import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte } from "drizzle-orm";
import { PostQuery, UpdateFeed } from "shared";
import { db } from "../db";
import { feeds, posts } from "../db/schema";
import { fetchFeed } from "../services/fetchFeed";

const router = new Hono();

router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
  if (!feed) return c.json({ error: "not found" }, 404);
  return c.json(feed);
});

router.get("/:id/posts", zValidator("query", PostQuery), async (c) => {
  const id = Number(c.req.param("id"));
  const { status, since } = c.req.valid("query");
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
  if (!feed) return c.json({ error: "not found" }, 404);

  const conditions = [eq(posts.feedId, id)];
  if (status) conditions.push(eq(posts.status, status));
  if (since) conditions.push(gte(posts.fetchedAt, since));

  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt));
  return c.json(rows);
});

router.patch("/:id", zValidator("json", UpdateFeed), async (c) => {
  const id = Number(c.req.param("id"));
  const patch = c.req.valid("json");
  const [updated] = await db.update(feeds).set(patch).where(eq(feeds.id, id)).returning();
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(updated);
});

router.post("/:id/fetch", async (c) => {
  const id = Number(c.req.param("id"));
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
  if (!feed) return c.json({ error: "not found" }, 404);
  const result = await fetchFeed(id);
  const [updated] = await db.select().from(feeds).where(eq(feeds.id, id));
  return c.json({ ...result, feed: updated });
});

router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
  if (!feed) return c.json({ error: "not found" }, 404);
  await db.delete(posts).where(eq(posts.feedId, id));
  await db.delete(feeds).where(eq(feeds.id, id));
  return c.json({ message: "deleted" });
});

export default router;
