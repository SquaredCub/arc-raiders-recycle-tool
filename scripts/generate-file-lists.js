// Script to bundle arcraiders-data into combined JSON files for the app.
// This means zero runtime fetches — all game data is bundled at build time.
//
// Run with: node scripts/generate-file-lists.js

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "../src/arcraiders-data");
const OUTPUT_DIR = join(__dirname, "../src/generated");

// Directories where each file is a single JSON object to be merged into an array
const directories = [
  { name: "items", dir: join(DATA_DIR, "items") },
  { name: "quests", dir: join(DATA_DIR, "quests") },
  { name: "hideout", dir: join(DATA_DIR, "hideout") },
];

// Single files that are already complete and just need to be copied
const singleFiles = [
  { name: "projects", src: join(DATA_DIR, "projects.json") },
];

mkdirSync(OUTPUT_DIR, { recursive: true });

let totalGenerated = 0;

// Merge directory files into single arrays
const mergedDirectories = {};

for (const { name, dir } of directories) {
  try {
    const files = readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort();

    const merged = files.map((file) => {
      const content = readFileSync(join(dir, file), "utf-8");
      return JSON.parse(content);
    });

    mergedDirectories[name] = merged;

    const outputPath = join(OUTPUT_DIR, `${name}.json`);
    writeFileSync(outputPath, JSON.stringify(merged));

    console.log(`Generated ${name}.json (${files.length} files merged)`);
    totalGenerated++;
  } catch (error) {
    console.error(`Failed to process directory "${name}" at: ${dir}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

// Extract filter options from items data
if (mergedDirectories.items) {
  const items = mergedDirectories.items;
  const rarities = [...new Set(items.map((item) => item.rarity))]
    .filter(Boolean)
    .sort();
  const locations = [
    ...new Set(
      items.flatMap((item) => (item.foundIn ? item.foundIn.split(", ") : [])),
    ),
  ].sort();
  locations.push("No Location");

  const filterOptionsPath = join(OUTPUT_DIR, "filterOptions.json");
  writeFileSync(filterOptionsPath, JSON.stringify({ rarities, locations }));

  console.log(
    `Generated filterOptions.json (${rarities.length} rarities, ${locations.length} locations)`,
  );
  totalGenerated++;
}

// Copy single files
for (const { name, src } of singleFiles) {
  try {
    const outputPath = join(OUTPUT_DIR, `${name}.json`);
    copyFileSync(src, outputPath);

    console.log(`Copied ${name}.json`);
    totalGenerated++;
  } catch (error) {
    console.error(`Failed to copy "${name}" from: ${src}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

console.log(`\nDone! Generated ${totalGenerated} data files in src/generated/`);
