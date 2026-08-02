import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");
const port = 5999;

const mime: Record<string, string> = {
  ".xml": "application/xml",
  ".json": "application/json",
};

Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    const filePath = join(fixturesDir, url.pathname);
    if (!filePath.startsWith(fixturesDir)) return new Response("forbidden", { status: 403 });
    const file = Bun.file(filePath);
    if (!(await file.exists())) return new Response("not found", { status: 404 });
    return new Response(file, {
      headers: { "Content-Type": mime[extname(filePath)] ?? "application/octet-stream" },
    });
  },
});

console.log(`fixture server listening on http://0.0.0.0:${port}`);
