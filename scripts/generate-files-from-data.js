// ============================================================================
// Generate Files from ARC Raiders Data (Bun Optimized)
// ============================================================================
// This script processes raw game data and generates all necessary files.
// Optimized for Bun v1.3.13+
// ============================================================================

import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Bun provides import.meta.dir natively
// Raw API responses saved by scripts/fetch-arctracker.js
const DATA_DIR = join(import.meta.dir, "../src/arctracker-data");
const OUTPUT_DIR = join(import.meta.dir, "../src/generated");

// ============================================================================
// Configuration
// ============================================================================

// Each API response wraps its entries: items as an array, the rest keyed by id
const sources = [
  { name: "items", entries: (data) => data.items },
  { name: "quests", entries: (data) => Object.values(data.quests) },
  { name: "hideout", entries: (data) => Object.values(data.hideoutModules) },
  { name: "projects", entries: (data) => Object.values(data.projects) },
];

// ============================================================================
// Main Execution
// ============================================================================

mkdirSync(OUTPUT_DIR, { recursive: true });

let totalGenerated = 0;
const mergedDirectories = {};

console.log("🔨 Generating files from ARC Raiders data using Bun...\n");

// Step 1: Unwrap each API response into a sorted array
for (const { name, entries } of sources) {
  const src = join(DATA_DIR, `${name}.json`);
  try {
    const merged = entries(await Bun.file(src).json()).sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    mergedDirectories[name] = merged;

    const outputPath = join(OUTPUT_DIR, `${name}.json`);
    await Bun.write(outputPath, JSON.stringify(merged));

    console.log(`✓ Generated ${name}.json (${merged.length} entries)`);
    totalGenerated++;
  } catch (error) {
    console.error(`✗ Failed to process "${name}" from: ${src}`);
    console.error(`  ${error.message} (run: bun run fetch-data)`);
    process.exit(1);
  }
}

// Step 2: Extract filter options from items data
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
  await Bun.write(filterOptionsPath, JSON.stringify({ rarities, locations }));

  console.log(
    `✓ Generated filterOptions.json (${rarities.length} rarities, ${locations.length} locations)`,
  );
  totalGenerated++;
}

// Step 3: Generate TypeScript types
console.log("\n📝 Generating TypeScript types...");
await generateTypes(mergedDirectories);

console.log(`\n✅ Done! Generated ${totalGenerated} files in src/generated/`);

// ============================================================================
// Type Generation Functions
// ============================================================================

function inferType(value, key = "") {
  if (value === null || value === undefined) return "undefined";

  if (Array.isArray(value)) {
    if (key === "objectives") return "LocalizedText[]";
    if (
      [
        "requirementItemIds",
        "requiredItemIds",
        "grantedItemIds",
        "rewardItemIds",
      ].includes(key)
    ) {
      return "ItemRequirement[]";
    }
    if (key === "levels") return "HideoutLevel[]";
    if (key === "phases") return "ProjectPhase[]";
    if (key === "requirementCategories") return "ProjectRequirementCategory[]";
    if (key === "previousQuestIds" || key === "nextQuestIds") return "string[]";

    if (value.length === 0) return "unknown[]";
    const itemType = inferType(value[0], "");
    return `${itemType}[]`;
  }

  if (typeof value === "object") {
    if (key === "name" || key === "description") return "LocalizedText";
    if (key === "effects") return "ItemEffects";
    if (
      [
        "recyclesInto",
        "salvagesInto",
        "recipe",
        "repairCost",
        "repairMaterials",
        "upgradeCost",
      ].includes(key)
    ) {
      return "MaterialCosts";
    }
    return "Record<string, unknown>";
  }

  if (typeof value === "string") {
    if (key === "type") return "ItemType";
    if (key === "rarity") return "ItemRarity";
    return "string";
  }

  return typeof value;
}

