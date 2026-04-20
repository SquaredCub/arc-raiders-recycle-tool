// ============================================================================
// Generate Files from ARC Raiders Data
// ============================================================================
// This script processes raw game data and generates all necessary files:
// 1. Merges individual JSON files into combined data files
// 2. Extracts filter options (rarities, locations)
// 3. Generates TypeScript type definitions from actual data structure
//
// Run with: node scripts/generate-files-from-data.js
// ============================================================================

import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "../src/arcraiders-data");
const OUTPUT_DIR = join(__dirname, "../src/generated");

// ============================================================================
// Configuration
// ============================================================================

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

// ============================================================================
// Main Execution
// ============================================================================

mkdirSync(OUTPUT_DIR, { recursive: true });

let totalGenerated = 0;
const mergedDirectories = {};

console.log("🔨 Generating files from ARC Raiders data...\n");

// Step 1: Merge directory files into single arrays
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

    console.log(`✓ Generated ${name}.json (${files.length} files merged)`);
    totalGenerated++;
  } catch (error) {
    console.error(`✗ Failed to process directory "${name}" at: ${dir}`);
    console.error(`  ${error.message}`);
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
  writeFileSync(filterOptionsPath, JSON.stringify({ rarities, locations }));

  console.log(
    `✓ Generated filterOptions.json (${rarities.length} rarities, ${locations.length} locations)`,
  );
  totalGenerated++;
}

