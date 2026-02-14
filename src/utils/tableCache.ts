import type { HideoutBench, Item, ItemRequirementLookup } from "../types";
import {
  formatMaterialName,
  getMaterialImage,
} from "../data/itemsData";
import { DEFAULT_LANGUAGE } from "./functions";
import { sortMaterialsByName, getItemSortName } from "./sortingFunctions";

// Cached material data structure
export interface CachedMaterial {
  material: string;
  quantity: number;
  name: string;
  image: string | undefined;
}

/**
 * Cache sorted material entries for a given materials record
 */
const cacheMaterialEntries = (
  materials: Record<string, number>,
  prefix: string,
  itemId: string,
  itemLookup: Map<string, Item>,
  cache: Record<string, CachedMaterial[]>,
) => {
  if (Object.keys(materials).length > 0) {
    const sortedEntries = sortMaterialsByName(
      Object.entries(materials),
      formatMaterialName,
    );
    cache[`${prefix}_${itemId}`] = sortedEntries.map(([material, quantity]) => ({
      material,
      quantity,
      name: formatMaterialName(material),
      image: getMaterialImage(material, itemLookup),
    }));
  }
};

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

  // Build item lookup map for O(1) material image lookups
  const itemLookup = new Map<string, Item>();
  for (const item of items) {
    itemLookup.set(item.id, item);
  }

  for (const item of items) {
    if (item.recyclesInto) {
      cacheMaterialEntries(item.recyclesInto, "recycle", item.id, itemLookup, cache);
    }
    if (item.salvagesInto) {
      cacheMaterialEntries(item.salvagesInto, "salvage", item.id, itemLookup, cache);
    }
    if (item.recipe) {
      cacheMaterialEntries(item.recipe, "recipe", item.id, itemLookup, cache);
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
  requirementTotals: Record<string, number>;
}

/**
 * Create pre-computed sort keys for all items
 * Avoids repeated expensive operations during sorting
 */
export const createSortKeyCache = (
  items: Item[],
  _benchNameLookup: Record<string, string>,
  itemRequirements: ItemRequirementLookup
): SortKeyCache => {
  const nameSortKeys: Record<string, string> = {};
  const requirementTotals: Record<string, number> = {};

  for (const item of items) {
    // Pre-compute name sort key (lowercase for faster comparison)
    nameSortKeys[item.id] = getItemSortName(item, DEFAULT_LANGUAGE).toLowerCase();

    // Pre-compute requirement total
    requirementTotals[item.id] = itemRequirements[item.id]?.totalQuantity ?? 0;
  }

  return {
    nameSortKeys,
    requirementTotals,
  };
};
