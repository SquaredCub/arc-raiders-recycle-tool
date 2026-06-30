// ============================================================================
// Build Image Compare Page (Bun)
// ----------------------------------------------------------------------------
// Generates a static side-by-side comparison of OLD (committed) vs NEW
// (working tree) item images for every modified PNG in the arcraiders-data
// repo. Output: scripts/compare/{old,new}/*.png + index.html
//
//   bun scripts/build-image-compare.js
//   open scripts/compare/index.html
// ============================================================================
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const ROOT = join(import.meta.dir, "..");
const DATA_REPO = join(ROOT, "src/arcraiders-data");
const OUT = join(import.meta.dir, "compare");
const OLD = join(OUT, "old");
const NEW = join(OUT, "new");

// Fresh output dirs
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OLD, { recursive: true });
mkdirSync(NEW, { recursive: true });

// List modified images (porcelain: " M images/items/foo.png")
const status = await $`git -C ${DATA_REPO} status --short images/items`.text();
const files = status
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.startsWith("M "))
  .map((l) => l.replace(/^M\s+/, ""))
  .filter((p) => p.endsWith(".png"));

console.log(`📊 ${files.length} modified images. Building compare page...`);

const rows = [];
for (const repoPath of files) {
  const name = repoPath.split("/").pop();

  // OLD: committed blob -> compare/old/name
  const oldBytes = await $`git -C ${DATA_REPO} show HEAD:${repoPath}`
    .arrayBuffer()
    .catch(() => null);
  if (oldBytes) await Bun.write(join(OLD, name), oldBytes);

  // NEW: working tree copy -> compare/new/name
  await Bun.write(join(NEW, name), Bun.file(join(DATA_REPO, repoPath)));

  rows.push({ name, hasOld: !!oldBytes });
}

const cards = rows
  .map(
    ({ name, hasOld }) => `
  <figure class="card" data-name="${name}">
    <div class="pair">
      <div class="side">
        <span class="tag old">OLD</span>
        ${hasOld ? `<img loading="lazy" src="old/${name}">` : `<div class="missing">—</div>`}
      </div>
      <div class="side">
        <span class="tag new">NEW</span>
        <img loading="lazy" src="new/${name}">
      </div>
    </div>
    <figcaption>${name}</figcaption>
  </figure>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Item image comparison — ${rows.length} changed</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.4 system-ui, sans-serif; background: #14151a; color: #e6e6e6; }
  header { position: sticky; top: 0; z-index: 1; padding: 14px 20px; background: #1c1e26; border-bottom: 1px solid #2c2f3a; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  header h1 { font-size: 16px; margin: 0; }
  header input { background: #2c2f3a; border: 1px solid #3a3e4d; color: #e6e6e6; border-radius: 6px; padding: 6px 10px; min-width: 220px; }
  .count { color: #9aa0b4; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; padding: 20px; }
  .card { margin: 0; background: #1c1e26; border: 1px solid #2c2f3a; border-radius: 10px; padding: 10px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .side { position: relative; background: #0f1014; border-radius: 8px; aspect-ratio: 1; display: grid; place-items: center; overflow: hidden; }
  .side img { max-width: 100%; max-height: 100%; }
  .missing { color: #555; font-size: 24px; }
  .tag { position: absolute; top: 4px; left: 4px; font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 4px; letter-spacing: .04em; }
  .tag.old { background: #5a3a3a; color: #ffd9d9; }
  .tag.new { background: #2f5a3a; color: #d9ffe2; }
  figcaption { margin-top: 8px; font-size: 11px; color: #9aa0b4; word-break: break-all; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>Item image comparison</h1>
  <span class="count">${rows.length} changed</span>
  <input id="q" type="search" placeholder="Filter by filename…" autofocus>
</header>
<div class="grid" id="grid">
${cards}
</div>
<script>
  const q = document.getElementById('q');
  const cards = [...document.querySelectorAll('.card')];
  q.addEventListener('input', () => {
    const t = q.value.toLowerCase();
    for (const c of cards) c.style.display = c.dataset.name.includes(t) ? '' : 'none';
  });
</script>
</body>
</html>`;

await Bun.write(join(OUT, "index.html"), html);
console.log(`✅ Wrote ${join(OUT, "index.html")}`);
console.log(`   ${rows.length} pairs (old + new copied locally)`);
