// ============================================================================
// Check Missing Images (Bun Optimized)
// ============================================================================
import { join } from "node:path";

// Bun provides import.meta.dir natively
const ROOT_DIR = join(import.meta.dir, "..");
const ITEMS_PATH = join(ROOT_DIR, "src/generated/items.json");
const IMAGES_FOLDER = join(ROOT_DIR, "src/arcraiders-data/images/items");

// Read and parse items
const items = await Bun.file(ITEMS_PATH).json();

// Configuration
const BLACKLISTED_CATEGORIES = ["Key", "Blueprint"];

// Helper function to get image for an item
function getItemImage(item) {
  if (item.imageFilename) {
    return item.imageFilename.split("/").pop();
  }
  return item.id ? `${item.id}.png` : undefined;
}

// Filtering logic (Merged into one pass for performance)
const filteredItems = items.filter((item) => {
  const isValidType = !BLACKLISTED_CATEGORIES.includes(item.type);
  const isNotCoins = item.id !== "coins";
  const hasValue = (item.value ?? 0) > 0;
  return isValidType && isNotCoins && hasValue;
});

const missingImages = [];

console.log(`\n🔍 Checking ${filteredItems.length} items for assets...`);

// Audit the images
for (const item of filteredItems) {
  const imageFilename = getItemImage(item);

  if (imageFilename) {
    const file = Bun.file(join(IMAGES_FOLDER, imageFilename));

    // Bun's exists() is high-performance and returns a Promise
    if (!(await file.exists())) {
      missingImages.push({
        name: item.name.en,
        expectedFilename: imageFilename,
      });
    }
  }
}

// Output results
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

if (missingImages.length === 0) {
  console.log(`${GREEN}✅ No missing images found.${NC}\n`);
} else {
  console.log(
    `${RED}${BOLD}Found ${missingImages.length} missing image(s):${NC}\n`,
  );

  for (const item of missingImages) {
    console.log(`  - ${item.name} (${item.expectedFilename})`);
  }
  console.log();
}