// Step 3: Copy single files and load them into mergedDirectories
for (const { name, src } of singleFiles) {
  try {
    const content = readFileSync(src, "utf-8");
    const data = JSON.parse(content);
    mergedDirectories[name] = data;

    const outputPath = join(OUTPUT_DIR, `${name}.json`);
    copyFileSync(src, outputPath);

    console.log(`✓ Copied ${name}.json`);
    totalGenerated++;
  } catch (error) {
    console.error(`✗ Failed to copy "${name}" from: ${src}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

// Step 4: Generate TypeScript types based on the data
console.log("\n📝 Generating TypeScript types...");
generateTypes(mergedDirectories);

console.log(`\n✅ Done! Generated ${totalGenerated} files in src/generated/`);

// ============================================================================
// Type Generation Functions
// ============================================================================

/**
 * Infer TypeScript type from a value
 * Handles special cases for known structures and provides sensible defaults
 */
function inferType(value, key = "") {
  if (value === null || value === undefined) return "undefined";

  if (Array.isArray(value)) {
    // Special handling for known array types
    if (key === "objectives") return "LocalizedText[]";
    if (
      key === "requirementItemIds" ||
      key === "requiredItemIds" ||
      key === "grantedItemIds" ||
      key === "rewardItemIds"
    ) {
      return "ItemRequirement[]";
    }
    if (key === "levels") return "HideoutLevel[]";
    if (key === "phases") return "ProjectPhase[]";
    if (key === "requirementCategories") return "ProjectRequirementCategory[]";
    if (key === "previousQuestIds" || key === "nextQuestIds") return "string[]";

    // Generic array handling
    if (value.length === 0) return "unknown[]";
    const firstItem = value[0];
    const itemType = inferType(firstItem, "");
    return `${itemType}[]`;
  }

  if (typeof value === "object") {
    // Special cases for known object structures
    if (key === "name" || key === "description") {
      return "LocalizedText";
    }
    if (key === "effects") {
      return "ItemEffects";
    }
    if (
      key === "recyclesInto" ||
      key === "salvagesInto" ||
      key === "recipe" ||
      key === "repairCost" ||
      key === "repairMaterials" ||
      key === "upgradeCost"
    ) {
      return "MaterialCosts";
    }
    // Default for unrecognized objects
    return "Record<string, unknown>";
  }

  if (typeof value === "string") {
    // Special cases for known enums
    if (key === "type") return "ItemType";
    if (key === "rarity") return "ItemRarity";
    return "string";
  }

  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

/**
 * Analyze structure of sample data to infer interface shape
 * Tracks field presence across all samples to determine required vs optional fields
 */
function analyzeStructure(samples, interfaceName) {
  if (!samples || samples.length === 0) {
    return `export interface ${interfaceName} {\n  // No data available to infer structure\n}`;
  }

  const fieldPresence = {}; // Track how many samples have each field
  const fieldTypes = {}; // Track all types seen for each field
  const totalSamples = samples.length;

  samples.forEach((sample) => {
    Object.keys(sample).forEach((key) => {
      const value = sample[key];

      // Track field presence
      if (!fieldPresence[key]) {
        fieldPresence[key] = 0;
        fieldTypes[key] = new Set();
      }
      fieldPresence[key]++;

      // Only add types for non-null, non-undefined values
      if (value !== null && value !== undefined) {
        const type = inferType(value, key);
        if (type !== "undefined") {
          fieldTypes[key].add(type);
        }
      }
    });
  });

  // Generate field definitions
  const fields = Object.entries(fieldTypes)
    .sort(([a], [b]) => a.localeCompare(b)) // Sort alphabetically
    .map(([key, types]) => {
      const presentInAll = fieldPresence[key] === totalSamples;
      const typesList = [...types].filter((t) => t !== "undefined");
      const typeStr = typesList.length > 0 ? typesList.join(" | ") : "unknown";
      const optional = presentInAll ? "" : "?";
      return `  ${key}${optional}: ${typeStr};`;
    });

  return `export interface ${interfaceName} {\n${fields.join("\n")}\n}`;
}

/**
 * Generate TypeScript type definitions from the actual data structure
 * Extracts enums, analyzes interfaces, and writes types.ts file
 */
function generateTypes(data) {
  const { items = [], quests = [], hideout = [], projects = [] } = data;

  // Extract all unique item types from items data
  const itemTypes = [...new Set(items.map((item) => item.type))]
    .filter(Boolean)
    .sort();

  // Extract all unique rarities from items data
  const rarities = [...new Set(items.map((item) => item.rarity))]
    .filter(Boolean)
    .sort();

  // Extract all unique languages from localized text
  const languages = new Set();
  items.forEach((item) => {
    if (item.name)
      Object.keys(item.name).forEach((lang) => languages.add(lang));
  });
  const sortedLanguages = [...languages].sort();

  // Analyze nested structures from actual data
  const itemRequirements = items
    .filter((i) => i.recipe)
    .flatMap((i) =>
      Object.entries(i.recipe || {}).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      })),
    );

  const hideoutLevels = hideout.flatMap((bench) => bench.levels || []);

  const projectPhases = projects.flatMap((p) => p.phases || []);

  const projectRequirementCategories = projectPhases
    .filter((phase) => phase.requirementCategories)
    .flatMap((phase) => phase.requirementCategories);

  // Build TypeScript file content
  const typeDefinitions = `// Auto-generated TypeScript types from game data
// Generated on: ${new Date().toISOString()}
// DO NOT EDIT THIS FILE MANUALLY - it will be overwritten on next build

// ============================================================================
// Localization Types
// ============================================================================

export interface LocalizedText {
  en: string;
${sortedLanguages
  .filter((lang) => lang !== "en")
  .map((lang) => `  "${lang}"?: string;`)
  .join("\n")}
}

// Effect with localized label and value
export interface Effect extends LocalizedText {
  value: string;
}

// Item effects (e.g., for consumables)
export interface ItemEffects {
  [effectName: string]: Effect;
}

// ============================================================================
// Material and Cost Types
// ============================================================================

// Material costs for crafting or recycling
export interface MaterialCosts {
  [materialId: string]: number;
}

// ============================================================================
// Item Types
// ============================================================================

export type ItemType =
${itemTypes.map((type, i) => `  | "${type}"${i === itemTypes.length - 1 ? ";" : ""}`).join("\n")}

export const ITEM_TYPES: ItemType[] = [
${itemTypes.map((type) => `  "${type}",`).join("\n")}
];

export type ItemRarity =
${rarities.map((rarity, i) => `  | "${rarity}"${i === rarities.length - 1 ? ";" : ""}`).join("\n")}

${analyzeStructure(items, "Item")}

// ============================================================================
// Requirement Types (used in hideouts, quests, and projects)
// ============================================================================

${
  itemRequirements.length > 0
    ? analyzeStructure(itemRequirements.slice(0, 10), "ItemRequirement")
    : `export interface ItemRequirement {
  itemId: string;
  quantity: number;
}`
}

// ============================================================================
// Hideout/Workbench Types
// ============================================================================

${
  hideoutLevels.length > 0
    ? analyzeStructure(hideoutLevels, "HideoutLevel")
    : `export interface HideoutLevel {
  level: number;
  requirementItemIds: ItemRequirement[];
}`
}

${analyzeStructure(hideout, "HideoutBench")}

// ============================================================================
// Quest Types
// ============================================================================

${analyzeStructure(quests, "Quest")}

// ============================================================================
// Project Types
// ============================================================================

${
  projectRequirementCategories.length > 0
    ? analyzeStructure(
        projectRequirementCategories,
        "ProjectRequirementCategory",
      )
    : `export interface ProjectRequirementCategory {
  category: string;
  valueRequired: number;
}`
}

${
  projectPhases.length > 0
    ? analyzeStructure(projectPhases, "ProjectPhase")
    : `export interface ProjectPhase {
  phase: number;
  name: LocalizedText;
  description?: LocalizedText;
  requirementItemIds: ItemRequirement[];
  requirementCategories?: ProjectRequirementCategory[];
}`
}

${analyzeStructure(projects, "Project")}

// ============================================================================
// Item Usage Tracking Types
// ============================================================================

export interface ItemUsage {
  source: string; // e.g., "Gunsmith Lvl 2", "Expedition Project - Foundation"
  quantity: number;
}

export interface ItemRequirementLookup {
  [itemId: string]: {
    totalQuantity: number;
    usedIn: ItemUsage[];
  };
}
`;

  const typesPath = join(OUTPUT_DIR, "types.ts");
  writeFileSync(typesPath, typeDefinitions);

  console.log(
    `✓ Generated types.ts (${itemTypes.length} item types, ${rarities.length} rarities, ${sortedLanguages.length} languages`,
  );
  totalGenerated++;
}
