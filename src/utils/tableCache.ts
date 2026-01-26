import type { HideoutBench, Item, ItemRequirementLookup } from "../types";
import {
  formatMaterialName,
  getMaterialImage,
} from "../data/itemsData";
import { sortMaterialsByName, DEFAULT_LANGUAGE, getItemSortName, getBenchSortKey } from "./functions";

// Cached material data structure
export interface CachedMaterial {
  material: string;
  quantity: number;
  name: string;
  image: string | undefined;
}

/**
 * Create a lookup map for hideout bench names
 * Includes special case handling for "in_raid" -> "Field Crafting"
 */
export const createBenchNameLookup = (
  hideoutBenches: HideoutBench[]
): Record<string, string> => {
  const lookup: Record<string, string> = {
    in_raid: "Field Crafting", // Handle special case
  };
  for (const bench of hideoutBenches) {
    lookup[bench.id] = bench.name[DEFAULT_LANGUAGE] || bench.id;
  }
  return lookup;
};

/**
 * Pre-compute sorted materials for all items to avoid expensive operations on every render
 * Creates a cache mapping itemId to sorted material data with pre-computed names and images
 */
export const createSortedMaterialsCache = (
  items: Item[]
): Record<string, CachedMaterial[]> => {
  const cache: Record<string, CachedMaterial[]> = {};

  for (const item of items) {
    // Cache recyclesInto materials
    if (item.recyclesInto && Object.keys(item.recyclesInto).length > 0) {
      const sortedEntries = sortMaterialsByName(
        Object.entries(item.recyclesInto),
        formatMaterialName
      );
      cache[`recycle_${item.id}`] = sortedEntries.map(([material, quantity]) => ({
        material,
        quantity,
        name: formatMaterialName(material),
        image: getMaterialImage(material, items),
      }));
    }

    // Cache recipe materials
    if (item.recipe && Object.keys(item.recipe).length > 0) {
      const sortedEntries = sortMaterialsByName(
        Object.entries(item.recipe),
        formatMaterialName
      );
      cache[`recipe_${item.id}`] = sortedEntries.map(([material, quantity]) => ({
        material,
        quantity,
        name: formatMaterialName(material),
        image: getMaterialImage(material, items),
      }));
    }
  }

  return cache;
};

// ============================================================================
// Sort Key Cache (Performance Optimization)
// ============================================================================

/**
 * Pre-computed sort keys for efficient table sorting
 */
export interface SortKeyCache {
  nameSortKeys: Record<string, string>;
  benchSortKeys: Record<string, string>;
  requirementTotals: Record<string, number>;
}

/**
 * Create pre-computed sort keys for all items
 * Avoids repeated expensive operations during sorting
 */
export const createSortKeyCache = (
  items: Item[],
  benchNameLookup: Record<string, string>,
  itemRequirements: ItemRequirementLookup
): SortKeyCache => {
  const nameSortKeys: Record<string, string> = {};
  const benchSortKeys: Record<string, string> = {};
  const requirementTotals: Record<string, number> = {};

  // Helper function to get bench name from lookup
  const getBenchName = (benchId: string): string => {
    return benchNameLookup[benchId] || benchId;
  };

  for (const item of items) {
    // Pre-compute name sort key (lowercase for faster comparison)
    nameSortKeys[item.id] = getItemSortName(item, DEFAULT_LANGUAGE).toLowerCase();

    // Pre-compute bench sort key
    benchSortKeys[item.id] = getBenchSortKey(item.craftBench, getBenchName);

    // Pre-compute requirement total
    requirementTotals[item.id] = itemRequirements[item.id]?.totalQuantity ?? 0;
  }

  return {
    nameSortKeys,
    benchSortKeys,
    requirementTotals,
  };
};
