import { eq } from "drizzle-orm";
import cron from "node-cron";
import { db } from "../db";
import { feeds } from "../db/schema";
import { fetchFeed } from "./fetchFeed";

export function startCron(): void {
  const schedule = process.env.FETCH_CRON ?? "0 8 * * *";
  cron.schedule(schedule, () => {
    void runDailyFetch();
  });
  console.log(`[cron] scheduled ${schedule}`);
}

export async function runDailyFetch(): Promise<void> {
  const active = await db.select().from(feeds).where(eq(feeds.active, true));
  let fetched = 0;
  let failed = 0;
  for (const feed of active) {
    try {
      const result = await fetchFeed(feed.id);
      if (result.lastError) failed += 1;
      else fetched += 1;
    } catch {
      failed += 1;
    }
  }
  console.log(`[cron] ${active.length} active feeds, ${fetched} fetched, ${failed} failed`);
}
