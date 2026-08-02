import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";

export function runMigrations(): void {
  migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
}
