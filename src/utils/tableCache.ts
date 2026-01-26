import type { HideoutBench, Item } from "../types";
import {
  formatMaterialName,
  getMaterialImage,
} from "../data/itemsData";
import { sortMaterialsByName, DEFAULT_LANGUAGE } from "./functions";

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
        image: getMaterialImage(material),
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
        image: getMaterialImage(material),
      }));
    }
  }

  return cache;
};
