// ============================================================================
// Build Source Compare Page (Bun)
// ----------------------------------------------------------------------------
// One static page comparing each item's image across FOUR sources:
//   1. repo       — the image we actually ship (src/arcraiders-data/images/items)
//   2. data       — imageFilename from the JSON (arctracker /items/v2/ CDN)
//   3. arctracker — what the live site actually serves (scraped per-item)
//   4. wiki       — arcraiders.wiki file (resolved via MediaWiki API)
//
// Each card gets a status LED computed by PERCEPTUAL hashing (average-hash) —
// CF resizing + recompression mean bytes never match even for identical art,
// so we compare downscaled grayscale fingerprints instead:
//   GREEN   repo == data == arctracker  (everything agrees)
//   YELLOW  repo == arctracker          (matches the live site, data differs)
//   ORANGE  repo == wiki                (matches wiki art)
//   GRAY    repo present, matches none  (unique local art)
//   RED     no repo image
//
// Buttons on the page write into the repo, which needs the companion server:
//   bun image-tools/build-source-compare.js   # generate the page
//   bun image-tools/serve-compare.js          # serve at http://localhost:5258
// ============================================================================
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";

const ROOT = join(import.meta.dir, "..");
const ITEMS_PATH = join(ROOT, "src/generated/items.json");
const IMAGES_FOLDER = join(ROOT, "src/arcraiders-data/images/items");
const OUT = join(import.meta.dir, "compare-sources");
const WIKI_API = "https://arcraiders.wiki/w/api.php";
const USER_AGENT = "arc-raiders-recycle-tool source compare (github.com/SquaredCub)";

const BLACKLISTED_CATEGORIES = ["Key", "Blueprint"];
const CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
// perceptual color fingerprint: downscale to FP_SIZE x FP_SIZE RGB cells and
// compare by mean per-cell color distance. Two images are "the same art" when
// that distance is <= COLOR_THRESHOLD (same art ~0-10, different art ~30+).
const FP_SIZE = 16;
const COLOR_THRESHOLD = 18;

// --- wiki resolution (mirrors fetch-missing-images.js) ---------------------
const toFileTitle = (name) =>
  `File:${name.replace(/"/g, "").replace(/ /g, "_")}.png`;

const fetchWithRetry = async (url) => {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.status === 429 || res.status >= 500)
        throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await Bun.sleep(400 * attempt);
    }
  }
  throw lastErr;
};

const apiQuery = async (params) => {
  const res = await fetchWithRetry(`${WIKI_API}?${new URLSearchParams(params)}`);
  return res.ok ? res.json() : null;
};

const imageUrlForTitle = async (fileTitle) => {
  const data = await apiQuery({
    action: "query",
    titles: fileTitle,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
  });
  for (const page of Object.values(data?.query?.pages ?? {})) {
    if (page.missing !== undefined || !page.imageinfo) continue;
    if (page.imageinfo[0]?.url) return page.imageinfo[0].url;
  }
  return null;
};

