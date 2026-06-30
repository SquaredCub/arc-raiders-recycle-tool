// ============================================================================
// Fetch Missing Images (Bun)
// ----------------------------------------------------------------------------
// 1. Finds items whose image asset is missing (same logic as
//    check-missing-images.js)
// 2. Resolves the image URL from the ARC Raiders wiki via the MediaWiki API
// 3. Downloads the full-resolution PNG
// 4. Saves it under the EXPECTED filename (derived from item data) directly
//    into the images folder — no manual rename needed
//
// Items whose wiki File page can't be auto-resolved (e.g. variant names that
// differ from the in-game name) are reported at the end for manual handling.
// ============================================================================
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dir, "..");
const ITEMS_PATH = join(ROOT_DIR, "src/generated/items.json");
const IMAGES_FOLDER = join(ROOT_DIR, "src/arcraiders-data/images/items");
const WIKI_API = "https://arcraiders.wiki/w/api.php";
const USER_AGENT = "arc-raiders-recycle-tool image fetcher (github.com/SquaredCub)";

const BLACKLISTED_CATEGORIES = ["Key", "Blueprint"];

// ANSI colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

// Expected on-disk filename for an item (mirrors check-missing-images.js)
const getExpectedFilename = (item) => {
  if (item.imageFilename) return item.imageFilename.split("/").pop();
  return item.id ? `${item.id}.png` : undefined;
};

// Turn an item English name into a wiki File: title.
// Wiki File names don't include decorative double-quotes the in-game name may
// carry (e.g. '"Leviathan\'s Crown" Ship Model' -> File:Leviathan's_Crown_Ship_Model.png).
const toFileTitle = (name) =>
  `File:${name.replace(/"/g, "").replace(/ /g, "_")}.png`;

const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

// fetch with a hard timeout (AbortSignal) + retry on timeout/network/5xx.
// Without this a single stalled request blocks the whole sequential loop.
const fetchWithRetry = async (url, label) => {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await Bun.sleep(500 * attempt); // backoff
        console.log(`${YELLOW}↻${NC} retry ${attempt}/${MAX_RETRIES - 1} — ${label}`);
      }
    }
  }
  throw lastErr;
};

const apiQuery = async (params) => {
  const url = `${WIKI_API}?${new URLSearchParams(params)}`;
  const res = await fetchWithRetry(url, `api ${params.titles ?? params.srsearch ?? ""}`);
  if (!res.ok) return null;
  return res.json();
};

// Direct lookup of a File: title -> image URL (null if the page is missing).
const imageUrlForTitle = async (fileTitle) => {
  const data = await apiQuery({
    action: "query",
    titles: fileTitle,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
  });
  const pages = data?.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    if (page.missing !== undefined || !page.imageinfo) continue;
    const url = page.imageinfo[0]?.url;
    if (url) return url;
  }
  return null;
};

// Fallback: search the File namespace and return the top hit's image URL.
const searchImageUrl = async (name) => {
  const data = await apiQuery({
    action: "query",
    list: "search",
    srsearch: name.replace(/"/g, ""),
    srnamespace: "6", // File namespace
    srlimit: "1",
    format: "json",
  });
  const top = data?.query?.search?.[0]?.title;
  return top ? imageUrlForTitle(top) : null;
};

// Resolve an item's image URL: try the exact File title, then a search fallback.
const resolveImageUrl = async (name) => {
  const direct = await imageUrlForTitle(toFileTitle(name));
  if (direct) return direct;
  return searchImageUrl(name);
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const items = await Bun.file(ITEMS_PATH).json();

const filteredItems = items.filter((item) => {
  const isValidType = !BLACKLISTED_CATEGORIES.includes(item.type);
  const isNotCoins = item.id !== "coins";
  const hasValue = (item.value ?? 0) > 0;
  return isValidType && isNotCoins && hasValue;
});

// Find missing images
const missing = [];
for (const item of filteredItems) {
  const expectedFilename = getExpectedFilename(item);
  if (!expectedFilename) continue;
  const file = Bun.file(join(IMAGES_FOLDER, expectedFilename));
  if (!(await file.exists())) {
    missing.push({ item, expectedFilename });
  }
}

if (missing.length === 0) {
  console.log(`\n${GREEN}✅ No missing images. Nothing to fetch.${NC}\n`);
  process.exit(0);
}

console.log(`\n🔍 ${missing.length} missing image(s). Resolving from wiki...\n`);

const unresolved = [];
let downloaded = 0;

for (const { item, expectedFilename } of missing) {
  const name = item.name?.en ?? item.id;
  const fileTitle = toFileTitle(name);

  try {
    const url = await resolveImageUrl(name);
    if (!url) {
      unresolved.push({ name, expectedFilename, fileTitle });
      console.log(`${YELLOW}?${NC} ${name} — no wiki File page (${fileTitle})`);
      continue;
    }

    const res = await fetchWithRetry(url, `download ${expectedFilename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    await Bun.write(join(IMAGES_FOLDER, expectedFilename), res);
    downloaded++;
    console.log(`${GREEN}✓${NC} ${name} → ${expectedFilename}`);
  } catch (err) {
    unresolved.push({ name, expectedFilename, fileTitle, error: err.message });
    console.log(`${RED}✗${NC} ${name} — ${err.message}`);
  }
}

// Summary
console.log(`\n${BOLD}Done: ${downloaded}/${missing.length} downloaded.${NC}`);

if (unresolved.length > 0) {
  console.log(
    `\n${YELLOW}${BOLD}${unresolved.length} need manual handling:${NC}`,
  );
  for (const u of unresolved) {
    console.log(`  - ${u.name} (${u.expectedFilename}) — tried ${u.fileTitle}`);
  }
  console.log(
    `\nFind the correct wiki File page, then add its image to ` +
      `src/arcraiders-data/images/items/ as the expected filename above.\n`,
  );
}
