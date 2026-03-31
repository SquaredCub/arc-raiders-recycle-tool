// ============================================================================
// Find Profitable Crafts
// ============================================================================
// Analyzes game items to find crafting recipes where the output value exceeds
// the total input material cost, sorted by profit (highest first).
//
// Usage: node scripts/find-profitable-crafts.js
// ============================================================================

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(readFileSync(join(__dirname, "../src/generated/items.json"), "utf-8"));

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
      console.warn(`Warning: Material "${materialId}" not found for recipe of "${item.id}"`);
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

  const profitMargin = totalInputCost > 0 ? (profit / totalInputCost) * 100 : Infinity;

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

profitableCrafts.sort((a, b) => b.profit - a.profit);

// Print results
console.log(`\nFound ${profitableCrafts.length} profitable crafting recipe(s):\n`);

for (const craft of profitableCrafts) {
  console.log(`--- ${craft.name} ---`);
  console.log(`  Output: ${craft.craftQuantity}x @ ${craft.totalOutputValue} coins`);
  console.log(`  Recipe:`);
  for (const mat of craft.recipe) {
    console.log(`    ${mat.quantity}x ${mat.name} (${mat.totalValue} coins)`);
  }
  console.log(`  Total Cost: ${craft.totalInputCost} coins`);
  console.log(`  Profit: +${craft.profit} coins (${craft.profitMargin.toFixed(1)}% margin)`);
  console.log();
}
