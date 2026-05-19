// ============================================================================
// Find Profitable Crafts (Bun Optimized)
// ============================================================================
// Analyzes game items to find crafting recipes where the output value exceeds
// the total input material cost, sorted by profit (highest first).
// ============================================================================

import { join } from "node:path";

// Bun provides import.meta.dir natively
const ITEMS_PATH = join(import.meta.dir, "../src/generated/items.json");

// Load items using Bun's high-speed JSON parser
const items = await Bun.file(ITEMS_PATH).json();
const itemsMap = new Map(items.map((item) => [item.id, item]));

const profitableCrafts = [];

for (const item of items) {
  if (!item.recipe) continue;

  const craftQuantity = item.craftQuantity ?? 1;
  const totalOutputValue = (item.value ?? 0) * craftQuantity;

  let totalInputCost = 0;
  let missingMaterial = false;
  const recipeDetails = [];

  for (const [materialId, quantity] of Object.entries(item.recipe)) {
    const material = itemsMap.get(materialId);

    if (!material) {
      console.warn(
        `\x1b[33mWarning:\x1b[0m Material "${materialId}" not found for recipe of "${item.id}"`,
      );
      missingMaterial = true;
      break;
    }

    const materialTotalValue = (material.value ?? 0) * quantity;
    totalInputCost += materialTotalValue;

    recipeDetails.push({
      id: materialId,
      name: material.name?.en ?? materialId,
      quantity,
      unitValue: material.value ?? 0,
      totalValue: materialTotalValue,
    });
  }

  if (missingMaterial) continue;

  const profit = totalOutputValue - totalInputCost;
  if (profit <= 0) continue;

  const profitMargin =
    totalInputCost > 0 ? (profit / totalInputCost) * 100 : Infinity;

  profitableCrafts.push({
    id: item.id,
    name: item.name?.en ?? item.id,
    craftQuantity,
    totalOutputValue,
    recipe: recipeDetails,
    totalInputCost,
    profit,
    profitMargin,
  });
}

// Sort by profit (descending)
profitableCrafts.sort((a, b) => b.profit - a.profit);

// Colors for output
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m"; // No Color

console.log(
  `\nFound ${BOLD}${profitableCrafts.length}${NC} profitable crafting recipe(s):\n`,
);

for (const craft of profitableCrafts) {
  console.log(`${BOLD}--- ${craft.name} ---${NC}`);
  console.log(
    `  Output: ${craft.craftQuantity}x @ ${craft.totalOutputValue} coins`,
  );
  console.log(`  Recipe:`);
  for (const mat of craft.recipe) {
    console.log(`    ${mat.quantity}x ${mat.name} (${mat.totalValue} coins)`);
  }
  console.log(`  Total Cost: ${craft.totalInputCost} coins`);
  console.log(
    `  Profit: ${GREEN}+${craft.profit} coins${NC} (${YELLOW}${craft.profitMargin.toFixed(1)}% margin${NC})`,
  );
  console.log();
}
