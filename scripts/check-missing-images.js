import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Read the items JSON file
const itemsRaw = fs.readFileSync(
  path.join(rootDir, "src/generated/items.json"),
  "utf-8",
);
const items = JSON.parse(itemsRaw);

// Blacklisted categories from itemCategories.ts
const BLACKLISTED_CATEGORIES = ["Key", "Blueprint"];

// Helper function to get image for an item
function getItemImage(item) {
  if (item.imageFilename) {
    const urlFilename = item.imageFilename.split("/").pop();
    return urlFilename;
  }
  if (item.id) {
    return `${item.id}.png`;
  }
  return undefined;
}

// Get all items, filter out blacklisted categories
let filteredItems = items.filter(
  (item) => !BLACKLISTED_CATEGORIES.includes(item.type),
);

// Filter out coins (special case)
filteredItems = filteredItems.filter((item) => item.id !== "coins");

// Filter out items with no value (same as DataContext.tsx)
filteredItems = filteredItems.filter((item) => (item.value ?? 0) > 0);

// Check if images exist in the local folder
const imagesFolder = path.join(rootDir, "src/arcraiders-data/images/items");
const missingImages = [];

for (const item of filteredItems) {
  const imageFilename = getItemImage(item);
  if (imageFilename) {
    const fullPath = path.join(imagesFolder, imageFilename);
    if (!fs.existsSync(fullPath)) {
      missingImages.push({
        id: item.id,
        type: item.type,
        name: item.name.en,
        expectedFilename: imageFilename,
      });
    }
  }
}

// Output results
console.log(`\nChecked ${filteredItems.length} items\n`);

if (missingImages.length === 0) {
  console.log("No missing images found.");
} else {
  console.log(`Found ${missingImages.length} missing image(s):\n`);

  for (const item of missingImages) {
    console.log(`  ${item.name} (${item.expectedFilename})`);
  }
}
