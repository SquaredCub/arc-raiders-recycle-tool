import type { Item, LocalizedText } from "../types";

// ============================================================================
// Constants
// ============================================================================

export const WIKI_BASE_URL = "https://arcraiders.wiki/wiki/";
export const NO_RESULTS_ID = "no-results";
export const DEFAULT_LANGUAGE: keyof LocalizedText = "en";

// ============================================================================
// URL/ID Formatting Functions
// ============================================================================

/**
 * Check if a word is a Roman numeral
 */
const isRomanNumeral = (word: string): boolean => /^[IVX]+$/i.test(word);

/**
 * Check if a word is the ARC acronym
 */
const isArcAcronym = (word: string): boolean => word.toUpperCase() === "ARC";

/**
 * Check if a word matches the mk pattern (e.g., mk3, mk2)
 */
const isMkPattern = (word: string): boolean => /^mk\d+$/i.test(word);

/**
 * Format a word that matches the mk pattern
 * Example: mk3 → Mk._3
 */
const formatMkPattern = (word: string): string => {
  const match = word.match(/^mk(\d+)$/i);
  return match ? `Mk._${match[1]}` : word;
};

/**
 * Capitalize the first letter of a word
 */
const capitalizeWord = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

/**
 * Capitalize an item ID for use in wiki URLs
 * Handles special cases:
 * - Gun variants (single_word_i/ii/iii) - strips Roman numeral
 * - Augments with mk pattern - formats as Mk._X_(Word)
 * - ARC acronym - keeps uppercase
 * - Roman numerals - keeps uppercase
 */
export const capitalizeItemId = (id?: string): string | null => {
  if (!id) return null;

  const words = id.split("_");

  // EDGE CASE 1: Gun variants (e.g., osprey_i, osprey_ii)
  // Remove Roman numeral suffix for guns so all variants share one link
  // Pattern: ONEWORD_NUMBER = gun, MORE_THAN_ONE_WORD_NUMBER = not a gun
  const isGunVariant =
    words.length === 2 && isRomanNumeral(words[words.length - 1]);
  const wordsForUrl = isGunVariant ? words.slice(0, -1) : words;

  // EDGE CASE 2: Augments with mk pattern (e.g., combat_mk3_aggressive)
  // Check if there's a word after the mk pattern that needs parentheses
  const mkIndex = wordsForUrl.findIndex(isMkPattern);
  const hasAugmentPattern = mkIndex !== -1 && mkIndex < wordsForUrl.length - 1;

  // Process each word based on the edge cases
  const processedWords = wordsForUrl.map((word, index) => {
    // EDGE CASE 2: Format mk patterns (mk3 → Mk._3)
    if (isMkPattern(word)) {
      return formatMkPattern(word);
    }

    // EDGE CASE 3: Keep ARC acronym uppercase
    if (isArcAcronym(word)) {
      return "ARC";
    }

    // Keep Roman numerals uppercase (when not stripped by gun variant logic)
    if (isRomanNumeral(word)) {
      return word.toUpperCase();
    }

    // EDGE CASE 2: Wrap last word in parentheses for augment pattern
    const isLastWord = index === wordsForUrl.length - 1;
    if (isLastWord && hasAugmentPattern) {
      return `(${capitalizeWord(word)})`;
    }

    // DEFAULT: Standard capitalization
    return capitalizeWord(word);
  });

  return processedWords.join("_");
};

// ============================================================================
// Search/Filter Functions
// ============================================================================

/**
 * Filter items based on search term
 * Returns name matches first, then material matches
 */
export const filterItemsBySearch = (
  items: Item[],
  searchTerm: string,
  formatMaterialName: (id: string) => string,
  language: keyof LocalizedText = DEFAULT_LANGUAGE
): Item[] => {
  if (!searchTerm.trim()) {
    return items;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  // Separate items into two groups: name matches and material matches
  const nameMatches: Item[] = [];
  const materialMatches: Item[] = [];

  for (const item of items) {
    const itemName = item.name[language]?.toLowerCase();

    // Check if item name matches
    if (itemName && itemName.includes(lowerSearchTerm)) {
      nameMatches.push(item);
      continue;
    }

    // Check if any material in recyclesInto matches
    if (item.recyclesInto) {
      const materials = Object.keys(item.recyclesInto);
      const hasMatch = materials.some((material) => {
        const materialName = formatMaterialName(material).toLowerCase();
        return materialName.includes(lowerSearchTerm);
      });

      if (hasMatch) {
        materialMatches.push(item);
      }
    }
  }

  // Return name matches first, then material matches
  return [...nameMatches, ...materialMatches];
};

/**
 * Create a "no results" placeholder item
 */
export const createNoResultsItem = (searchTerm: string): Item => {
  return {
    id: NO_RESULTS_ID,
    name: { en: `No items found matching "${searchTerm}"` },
    description: { en: "" },
    type: "Misc" as const,
    rarity: "",
    value: 0,
    weightKg: 0,
    stackSize: 0,
    imageFilename: "",
    updatedAt: "",
  };
};

/**
 * Check if an item is the "no results" placeholder
 */
export const isNoResultsItem = (itemId: string): boolean => {
  return itemId === NO_RESULTS_ID;
};

// ============================================================================
// Sorting Functions
// ============================================================================

/**
 * Sort material entries alphabetically by name
 */
export const sortMaterialsByName = (
  entries: [string, number][],
  formatMaterialName: (id: string) => string
): [string, number][] => {
  return entries.sort(([materialA], [materialB]) => {
    return formatMaterialName(materialA).localeCompare(
      formatMaterialName(materialB)
    );
  });
};

// ============================================================================
// Sort Key Computation Functions (Performance Optimization)
// ============================================================================

/**
 * Extract the item name in the specified language with fallback to 'en'
 * Used for pre-computing sort keys to avoid repeated localeCompare calls
 */
export const getItemSortName = (
  item: Item,
  language: keyof LocalizedText = DEFAULT_LANGUAGE
): string => {
  return item.name[language] || item.name.en || "";
};

/**
 * Get the bench name(s) as a sortable string
 * Handles both string and string[] types, returns empty string for null/undefined
 */
export const getBenchSortKey = (
  craftBench: string | string[] | undefined,
  getBenchName: (benchId: string) => string
): string => {
  if (!craftBench) return "";
  return Array.isArray(craftBench)
    ? craftBench.map(getBenchName).join(", ")
    : getBenchName(craftBench);
};

/**
 * Simple string comparison function (faster than localeCompare for ASCII-only strings)
 * Falls back to localeCompare for non-ASCII characters
 */
export const compareStrings = (a: string, b: string): number => {
  // Fast path for ASCII-only strings (most common case)
  if (/^[\x00-\x7F]*$/.test(a) && /^[\x00-\x7F]*$/.test(b)) {
    return a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0;
  }
  // Fallback to localeCompare for internationalized strings
  return a.localeCompare(b, undefined, { sensitivity: "base" });
};
