// ============================================================================
// Serve Compare Page (Bun) + image adoption endpoint
// ----------------------------------------------------------------------------
// Static-only pages can't write to disk (browser sandbox), so this tiny server
// backs the "use in repo" buttons. It:
//   GET  /                     -> the generated compare page
//   GET  /repo/<file>          -> a repo image (src/arcraiders-data/images/items)
//   POST /use {filename, url}  -> download <url>, overwrite the repo image
//
// Build the page first, then serve:
//   bun image-tools/build-source-compare.js
//   bun image-tools/serve-compare.js   ->  http://localhost:5258
// ============================================================================
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const IMAGES_FOLDER = join(ROOT, "src/arcraiders-data/images/items");
const PAGE = join(import.meta.dir, "compare-sources/index.html");
const PORT = 5258;
const USER_AGENT = "arc-raiders-recycle-tool image adopter (github.com/SquaredCub)";

// Guard rails: only plain item filenames, only trusted image hosts.
const SAFE_FILENAME = /^[a-z0-9_]+\.png$/i;
const ALLOWED_HOSTS = new Set([
  "cdn.arctracker.io",
  "arctracker.io",
  "arcraiders.wiki",
]);

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // page
    if (req.method === "GET" && url.pathname === "/") {
      const file = Bun.file(PAGE);
      if (!(await file.exists()))
        return new Response(
          "Page not built. Run: bun image-tools/build-source-compare.js",
          { status: 503 },
        );
      return new Response(file, { headers: { "Content-Type": "text/html" } });
    }

    // repo image
    if (req.method === "GET" && url.pathname.startsWith("/repo/")) {
      const name = decodeURIComponent(url.pathname.slice("/repo/".length));
      if (!SAFE_FILENAME.test(name)) return new Response("bad name", { status: 400 });
      const file = Bun.file(join(IMAGES_FOLDER, name));
      if (!(await file.exists())) return new Response("not found", { status: 404 });
      return new Response(file, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // adopt an image into the repo
    if (req.method === "POST" && url.pathname === "/use") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid json" }, 400);
      }
      const { filename, url: src } = body ?? {};

      if (!filename || !SAFE_FILENAME.test(filename))
        return json({ error: `unsafe filename: ${filename}` }, 400);

      let srcUrl;
      try {
        srcUrl = new URL(src);
      } catch {
        return json({ error: "invalid source url" }, 400);
      }
      if (!ALLOWED_HOSTS.has(srcUrl.hostname))
        return json({ error: `host not allowed: ${srcUrl.hostname}` }, 400);

      try {
        const res = await fetch(srcUrl, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) return json({ error: `download HTTP ${res.status}` }, 502);
        const bytes = new Uint8Array(await res.arrayBuffer());
        // sanity: must be a PNG (magic bytes)
        if (bytes[0] !== 0x89 || bytes[1] !== 0x50)
          return json({ error: "not a PNG" }, 422);
        await Bun.write(join(IMAGES_FOLDER, filename), bytes);
        console.log(`✓ ${filename} <- ${srcUrl.href}`);
        return json({ ok: true, filename, bytes: bytes.length });
      } catch (err) {
        console.error(`✗ ${filename}:`, err.message);
        return json({ error: err.message }, 500);
      }
    }

    return new Response("not found", { status: 404 });
  },
});

console.log(`🖼  Compare server: http://localhost:${server.port}`);
console.log(`   writing into ${IMAGES_FOLDER}`);