const searchImageUrl = async (name) => {
  const data = await apiQuery({
    action: "query",
    list: "search",
    srsearch: name.replace(/"/g, ""),
    srnamespace: "6",
    srlimit: "1",
    format: "json",
  });
  const top = data?.query?.search?.[0]?.title;
  return top ? imageUrlForTitle(top) : null;
};

// A few items can't be found from their in-game name because the wiki files it
// under the rarity, not the colour (e.g. "Colorful Shoes (Green)" lives at
// File:Colorful_Shoes_Epic.png). Used only after the exact-name lookup fails,
// and before the fuzzy search, so it can't shadow a correct direct hit.
const WIKI_FILE_OVERRIDES = {
  colorful_shoes_green: "File:Colorful_Shoes_Epic.png",
  colorful_shoes_red: "File:Colorful_Shoes_Rare.png",
  colorful_shoes_silver: "File:Colorful_Shoes_Legendary.png",
};

// Returns { url, aliased }: aliased=true when we had to fall back to a known
// override title (i.e. the item's name doesn't match its wiki file → dodgy).
const resolveWikiUrl = async (id, name) => {
  const direct = await imageUrlForTitle(toFileTitle(name));
  if (direct) return { url: direct, aliased: false };

  const override = WIKI_FILE_OVERRIDES[id];
  if (override) {
    const o = await imageUrlForTitle(override);
    if (o) return { url: o, aliased: true };
  }
  return { url: await searchImageUrl(name), aliased: false };
};

// --- arctracker: scrape the item page for the REAL image -------------------
// The item's page is ground truth. We read its <meta og:image>, which is the
// canonical hero image — this transparently handles the cases the data gets
// wrong: variants that reuse a base image (extended_barrel_*, rascal_*) and
// the inconsistent /v2/ vs bare /items/ path.
//
// SLUG_OVERRIDES: a few items live under a different page slug on arctracker
// than their data id (their bug, not ours) and can't be discovered
// programmatically — e.g. our "colorful_shoes_*" is their "football_shoes_*".
// Used only as a FALLBACK: we always try the real id first, so if they ever
// fix their slugs this map silently becomes dead weight rather than wrong.
const SLUG_OVERRIDES = {
  colorful_shoes_green: "football_shoes_green",
  colorful_shoes_red: "football_shoes_red",
  colorful_shoes_silver: "football_shoes_silver",
};

// Scrape one arctracker item page. Returns { cdn, missing }:
//   cdn     — canonical CDN image url (from <meta og:image>), or null
//   missing — true when og:image is their fallback logo under /misc/
//             (i.e. arctracker genuinely has no item image)
const scrapePage = async (slug) => {
  try {
    const res = await fetchWithRetry(`https://arctracker.io/items/${slug}`);
    if (!res.ok) return { cdn: null, missing: false };
    const html = await res.text();

    const og = html
      .match(/<meta[^>]+property=["']og:image["'][^>]*>/i)?.[0]
      ?.match(/content=["']([^"']+)["']/i)?.[1];

    if (og && /\/misc\//.test(og)) return { cdn: null, missing: true };
    if (og && /cdn\.arctracker\.io\/items\//.test(og))
      return { cdn: og, missing: false };

    // Fallback: first item image referenced anywhere on the page
    const any = html.match(
      /https:\/\/cdn\.arctracker\.io\/items\/(?:v2\/)?[a-z0-9_]+\.png/i,
    )?.[0];
    return { cdn: any ?? null, missing: false };
  } catch {
    return { cdn: null, missing: false };
  }
};

// Resolve an item's arctracker image: try its real id first, then fall back to
// a known slug override only if the real page yields nothing.
const resolveArctrackerCdn = async (id) => {
  const primary = await scrapePage(id);
  if (primary.cdn) return { ...primary, aliased: false };

  const alt = SLUG_OVERRIDES[id];
  if (alt) {
    const fallback = await scrapePage(alt);
    if (fallback.cdn) return { ...fallback, aliased: true };
  }
  return { ...primary, aliased: false }; // preserve the real page's missing flag
};

// --- source URL builders ----------------------------------------------------
// arctracker's live site renders the item via its Cloudflare image-resize
// proxy wrapping the canonical CDN path — which is the /v2/ path stored in
// imageFilename (weapons ONLY exist at /v2/; the bare /items/ path is a legacy
// asset present for some items only).
const CF = "https://arctracker.io/cdn-cgi/image/width=384";
const arctrackerLiveUrl = (cdnUrl) => `${CF}/${cdnUrl}`;

// --- perceptual hashing -----------------------------------------------------
const getExpectedFilename = (item) =>
  item.imageFilename ? item.imageFilename.split("/").pop() : `${item.id}.png`;

// Color fingerprint of a PNG: downscale to FP_SIZE x FP_SIZE RGB cell averages
// (Float64Array of FP_SIZE*FP_SIZE*3, 0-255). Returns null if undecodable.
// We keep COLOR — a grayscale hash collides recolored variants (red vs green
// shoe have the same shape, so they desaturate to the same fingerprint).
const fingerprint = (buf) => {
  let png;
  try {
    png = PNG.sync.read(Buffer.from(buf));
  } catch {
    return null;
  }
  const { width: W, height: H, data } = png;
  const fp = new Float64Array(FP_SIZE * FP_SIZE * 3);
  for (let gy = 0; gy < FP_SIZE; gy++) {
    for (let gx = 0; gx < FP_SIZE; gx++) {
      const x0 = Math.floor((gx * W) / FP_SIZE);
      const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * W) / FP_SIZE));
      const y0 = Math.floor((gy * H) / FP_SIZE);
      const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * H) / FP_SIZE));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (y * W + x) << 2;
          const a = data[o + 3] / 255; // composite over white so padding is neutral
          r += data[o] * a + 255 * (1 - a);
          g += data[o + 1] * a + 255 * (1 - a);
          b += data[o + 2] * a + 255 * (1 - a);
          n++;
        }
      }
      const c = (gy * FP_SIZE + gx) * 3;
      fp[c] = r / n;
      fp[c + 1] = g / n;
      fp[c + 2] = b / n;
    }
  }
  return fp;
};

