import type { HideoutBench, Item } from "../generated/types";
import {
  IN_RAID_BENCH,
  type CraftUsage,
  type CraftUsageLookup,
} from "../data/craftingData";
import type { EnrichedItemRequirementLookup } from "../data/requirementsData";
import {
  formatMaterialName,
  getItemImageById,
} from "../data/itemsData";
import {
  getLocalizedText,
  type LanguageCode,
} from "../localization/languageUtils";
import {
  compareStrings,
  getItemSortName,
  sortMaterialsByName,
} from "./sortingFunctions";

// Cached material data structure
export interface CachedMaterial {
  material: string;
  quantity: number;
  name: string;
  image: string | undefined;
}

/**
 * Get the localized name for a material, falling back to formatMaterialName
 */
const getMaterialLocalizedName = (
  materialId: string,
  itemLookup: Map<string, Item>,
  language: LanguageCode,
): string => {
  const item = itemLookup.get(materialId);
  if (item) {
    return getLocalizedText(item.name, language);
  }
  return formatMaterialName(materialId);
};

/**
 * Localized names and images of a materials record, sorted by name
 */
const toCachedMaterials = (
  materials: Record<string, number>,
  itemLookup: Map<string, Item>,
  language: LanguageCode,
): CachedMaterial[] => {
  const getName = (id: string) => getMaterialLocalizedName(id, itemLookup, language);
  return sortMaterialsByName(Object.entries(materials), getName).map(
    ([material, quantity]) => ({
      material,
      quantity,
      name: getName(material),
      image: getItemImageById(material),
    }),
  );
};

/**
 * Cache sorted material entries for a given materials record
 */
const cacheMaterialEntries = (
  materials: Record<string, number>,
  prefix: string,
  itemId: string,
  itemLookup: Map<string, Item>,
  cache: Record<string, CachedMaterial[]>,
  language: LanguageCode,
) => {
  if (Object.keys(materials).length > 0) {
    cache[`${prefix}_${itemId}`] = toCachedMaterials(materials, itemLookup, language);
  }
};

/**
 * Create a lookup map for hideout bench names
 * Includes special case handling for "in_raid" -> "Field Crafting"
 */
export const createBenchNameLookup = (
  hideoutBenches: HideoutBench[],
  language: LanguageCode,
  fieldCraftingLabel = "Field Crafting",
): Record<string, string> => {
  const lookup: Record<string, string> = {
    [IN_RAID_BENCH]: fieldCraftingLabel, // Handle special case — not in game data
  };
  for (const bench of hideoutBenches) {
    lookup[bench.id] = getLocalizedText(bench.name, language) || bench.id;
  }
  return lookup;
};

/**
 * Pre-compute sorted materials for all items to avoid expensive operations on every render
 * Creates a cache mapping itemId to sorted material data with pre-computed names and images
 */
export const createSortedMaterialsCache = (
  items: Item[],
  language: LanguageCode,
): Record<string, CachedMaterial[]> => {
  const cache: Record<string, CachedMaterial[]> = {};

  // Build item lookup map for O(1) material image lookups
  const itemLookup = new Map<string, Item>();
  for (const item of items) {
    itemLookup.set(item.id, item);
  }

  for (const item of items) {
    if (item.recyclesInto) {
      cacheMaterialEntries(item.recyclesInto, "recycle", item.id, itemLookup, cache, language);
    }
    if (item.salvagesInto) {
      cacheMaterialEntries(item.salvagesInto, "salvage", item.id, itemLookup, cache, language);
    }
    if (item.recipe) {
      cacheMaterialEntries(item.recipe, "recipe", item.id, itemLookup, cache, language);
    }
  }

  return cache;
};

// Cached craft usage, ready to render
export interface CachedCraft extends CraftUsage {
  name: string;
  image: string;
  rarity: string | undefined;
  /** Alternative stations, "Gunsmith 2" style where the station has levels.
   *  In-raid crafting is given by inRaidLevel instead */
  stations: string[];
  recipe: CachedMaterial[];
}

/**
 * Pre-compute localized output names, images and bench labels of every craft
 * usage, sorted alphabetically by output name
 */
export const createCraftUsageCache = (
  craftUsages: CraftUsageLookup,
  allItems: Item[],
  hideoutBenches: HideoutBench[],
  benchNameLookup: Record<string, string>,
  language: LanguageCode,
): Record<string, CachedCraft[]> => {
  const itemLookup = new Map<string, Item>();
  for (const item of allItems) {
    itemLookup.set(item.id, item);
  }

  // The Workbench has no levels, so it is just "Workbench". Using any other
  // station takes at least level 1: a missing level (upgrades) means 1
  const leveledBenches = new Set(
    hideoutBenches.filter((bench) => bench.maxLevel > 0).map((bench) => bench.id),
  );
  const getStations = ({ benches, level }: CraftUsage) =>
    benches
      .filter((id) => id !== IN_RAID_BENCH)
      .map((id) => {
        const name = benchNameLookup[id] ?? formatMaterialName(id);
        return leveledBenches.has(id) ? `${name} ${level ?? 1}` : name;
      });

  const cache: Record<string, CachedCraft[]> = {};
  for (const [ingredientId, usages] of Object.entries(craftUsages)) {
    cache[ingredientId] = usages
      .map((usage) => ({
        ...usage,
        name: getMaterialLocalizedName(usage.outputId, itemLookup, language),
        image: getItemImageById(usage.outputId),
        rarity: itemLookup.get(usage.outputId)?.rarity,
        stations: getStations(usage),
        recipe: toCachedMaterials(usage.ingredients, itemLookup, language),
      }))
      .sort((a, b) => compareStrings(a.name, b.name));
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
  recycleTotals: Record<string, number>;
  salvageTotals: Record<string, number>;
}

/**
 * Create pre-computed sort keys for all items
 * Avoids repeated expensive operations during sorting
 */
export const createSortKeyCache = (
  items: Item[],
  _benchNameLookup: Record<string, string>,
  itemRequirements: EnrichedItemRequirementLookup,
  language: LanguageCode,
): SortKeyCache => {
  const nameSortKeys: Record<string, string> = {};
  const requirementTotals: Record<string, number> = {};
  const recycleTotals: Record<string, number> = {};
  const salvageTotals: Record<string, number> = {};

  for (const item of items) {
    // Pre-compute name sort key (lowercase for faster comparison)
    nameSortKeys[item.id] = getItemSortName(item, language).toLowerCase();

    // Pre-compute requirement total
    requirementTotals[item.id] = itemRequirements[item.id]?.totalQuantity ?? 0;

    // Pre-compute recycle/salvage material totals
    if (item.recyclesInto) {
      let total = 0;
      for (const qty of Object.values(item.recyclesInto)) total += qty;
      recycleTotals[item.id] = total;
    }
    if (item.salvagesInto) {
      let total = 0;
      for (const qty of Object.values(item.salvagesInto)) total += qty;
      salvageTotals[item.id] = total;
    }
  }

  return {
    nameSortKeys,
    requirementTotals,
    recycleTotals,
    salvageTotals,
  };
};
