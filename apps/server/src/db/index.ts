import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const dataDir = process.env.DATA_DIR ?? join(import.meta.dir, "../../data");
mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(join(dataDir, "app.db"), { create: true });
export const db = drizzle(sqlite, { schema });
