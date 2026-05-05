import { filterBlacklistedItemCategories } from "../src/data/itemsData";
import { getAllItems } from "../src/services/dataService";
import { WIKI_BASE_URL } from "../src/utils/functions";

// Retrieve the same set of items that the UI displays:
// - Exclude blacklisted categories (Key, Blueprint)
// - Only include items with a positive value (recyclable items)
const items = filterBlacklistedItemCategories(getAllItems()).filter(
  (item) => (item.value ?? 0) > 0,
);

const CONCURRENCY = 5;
const DELAY_MS = 600;
const CHECK_CONTENT = true;

function buildFragment(item) {
  // This has to be the exact same logic as the one used in ItemCell.tsx to generate the wiki link
  let itemName = item?.name.en;
  if (item?.isWeapon) itemName = itemName?.split(" ")?.slice(0, -1).join(" "); // Remove trailing numeral for weapon variants (e.g., Osprey_I → Osprey)

  const wikiFragment =
    itemName
      ?.replace(/ /g, "_")
      .replace(/_Arc_/g, "_ARC_")
      .replace(/_of_/g, "_Of_") ?? "";

  return wikiFragment;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function checkItem(item) {
  const fragment = buildFragment(item);
  if (!fragment) return null;

  const url = `${WIKI_BASE_URL}${fragment}`;

  try {
    let res = await fetch(url, { method: "HEAD" });

    // fallback (some servers don't support HEAD)
    if (!res.ok) {
      res = await fetch(url);
    }

    if (!res.ok) {
      return { id: item.id, url, status: res.status };
    }

    if (CHECK_CONTENT) {
      const html = await res.text();
      if (html.includes("There is currently no text in this page")) {
        return { id: item.id, url, status: "empty" };
      }
    }

    return null;
  } catch {
    return { id: item.id, url, status: "error" };
  }
}

async function run() {
  const broken = [];
  const queue = [...items];

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const item = queue.pop();
      if (!item) break;

      const result = await checkItem(item);

      if (result) {
        broken.push(result);
        console.log("❌", result);
      }

      await sleep(DELAY_MS);
    }
  });

  await Promise.all(workers);

  console.log(`\nBroken: ${broken.length}/${items.length}`);

  if (broken.length) {
    await Bun.write("broken-links.json", JSON.stringify(broken, null, 2));
    process.exit(1); // fail in CI
  } else {
    console.log("All links OK");
  }
}

run();