// Mean per-cell color distance (euclidean over RGB) between two fingerprints.
// Tolerant to resize/recompression (same art ~0-10), separates different art
// and recolors (~30+). Returns Infinity if either is missing.
const colorDist = (a, b) => {
  if (a == null || b == null) return Infinity;
  let sum = 0;
  const cellCount = a.length / 3;
  for (let i = 0; i < a.length; i += 3) {
    const dr = a[i] - b[i];
    const dg = a[i + 1] - b[i + 1];
    const db = a[i + 2] - b[i + 2];
    sum += Math.sqrt(dr * dr + dg * dg + db * db);
  }
  return sum / cellCount;
};

const sameImg = (a, b) => colorDist(a, b) <= COLOR_THRESHOLD;

// Fetch raw image bytes -> Uint8Array, or null on failure.
const fetchBytes = async (url) => {
  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
};

// --- main -------------------------------------------------------------------
const items = await Bun.file(ITEMS_PATH).json();
const filtered = items.filter(
  (it) =>
    !BLACKLISTED_CATEGORIES.includes(it.type) &&
    it.id !== "coins" &&
    (it.value ?? 0) > 0,
);

console.log(`📊 Resolving wiki URLs for ${filtered.length} items (×${CONCURRENCY})...`);

// Simple concurrency pool
const rows = new Array(filtered.length);
let cursor = 0;
let wikiResolved = 0;
let arcScraped = 0;
const statusTally = { all: 0, arc: 0, stale: 0, wiki: 0, unmatched: 0, nolocal: 0 };

