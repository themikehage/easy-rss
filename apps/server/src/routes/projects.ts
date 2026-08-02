import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { CreateFeed, CreateProject } from "shared";
import { db } from "../db";
import { feeds, projects } from "../db/schema";

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
  const [created] = await db.insert(feeds).values({ ...data, projectId: id }).returning();
  return c.json(created, 201);
});

export default router;
