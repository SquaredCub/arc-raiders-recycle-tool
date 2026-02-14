import type { Row, SortingState } from "@tanstack/react-table";
import type { Item, LocalizedText } from "../types";
import { DEFAULT_LANGUAGE, type SearchMatchType } from "./functions";
import type { SortKeyCache } from "./tableCache";

type ItemSortingFn = (rowA: Row<Item>, rowB: Row<Item>) => number;

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
// Base Column Sorting Functions (no search awareness)
// ============================================================================

/**
 * Sort alphabetically by pre-computed item name keys.
 */
export const createNameAlphabeticalSort = (
  sortKeyCache: SortKeyCache,
): ItemSortingFn =>
  (rowA, rowB) => {
    const nameA = sortKeyCache.nameSortKeys[rowA.original.id] || "";
    const nameB = sortKeyCache.nameSortKeys[rowB.original.id] || "";
    return compareStrings(nameA, nameB);
  };

/**
 * Sort by material match score for the given field (recycles or salvages).
 * Higher scores (more matched materials received) come first.
 */
export const createMaterialScoreSort = (
  materialMatchScores: Record<string, { recycles: number; salvages: number }>,
  scoreField: "recycles" | "salvages",
): ItemSortingFn =>
  (rowA, rowB) => {
    const scoreA = materialMatchScores[rowA.original.id]?.[scoreField] ?? 0;
    const scoreB = materialMatchScores[rowB.original.id]?.[scoreField] ?? 0;
    return scoreB - scoreA;
  };

/**
 * Sort alphabetically by Found In location, with empty values last.
 */
export const createFoundInAlphabeticalSort = (): ItemSortingFn =>
  (rowA, rowB) => {
    return compareStringsEmptyLast(rowA.original.foundIn, rowB.original.foundIn);
  };

/**
 * Sort by total requirement quantity.
 */
export const createRequirementTotalSort = (
  sortKeyCache: SortKeyCache,
): ItemSortingFn =>
  (rowA, rowB) => {
    const totalA = sortKeyCache.requirementTotals[rowA.original.id] ?? 0;
    const totalB = sortKeyCache.requirementTotals[rowB.original.id] ?? 0;
    return totalA - totalB;
  };

/**
 * Sort by item value (numeric).
 */
export const createValueSort = (): ItemSortingFn =>
  (rowA, rowB) => {
    return (rowA.original.value ?? 0) - (rowB.original.value ?? 0);
  };

// ============================================================================
// Search-Aware Sorting Wrapper
// ============================================================================

/**
 * Wrap a column sorting function to prioritize item name matches during search.
 * Items that matched on name are always pinned to the top (sorted alphabetically),
 * regardless of the column's sort direction. The remaining items are sorted
 * by the column-specific base sort with normal direction behavior.
 *
 * TanStack applies `sortResult * (isDesc ? -1 : 1)` to the sortingFn result.
 * We counter that multiplier for the name-match partition and within-name-match
 * alphabetical sort, while leaving the base sort untouched.
 */
const withNameMatchPriority = (
  baseSortFn: ItemSortingFn,
  searchMatchTypes: Record<string, Set<SearchMatchType>>,
  sortKeyCache: SortKeyCache,
  directionMultiplier: number,
): ItemSortingFn =>
  (rowA, rowB) => {
    const aNameMatch = searchMatchTypes[rowA.original.id]?.has("item") ?? false;
    const bNameMatch = searchMatchTypes[rowB.original.id]?.has("item") ?? false;

    if (aNameMatch && !bNameMatch) return -1 * directionMultiplier;
    if (!aNameMatch && bNameMatch) return 1 * directionMultiplier;

    if (aNameMatch && bNameMatch) {
      const nameA = sortKeyCache.nameSortKeys[rowA.original.id] || "";
      const nameB = sortKeyCache.nameSortKeys[rowB.original.id] || "";
      return compareStrings(nameA, nameB) * directionMultiplier;
    }

    return baseSortFn(rowA, rowB);
  };

/**
 * Create a helper that produces search-aware sorting functions for table columns.
 * When search is active, wraps the base sort with name-match priority.
 * When search is inactive, returns the base sort as-is.
 */
export const createSearchAwareSortFactory = (
  hasActiveSearch: boolean,
  searchMatchTypes: Record<string, Set<SearchMatchType>>,
  sortKeyCache: SortKeyCache,
  sorting: SortingState,
) =>
  (baseSortFn: ItemSortingFn, columnId: string): ItemSortingFn => {
    if (!hasActiveSearch) return baseSortFn;

    const isDesc = sorting.find((s) => s.id === columnId)?.desc ?? false;
    const directionMultiplier = isDesc ? -1 : 1;

    return withNameMatchPriority(baseSortFn, searchMatchTypes, sortKeyCache, directionMultiplier);
  };
