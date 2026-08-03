import { eq } from "drizzle-orm";
import { AdapterType } from "shared";
import { db } from "../db";
import { feeds, posts } from "../db/schema";
import { adapterRegistry } from "../adapters";

export interface FetchResult {
  fetched: number;
  newPosts: number;
  lastFetchedAt: string | null;
  lastError: string | null;
}

export async function fetchFeed(feedId: number): Promise<FetchResult> {
  const now = new Date().toISOString();
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId));
  if (!feed) return { fetched: 0, newPosts: 0, lastFetchedAt: null, lastError: "feed not found" };

  try {
    const parsed = AdapterType.safeParse(feed.adapterType);
    const adapter = parsed.success ? adapterRegistry[parsed.data] : undefined;
    if (!adapter) throw new Error(`unsupported adapter type: ${feed.adapterType}`);

    const items = (await adapter.fetch(feed.url)).slice(0, feed.maxPosts);
    let newPosts = 0;
    for (const item of items) {
      const normalized = adapter.normalize(item);
      const inserted = await db
        .insert(posts)
        .values({
          feedId: feed.id,
          guid: normalized.guid,
          title: normalized.title,
          link: normalized.link,
          summary: normalized.summary,
          publishedAt: normalized.publishedAt,
          rawJson: JSON.stringify(item),
        })
        .onConflictDoNothing()
        .returning();
      if (inserted.length > 0) newPosts += 1;
    }

    await db.update(feeds).set({ lastFetchedAt: now, lastError: null }).where(eq(feeds.id, feed.id));
    return { fetched: items.length, newPosts, lastFetchedAt: now, lastError: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(feeds)
      .set({ lastFetchedAt: now, lastError: message })
      .where(eq(feeds.id, feed.id));
    return { fetched: 0, newPosts: 0, lastFetchedAt: now, lastError: message };
  }
}
