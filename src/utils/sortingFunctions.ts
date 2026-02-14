import type { SortingState } from "@tanstack/react-table";
import type { Item, LocalizedText } from "../types";
import { DEFAULT_LANGUAGE, type SearchMatchType } from "./functions";
import type { SortKeyCache } from "./tableCache";

// ============================================================================
// String Comparison Utilities
// ============================================================================

/**
 * Fast string comparison optimized for ASCII strings.
 * Falls back to localeCompare for non-ASCII characters.
 */
export const compareStrings = (a: string, b: string): number => {
  // Fast path for ASCII-only strings (most common case)
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(a) && /^[\x00-\x7F]*$/.test(b)) {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    return aLower < bLower ? -1 : aLower > bLower ? 1 : 0;
  }
  // Fallback to localeCompare for internationalized strings
  return a.localeCompare(b, undefined, { sensitivity: "base" });
};

/**
 * Compare two strings, pushing empty/falsy values to the end.
 */
export const compareStringsEmptyLast = (
  a: string | undefined,
  b: string | undefined,
): number => {
  const aVal = a || "";
  const bVal = b || "";
  if (!aVal && !bVal) return 0;
  if (!aVal) return 1;
  if (!bVal) return -1;
  return compareStrings(aVal, bVal);
};

/**
 * Sort material entries alphabetically by their formatted name.
 */
export const sortMaterialsByName = (
  entries: [string, number][],
  formatMaterialName: (id: string) => string,
): [string, number][] => {
  return entries.sort(([materialA], [materialB]) => {
    return formatMaterialName(materialA).localeCompare(
      formatMaterialName(materialB),
    );
  });
};

// ============================================================================
// Sort Key Computation Helpers
// ============================================================================

/**
 * Extract the item name in the specified language with fallback to 'en'.
 */
export const getItemSortName = (
  item: Item,
  language: keyof LocalizedText = DEFAULT_LANGUAGE,
): string => {
  return item.name[language] || item.name.en || "";
};

/**
 * Get bench name(s) as a sortable string.
 * Handles both single string and string[] types.
 */
export const getBenchSortKey = (
  craftBench: string | string[] | undefined,
  getBenchName: (benchId: string) => string,
): string => {
  if (!craftBench) return "";
  return Array.isArray(craftBench)
    ? craftBench.map(getBenchName).join(", ")
    : getBenchName(craftBench);
};

// ============================================================================
// Manual Sorting (used with manualSorting: true)
// ============================================================================

export interface SortItemsConfig {
  prioritizeNameMatches: boolean;
  searchMatchTypes: Record<string, Set<SearchMatchType>>;
  sortKeyCache: SortKeyCache;
  materialMatchScores: Record<string, { recycles: number; salvages: number }>;
}

/**
 * Get a pure ascending-order comparator for a given column.
 * Returns (a: Item, b: Item) => number.
 */
const getColumnComparator = (
  columnId: string,
  config: SortItemsConfig,
): ((a: Item, b: Item) => number) => {
  switch (columnId) {
    case "item":
      return (a, b) => {
        const nameA = config.sortKeyCache.nameSortKeys[a.id] || "";
        const nameB = config.sortKeyCache.nameSortKeys[b.id] || "";
        return compareStrings(nameA, nameB);
      };
    case "recycles":
      return (a, b) => {
        const scoreA = config.materialMatchScores[a.id]?.recycles ?? 0;
        const scoreB = config.materialMatchScores[b.id]?.recycles ?? 0;
        return scoreA - scoreB;
      };
    case "salvages":
      return (a, b) => {
        const scoreA = config.materialMatchScores[a.id]?.salvages ?? 0;
        const scoreB = config.materialMatchScores[b.id]?.salvages ?? 0;
        return scoreA - scoreB;
      };
    case "foundIn":
      return (a, b) => compareStringsEmptyLast(a.foundIn, b.foundIn);
    case "neededFor":
      return (a, b) => {
        const totalA = config.sortKeyCache.requirementTotals[a.id] ?? 0;
        const totalB = config.sortKeyCache.requirementTotals[b.id] ?? 0;
        return totalA - totalB;
      };
    case "value":
      return (a, b) => (a.value ?? 0) - (b.value ?? 0);
    default:
      return () => 0;
  }
};

/**
 * Sort items with optional name-match pinning.
 *
 * When prioritizeNameMatches is true:
 *   1. Partition into nameMatches and others
 *   2. Sort nameMatches alphabetically (always ascending)
 *   3. Sort others by selected column with direction
 *   4. Return [...nameMatches, ...others]
 *
 * When prioritizeNameMatches is false:
 *   Sort all items by selected column with direction.
 */
export const sortItems = (
  items: Item[],
  sorting: SortingState,
  config: SortItemsConfig,
): Item[] => {
  if (sorting.length === 0) return items;

  const { id: columnId, desc } = sorting[0];
  const comparator = getColumnComparator(columnId, config);
  const directionMultiplier = desc ? -1 : 1;

  const sortWithDirection = (a: Item, b: Item) =>
    comparator(a, b) * directionMultiplier;

  if (config.prioritizeNameMatches) {
    const nameMatches: Item[] = [];
    const others: Item[] = [];

    for (const item of items) {
      if (config.searchMatchTypes[item.id]?.has("item")) {
        nameMatches.push(item);
      } else {
        others.push(item);
      }
    }

    // Both partitions sorted by selected column with direction
    nameMatches.sort(sortWithDirection);
    others.sort(sortWithDirection);

    return [...nameMatches, ...others];
  }

  // No name-match pinning: sort everything by selected column
  const sorted = [...items];
  sorted.sort(sortWithDirection);
  return sorted;
};