const worker = async () => {
  while (cursor < filtered.length) {
    const i = cursor++;
    const it = filtered[i];
    const name = it.name?.en ?? it.id;
    const dataUrl =
      it.imageFilename ?? `https://cdn.arctracker.io/items/v2/${it.id}.png`;

    // resolve wiki url + arctracker's real cdn image url
    const [wikiRes, arc] = await Promise.all([
      resolveWikiUrl(it.id, name).catch(() => ({ url: null, aliased: false })),
      resolveArctrackerCdn(it.id),
    ]);
    const wikiUrl = wikiRes.url;
    if (wikiUrl) wikiResolved++;
    if (arc.cdn) arcScraped++;
    const arcCdn = arc.cdn; // raw cdn image url (null if missing/unresolved)

    // local repo image
    const expectedFilename = getExpectedFilename(it);
    const localPath = join(IMAGES_FOLDER, expectedFilename);
    const localFile = Bun.file(localPath);
    const hasLocal = await localFile.exists();

    // fetch the raw bytes we need for hashing (dedupe identical urls)
    const [localBuf, arcBuf, wikiBuf, dataBufRaw] = await Promise.all([
      hasLocal ? localFile.bytes() : null,
      arcCdn ? fetchBytes(arcCdn) : null,
      wikiUrl ? fetchBytes(wikiUrl) : null,
      // data image only needed if its url differs from arctracker's
      arcCdn && arcCdn === dataUrl ? null : fetchBytes(dataUrl),
    ]);

    const hLocal = localBuf ? fingerprint(localBuf) : null;
    const hArc = arcBuf ? fingerprint(arcBuf) : null;
    const hWiki = wikiBuf ? fingerprint(wikiBuf) : null;
    // if data url == arctracker url, the data image IS the arctracker image
    const hData =
      arcCdn && arcCdn === dataUrl
        ? hArc
        : dataBufRaw
          ? fingerprint(dataBufRaw)
          : null;

    // distances from the repo image to each source (Infinity if unavailable)
    const dArc = colorDist(hLocal, hArc);
    const dWiki = colorDist(hLocal, hWiki);
    const dData = colorDist(hLocal, hData);

    // classify by NEAREST match (not source priority) so a recolored variant
    // doesn't get mis-assigned to a structurally-similar but wrong source.
    let status;
    if (!hasLocal) status = "nolocal";
    else if (dData <= COLOR_THRESHOLD && dArc <= COLOR_THRESHOLD) status = "all";
    else if (dArc <= COLOR_THRESHOLD && dArc <= dWiki) status = "arc";
    else if (dWiki <= COLOR_THRESHOLD)
      // repo matches wiki; if data+arctracker now agree on a different image,
      // arctracker has caught up — repo is stale and should be swapped to it
      status = sameImg(hData, hArc) ? "stale" : "wiki";
    else status = "unmatched";
    statusTally[status]++;

    // collect everything suspicious about this item's data
    const dataSeparate = !(arcCdn && arcCdn === dataUrl);
    const flags = [];
    if (!hasLocal) flags.push("no-repo");
    if (status === "unmatched") flags.push("unmatched");
    if (status === "stale") flags.push("stale");
    if (arc.missing) flags.push("arc-missing");
    else if (!arcCdn) flags.push("arc-guess");
    if (arc.aliased) flags.push("arc-aliased");
    if (!wikiUrl) flags.push("wiki-missing");
    if (wikiRes.aliased) flags.push("wiki-aliased");
    if (arcCdn && !hArc) flags.push("arc-img-fail");
    if (wikiUrl && !hWiki) flags.push("wiki-img-fail");
    if (dataSeparate && !hData) flags.push("data-img-fail");

    rows[i] = {
      id: it.id,
      name,
      status,
      hasLocal,
      flags,
      filename: expectedFilename,
      // repo image is served by the local server (see serve-compare.js)
      repoUrl: hasLocal ? `/repo/${encodeURIComponent(expectedFilename)}` : null,
      dataUrl,
      // raw full-res source url used when adopting an image into the repo
      arcCdnRaw: arcCdn,
      arctrackerUrl: arcCdn
        ? arctrackerLiveUrl(arcCdn)
        : arc.missing
          ? null
          : arctrackerLiveUrl(dataUrl),
      arctrackerScraped: !!arcCdn,
      arctrackerMissing: arc.missing,
      wikiUrl,
    };
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${filtered.length}`);
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const flaggedCount = rows.filter((r) => r.flags.length > 0).length;
console.log(
  `✅ wiki ${wikiResolved} · arctracker ${arcScraped} · flagged ${flaggedCount} · status`,
  statusTally,
);

// A source cell. `adopt` (optional) = the raw full-res url to write into the
// repo when its "Use in repo" button is clicked.
const cell = (label, cls, url, adopt) => `
        <div class="side">
          <span class="tag ${cls}">${label}</span>
          ${url ? `<img loading="lazy" src="${url}" alt="${label}" referrerpolicy="no-referrer">` : `<div class="missing">none</div>`}
          ${adopt ? `<button class="use" data-url="${adopt}" type="button">use in repo</button>` : ""}
        </div>`;

const STATUS_TITLE = {
  all: "repo matches data + arctracker",
  arc: "repo matches arctracker (data differs)",
  stale: "repo=wiki but data+arctracker now agree → swap repo to arctracker",
  wiki: "repo matches wiki",
  unmatched: "repo present, matches no source",
  nolocal: "no repo image",
};

const cards = rows
  .map(
    (r) => `
  <figure class="card status-${r.status}" data-name="${r.name.toLowerCase()}" data-id="${r.id}" data-status="${r.status}" data-filename="${r.filename}" data-flagged="${r.flags.length > 0}" data-flags="${r.flags.join(" ")}">
    <span class="led led-${r.status}" title="${STATUS_TITLE[r.status]}"></span>
    <div class="pair">
      ${cell("REPO", "repo", r.repoUrl)}
      ${cell("DATA", "data", r.dataUrl, r.dataUrl)}
      ${cell(r.arctrackerScraped ? "ARCTRACKER" : r.arctrackerMissing ? "ARC (none)" : "ARC (guess)", "arc", r.arctrackerUrl, r.arcCdnRaw)}
      ${cell("WIKI", "wiki", r.wikiUrl, r.wikiUrl)}
    </div>
    <figcaption>${r.name}<br><small>${r.id}</small></figcaption>
    ${r.flags.length ? `<div class="flags">${r.flags.map((f) => `<span class="flag">${f}</span>`).join("")}</div>` : ""}
  </figure>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Item image sources — data vs arctracker vs wiki</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.4 system-ui, sans-serif; background: #14151a; color: #e6e6e6; }
  header { position: sticky; top: 0; z-index: 1; padding: 14px 20px; background: #1c1e26; border-bottom: 1px solid #2c2f3a; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  header h1 { font-size: 16px; margin: 0; }
  header input { background: #2c2f3a; border: 1px solid #3a3e4d; color: #e6e6e6; border-radius: 6px; padding: 6px 10px; min-width: 240px; }
  header button { background: #2c2f3a; border: 1px solid #3a3e4d; color: #e6e6e6; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
  header button.active { background: #2f5a3a; border-color: #3ddc6e; color: #d9ffe2; }
  .count { color: #9aa0b4; }
  .legend { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; padding: 4px 9px; border-radius: 999px; border: 1px solid #3a3e4d; background: #2c2f3a; color: #c4c8d4; cursor: pointer; user-select: none; }
  .chip .dot { width: 9px; height: 9px; border-radius: 50%; }
  .chip.off { opacity: .35; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; padding: 20px; }
  .card { position: relative; margin: 0; background: #1c1e26; border: 1px solid #2c2f3a; border-radius: 10px; padding: 10px; }
  .card.status-all       { background: #18241b; border-color: #2f5a3a; }
  .card.status-arc       { background: #262218; border-color: #5a4f2f; }
  .card.status-stale     { background: #142428; border-color: #2a5a66; }
  .card.status-wiki      { background: #2a2014; border-color: #6a4a28; }
  .card.status-unmatched { background: #221a2c; border-color: #4a3a6a; }
  .card.status-nolocal   { background: #261a1a; border-color: #5a3030; }
  .led { position: absolute; top: 10px; right: 10px; width: 10px; height: 10px; border-radius: 50%; z-index: 1; }
  .led-all       { background: #3ddc6e; box-shadow: 0 0 6px #3ddc6e; }
  .led-arc       { background: #e8c84a; box-shadow: 0 0 6px #e8c84a88; }
  .led-stale     { background: #3ac6e0; box-shadow: 0 0 6px #3ac6e088; }
  .led-wiki      { background: #e0913a; box-shadow: 0 0 6px #e0913a88; }
  .led-unmatched { background: #9a6fd8; box-shadow: 0 0 6px #9a6fd888; }
  .led-nolocal   { background: #d8584f; box-shadow: 0 0 6px #d8584f88; }
  .pair { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .side { position: relative; background: #0f1014; border-radius: 8px; aspect-ratio: 1; display: grid; place-items: center; overflow: hidden; }
  .side img { max-width: 100%; max-height: 100%; }
  .missing { color: #555; font-size: 11px; }
  .use { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 700; padding: 3px 7px; border-radius: 5px; border: 1px solid #3a3e4d; background: #1c1e26cc; color: #cdeeff; cursor: pointer; opacity: 0; transition: opacity .12s; white-space: nowrap; }
  .side:hover .use { opacity: 1; }
  .use:hover { background: #2c4a5a; border-color: #4a7a8a; }
  .use:disabled { cursor: default; opacity: 1; }
  .use.done { background: #2f5a3a; border-color: #3ddc6e; color: #d9ffe2; }
  .use.err  { background: #5a2f2f; border-color: #d8584f; color: #ffd9d9; }
  .tag { position: absolute; top: 4px; left: 4px; font-size: 9px; font-weight: 700; padding: 2px 4px; border-radius: 4px; letter-spacing: .03em; }
  .tag.repo { background: #2c4a5a; color: #cdeeff; }
  .tag.data { background: #3a3a5a; color: #dcd9ff; }
  .tag.arc  { background: #5a4a2f; color: #ffe9c9; }
  .tag.wiki { background: #2f5a4a; color: #d9fff0; }
  figcaption { margin-top: 8px; font-size: 11px; color: #c4c8d4; text-align: center; }
  figcaption small { color: #6f7488; }
  .flags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
  .flag { font-size: 9px; font-weight: 700; letter-spacing: .02em; padding: 2px 6px; border-radius: 999px; background: #4a2a14; color: #ffcf9e; border: 1px solid #7a4a28; }
</style>
</head>
<body>
<header>
  <h1>Image sources</h1>
  <span class="count">${rows.length} items</span>
  <span class="legend">
    <span class="chip" data-status="all" title="GREEN — repo image matches BOTH arctracker and the data's imageFilename. Everything agrees, nothing to do. Click to hide/show this group."><span class="dot led-all"></span>repo=data=arc <b>${statusTally.all}</b></span>
    <span class="chip" data-status="arc" title="YELLOW — repo matches the live arctracker image, but the data's imageFilename points at a different path. Click to hide/show this group."><span class="dot led-arc"></span>repo=arc <b>${statusTally.arc}</b></span>
    <span class="chip" data-status="stale" title="CYAN — repo currently matches the wiki image, but arctracker + data now agree on a different image. Likely you added the wiki art before arctracker had it; candidate to swap repo → arctracker. Click to hide/show this group."><span class="dot led-stale"></span>stale→swap <b>${statusTally.stale}</b></span>
    <span class="chip" data-status="wiki" title="ORANGE — repo matches the wiki image and NOT arctracker (arctracker has nothing matching yet). Click to hide/show this group."><span class="dot led-wiki"></span>repo=wiki <b>${statusTally.wiki}</b></span>
    <span class="chip" data-status="unmatched" title="PURPLE — repo has an image but it matches none of the sources (unique/old art). Click to hide/show this group."><span class="dot led-unmatched"></span>no match <b>${statusTally.unmatched}</b></span>
    <span class="chip" data-status="nolocal" title="RED — no image in the repo for this item. Click to hide/show this group."><span class="dot led-nolocal"></span>no repo <b>${statusTally.nolocal}</b></span>
  </span>
  <input id="q" type="search" placeholder="Filter by name or id…" title="Type to filter cards by item name or id." autofocus>
  <button id="flaggedOnly" type="button" title="Show ONLY items with a warning flag: broken/404 source image, name↔slug mismatch (aliased), missing arctracker/wiki image, no repo image, unmatched, or stale. Click again to show all.">⚠ suspicious only <b>${flaggedCount}</b></button>
</header>
<div class="grid" id="grid">
${cards}
</div>
<script>
  const q = document.getElementById('q');
  const chips = [...document.querySelectorAll('.chip')];
  const flaggedOnly = document.getElementById('flaggedOnly');
  const cards = [...document.querySelectorAll('.card')];
  // all statuses visible by default; click a chip to toggle its group
  const hidden = new Set();
  let suspiciousOnly = false;
  const apply = () => {
    const t = q.value.toLowerCase();
    for (const c of cards) {
      const matchText = c.dataset.name.includes(t) || c.dataset.id.includes(t);
      const matchStatus = !hidden.has(c.dataset.status);
      const matchFlagged = !suspiciousOnly || c.dataset.flagged === 'true';
      c.style.display = (matchText && matchStatus && matchFlagged) ? '' : 'none';
    }
  };
  q.addEventListener('input', apply);
  flaggedOnly.addEventListener('click', () => {
    suspiciousOnly = !suspiciousOnly;
    flaggedOnly.classList.toggle('active', suspiciousOnly);
    apply();
  });
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const s = chip.dataset.status;
      if (hidden.has(s)) hidden.delete(s); else hidden.add(s);
      chip.classList.toggle('off', hidden.has(s));
      apply();
    });
  }

  // "use in repo": POST the source url + target filename to the local server,
  // which downloads it and overwrites the repo image. On success, refresh the
  // repo cell (cache-busted) so the change is visible immediately.
  document.getElementById('grid').addEventListener('click', async (e) => {
    const btn = e.target.closest('.use');
    if (!btn) return;
    const card = btn.closest('.card');
    const filename = card.dataset.filename;
    const url = btn.dataset.url;
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'saving…';
    try {
      const res = await fetch('/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, url }),
      });
      if (!res.ok) throw new Error(await res.text());
      btn.classList.add('done');
      btn.textContent = 'saved ✓';
      // refresh the REPO image in this card
      const bust = '/repo/' + encodeURIComponent(filename) + '?t=' + Date.now();
      const repoImg = card.querySelector('.side:first-child img');
      if (repoImg) repoImg.src = bust;
      else {
        const m = card.querySelector('.side:first-child .missing');
        if (m) {
          const img = document.createElement('img');
          img.src = bust;
          m.replaceWith(img);
        }
      }
    } catch (err) {
      btn.classList.add('err');
      btn.textContent = 'failed';
      console.error(err);
    }
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('done', 'err');
      btn.textContent = prev;
    }, 2500);
  });
</script>
</body>
</html>`;

mkdirSync(OUT, { recursive: true });
await Bun.write(join(OUT, "index.html"), html);
console.log(`✅ Wrote ${join(OUT, "index.html")}`);