function analyzeStructure(samples, interfaceName) {
  if (!samples || samples.length === 0) {
    return `export interface ${interfaceName} {\n  // No data available\n}`;
  }

  const fieldPresence = {};
  const fieldTypes = {};
  const totalSamples = samples.length;

  samples.forEach((sample) => {
    Object.keys(sample).forEach((key) => {
      const value = sample[key];
      fieldPresence[key] = (fieldPresence[key] || 0) + 1;
      if (!fieldTypes[key]) fieldTypes[key] = new Set();

      if (value !== null && value !== undefined) {
        const type = inferType(value, key);
        if (type !== "undefined") fieldTypes[key].add(type);
      }
    });
  });

  const fields = Object.entries(fieldTypes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, types]) => {
      const presentInAll = fieldPresence[key] === totalSamples;
      const typesList = [...types].filter((t) => t !== "undefined");
      const typeStr = typesList.length > 0 ? typesList.join(" | ") : "unknown";
      return `  ${key}${presentInAll ? "" : "?"}: ${typeStr};`;
    });

  return `export interface ${interfaceName} {\n${fields.join("\n")}\n}`;
}

async function generateTypes(data) {
  const { items = [], quests = [], hideout = [], projects = [] } = data;

  const itemTypes = [...new Set(items.map((i) => i.type))]
    .filter(Boolean)
    .sort();
  const rarities = [...new Set(items.map((i) => i.rarity))]
    .filter(Boolean)
    .sort();

  const languages = new Set();
  items.forEach(
    (i) => i.name && Object.keys(i.name).forEach((l) => languages.add(l)),
  );
  const sortedLanguages = [...languages].sort();

  const itemRequirements = items
    .filter((i) => i.recipe)
    .flatMap((i) =>
      Object.entries(i.recipe).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      })),
    );

  const hideoutLevels = hideout.flatMap((b) => b.levels || []);
  const projectPhases = projects.flatMap((p) => p.phases || []);
  const projectRequirementCategories = projectPhases
    .filter((p) => p.requirementCategories)
    .flatMap((p) => p.requirementCategories);

  const typeDefinitions = `// Auto-generated TypeScript types from game data

export interface LocalizedText {
  en: string;
${sortedLanguages
  .filter((l) => l !== "en")
  .map((l) => `  "${l}"?: string;`)
  .join("\n")}
}

export interface Effect extends LocalizedText {
  value: string;
}

export interface ItemEffects {
  [effectName: string]: Effect;
}

export interface MaterialCosts {
  [materialId: string]: number;
}

export type ItemType =
${itemTypes.map((t, i) => `  | "${t}"${i === itemTypes.length - 1 ? ";" : ""}`).join("\n")}

export const ITEM_TYPES: ItemType[] = [
${itemTypes.map((t) => `  "${t}",`).join("\n")}
];

export type ItemRarity =
${rarities.map((r, i) => `  | "${r}"${i === rarities.length - 1 ? ";" : ""}`).join("\n")}

${analyzeStructure(items, "Item")}

${
  itemRequirements.length > 0
    ? analyzeStructure(itemRequirements.slice(0, 10), "ItemRequirement")
    : "export interface ItemRequirement { itemId: string; quantity: number; }"
}

${
  hideoutLevels.length > 0
    ? analyzeStructure(hideoutLevels, "HideoutLevel")
    : "export interface HideoutLevel { level: number; requirementItemIds: ItemRequirement[]; }"
}

${analyzeStructure(hideout, "HideoutBench")}
${analyzeStructure(quests, "Quest")}
${
  projectRequirementCategories.length > 0
    ? analyzeStructure(
        projectRequirementCategories,
        "ProjectRequirementCategory",
      )
    : "export interface ProjectRequirementCategory { category: string; valueRequired: number; }"
}
${analyzeStructure(projectPhases, "ProjectPhase")}
${analyzeStructure(projects, "Project")}

export interface ItemUsage {
  source: string;
  quantity: number;
}

export interface ItemRequirementLookup {
  [itemId: string]: {
    totalQuantity: number;
    usedIn: ItemUsage[];
  };
}
`;

  await Bun.write(join(OUTPUT_DIR, "types.ts"), typeDefinitions);
  console.log(`✓ Generated types.ts (${itemTypes.length} item types)`);
  totalGenerated++;
}
