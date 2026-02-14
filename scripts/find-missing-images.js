import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_DIR = __dirname;
const FILES_DIR = path.resolve(SCRIPT_DIR, "../src/arcraiders-data/items");
const IMAGES_DIR = path.resolve(
  SCRIPT_DIR,
  "../src/arcraiders-data/images/items_ingame",
);

// ----------------------------
// Collect IDs from JSON files
// ----------------------------
const ids = new Set();

for (const file of fs.readdirSync(FILES_DIR)) {
  if (!file.endsWith(".json")) continue;

  const fullPath = path.join(FILES_DIR, file);
  const raw = fs.readFileSync(fullPath, "utf8");

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn(`Skipping invalid JSON: ${file}`);
    continue;
  }

  if (Array.isArray(data)) {
    for (const obj of data) {
      if (obj && typeof obj.id === "string") {
        ids.add(obj.id);
      }
    }
  } else if (data && typeof data.id === "string") {
    ids.add(data.id);
  }
}

// ----------------------------
// Collect image filenames
// ----------------------------
const images = new Set();

if (fs.existsSync(IMAGES_DIR)) {
  for (const file of fs.readdirSync(IMAGES_DIR)) {
    if (file.endsWith(".png")) {
      images.add(path.basename(file, ".png"));
    }
  }
} else {
  console.error(`Images directory not found: ${IMAGES_DIR}`);
  process.exit(1);
}

// ----------------------------
// Compare + collect missing
// ----------------------------
const missingIds = [];

for (const id of ids) {
  if (!images.has(id)) {
    missingIds.push(id);
  }
}

// ----------------------------
// Output
// ----------------------------
console.log(`${images.size} images found, ${missingIds.length} missing`);

if (missingIds.length > 0) {
  console.log("\nMissing image IDs:");
  for (const id of missingIds) {
    console.log(`- ${id}`);
  }
}
