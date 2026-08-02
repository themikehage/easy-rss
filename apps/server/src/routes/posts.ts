import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { PostQuery, UpdatePost } from "shared";
import { db } from "../db";
import { feeds, posts, projects } from "../db/schema";

const router = new Hono();

router.get("/projects/:id/posts", zValidator("query", PostQuery), async (c) => {
  const id = Number(c.req.param("id"));
  const { status, since } = c.req.valid("query");
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return c.json({ error: "not found" }, 404);

  const feedRows = await db.select().from(feeds).where(eq(feeds.projectId, id));
  if (feedRows.length === 0) return c.json([]);

  const feedIds = feedRows.map((f) => f.id);
  const conditions = [inArray(posts.feedId, feedIds)];
  if (status) conditions.push(eq(posts.status, status));
  if (since) conditions.push(gte(posts.fetchedAt, since));

  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt));
  return c.json(rows);
});

router.patch("/posts/:id", zValidator("json", UpdatePost), async (c) => {
  const id = Number(c.req.param("id"));
  const { status } = c.req.valid("json");
  const [updated] = await db.update(posts).set({ status }).where(eq(posts.id, id)).returning();
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(updated);
});

export default router;
