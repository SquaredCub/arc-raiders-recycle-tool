// ============================================================================
// Image Downloader (Bun Optimized)
// ============================================================================
import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";

const INPUT_FILE = join(import.meta.dir, "links.txt");
const OUTPUT_DIR = join(import.meta.dir, "output");

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Transforms a Wiki thumb URL into a full-sized PNG URL
 */
function toPngUrl(webpUrl) {
  try {
    const url = new URL(webpUrl);
    const parts = url.pathname.split("/thumb/");
    if (parts.length !== 2) return null;

    const [base, restPath] = parts;
    const rest = restPath.split("/");
    if (rest.length < 3) return null;

    const [dir1, dir2, filename] = rest;
    url.pathname = `${base}/${dir1}/${dir2}/${filename}`;
    return url.toString();
  } catch {
    return null;
  }
}

const normalizeFilename = (name) =>
  decodeURIComponent(name)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "_");

// 1. Read lines and filter
const fileContent = await Bun.file(INPUT_FILE).text();
const lines = fileContent
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

console.log(`🚀 Starting download of ${lines.length} images...\n`);

for (const webpUrl of lines) {
  const pngUrl = toPngUrl(webpUrl);
  if (!pngUrl) {
    console.log(`\x1b[33mSkipping invalid:\x1b[0m ${webpUrl}`);
    continue;
  }

  const filename = normalizeFilename(basename(pngUrl));
  const outputPath = join(OUTPUT_DIR, filename);

  try {
    // Bun Magic: fetch() the data and stream it directly to disk
    // This replaces the entire 20-line download() function and https module
    const response = await fetch(pngUrl);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    await Bun.write(outputPath, response);
    console.log(`\x1b[32m✓\x1b[0m Downloaded: ${filename}`);
  } catch (err) {
    console.error(`\x1b[31m✗\x1b[0m Failed ${filename}: ${err.message}`);
  }
}

console.log("\n✅ All downloads complete.");
