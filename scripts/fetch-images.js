// ============================================================================
// Fetch item images from arctracker.io's CDN into public/images/items/
// ============================================================================
// Images are committed and served by GitHub Pages alongside the site. Each
// image's ETag is stored so later runs send conditional requests: unchanged
// images answer 304 with no body, so a normal day downloads nothing.
// Images of items that left the data (or the visible set) are deleted.
// ============================================================================

import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  AMPLIFIED_WEAPON_ID_PATTERN,
  BLACKLISTED_ITEM_CATEGORIES,
} from "../src/constants/itemCategories";

const ROOT = join(import.meta.dir, "..");
const IMAGES_DIR = join(ROOT, "public/images/items");
const ETAGS_PATH = join(ROOT, "src/generated/imageEtags.json");
const CONCURRENCY = 6;
const USER_AGENT =
  "arc-raiders-recycle-tool (+https://github.com/SquaredCub/arc-raiders-recycle-tool)";

const items = await Bun.file(join(ROOT, "src/generated/items.json")).json();
const etags = existsSync(ETAGS_PATH) ? await Bun.file(ETAGS_PATH).json() : {};

// Items the site shows, plus anything they recycle or salvage into, and what
// they can be used to craft (the crafting page also shows hidden outputs such
// as keys and amplified weapons)
const shown = items.filter(
  (item) =>
    !BLACKLISTED_ITEM_CATEGORIES.includes(item.type) &&
    !AMPLIFIED_WEAPON_ID_PATTERN.test(item.id),
);
const shownIds = new Set(shown.map((item) => item.id));
const craftOutputIds = items
  .filter((item) => Object.keys(item.recipe ?? {}).some((id) => shownIds.has(id)))
  .map((item) => item.id);
const neededIds = new Set([
  ...shown.flatMap((item) => [
    item.id,
    ...Object.keys(item.recyclesInto ?? {}),
    ...Object.keys(item.salvagesInto ?? {}),
    ...(item.upgrades ?? []).map((upgrade) => upgrade.to),
  ]),
  ...craftOutputIds,
]);
const wanted = items.filter((item) => neededIds.has(item.id) && item.imageFilename);

mkdirSync(IMAGES_DIR, { recursive: true });

const stats = { unchanged: 0, downloaded: 0, failed: [] };

const fetchImage = async (item) => {
  const path = join(IMAGES_DIR, `${item.id}.png`);
  const headers = { "user-agent": USER_AGENT };
  if (etags[item.id] && existsSync(path)) headers["if-none-match"] = etags[item.id];

  const res = await fetch(item.imageFilename, { headers });
  if (res.status === 304) {
    stats.unchanged++;
    return;
  }
  if (!res.ok) throw new Error(`${res.status} ${item.imageFilename}`);

  await Bun.write(path, res);
  etags[item.id] = res.headers.get("etag");
  stats.downloaded++;
};

console.log(`🖼️  Checking ${wanted.length} item images...\n`);

const queue = [...wanted];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        await fetchImage(item);
      } catch (error) {
        stats.failed.push(`${item.id}: ${error.message}`);
      }
    }
  }),
);

// Prune images (and ETags) of items no longer shown
const wantedIds = new Set(wanted.map((item) => item.id));
let removed = 0;
for (const file of readdirSync(IMAGES_DIR)) {
  const id = file.replace(/\.png$/, "");
  if (!wantedIds.has(id)) {
    unlinkSync(join(IMAGES_DIR, file));
    removed++;
  }
}
for (const id of Object.keys(etags)) {
  if (!wantedIds.has(id)) delete etags[id];
}

const sortedEtags = Object.fromEntries(Object.entries(etags).sort());
await Bun.write(ETAGS_PATH, `${JSON.stringify(sortedEtags, null, 1)}\n`);

console.log(
  `✓ ${stats.downloaded} downloaded, ${stats.unchanged} unchanged, ${removed} removed`,
);
if (stats.failed.length) {
  console.error(`✗ ${stats.failed.length} failed:\n  ${stats.failed.join("\n  ")}`);
  process.exit(1);
}
