import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const feeds = sqliteTable("feeds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id),
  url: text("url").notNull(),
  name: text("name").notNull(),
  adapterType: text("adapter_type").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastFetchedAt: text("last_fetched_at"),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id),
    guid: text("guid").notNull(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    summary: text("summary").notNull(),
    publishedAt: text("published_at"),
    fetchedAt: text("fetched_at").notNull().$defaultFn(() => new Date().toISOString()),
    status: text("status", { enum: ["new", "processed", "discarded"] })
      .notNull()
      .default("new"),
    rawJson: text("raw_json"),
  },
  (t) => [unique("unique_feed_guid").on(t.feedId, t.guid)],
);
