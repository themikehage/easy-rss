import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, inArray } from "drizzle-orm";
import { CreateFeed, CreateProject, UpdateProject } from "shared";
import { db } from "../db";
import { feeds, posts, projects } from "../db/schema";

const router = new Hono();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

router.get("/", async (c) => {
  const rows = await db.select().from(projects);
  return c.json(rows);
});

router.post("/", zValidator("json", CreateProject), async (c) => {
  const { name } = c.req.valid("json");
  const [created] = await db
    .insert(projects)
    .values({ name, slug: slugify(name) })
    .returning();
  return c.json(created, 201);
});

router.patch("/:id", zValidator("json", UpdateProject), async (c) => {
  const id = Number(c.req.param("id"));
  const { name } = c.req.valid("json");
  const [updated] = await db
    .update(projects)
    .set({ name, slug: slugify(name) })
    .where(eq(projects.id, id))
    .returning();
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(updated);
});

router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return c.json({ error: "not found" }, 404);
  const feedRows = await db
    .select({ feedId: feeds.id })
    .from(feeds)
    .where(eq(feeds.projectId, id));
  if (feedRows.length > 0) {
    await db.delete(posts).where(
      inArray(
        posts.feedId,
        feedRows.map((f) => f.feedId),
      ),
    );
  }
  await db.delete(feeds).where(eq(feeds.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));
  return c.json({ message: "deleted" });
});

router.get("/:id/feeds", async (c) => {
  const id = Number(c.req.param("id"));
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return c.json({ error: "not found" }, 404);
  const rows = await db.select().from(feeds).where(eq(feeds.projectId, id));
  return c.json(rows);
});

router.post("/:id/feeds", zValidator("json", CreateFeed), async (c) => {
  const id = Number(c.req.param("id"));
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return c.json({ error: "not found" }, 404);
  const data = c.req.valid("json");
  const [created] = await db
    .insert(feeds)
    .values({
      url: data.url,
      name: data.name,
      adapterType: data.adapter_type,
      maxPosts: data.maxPosts ?? 50,
      projectId: id,
    })
    .returning();
  return c.json(created, 201);
});

export default router;
