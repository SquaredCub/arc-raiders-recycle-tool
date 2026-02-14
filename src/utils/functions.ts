import type { Item, ItemRequirementLookup, LocalizedText } from "../types";

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
 * Returns exact matches first, then name matches starting with search term,
 * then other name matches, then material matches
 */
export type SearchMatchType = "item" | "recycles" | "salvages" | "requirement";

export interface SearchResult {
  items: Item[];
  matchTypes: Record<string, Set<SearchMatchType>>;
}

export const filterItemsBySearch = (
  items: Item[],
  searchTerm: string,
  formatMaterialName: (id: string) => string,
  language: keyof LocalizedText = DEFAULT_LANGUAGE,
  itemRequirements?: ItemRequirementLookup,
): SearchResult => {
  if (!searchTerm.trim()) {
    return { items, matchTypes: {} };
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  // Separate items into groups based on match quality
  const exactMatches: Item[] = [];
  const startsWithMatches: Item[] = [];
  const otherNameMatches: Item[] = [];
  const materialMatches: Item[] = [];
  const requirementMatches: Item[] = [];
  const matchTypes: Record<string, Set<SearchMatchType>> = {};

  for (const item of items) {
    const types = new Set<SearchMatchType>();
    const itemName = item.name[language]?.toLowerCase();

    // Check if item name matches
    if (itemName && itemName.includes(lowerSearchTerm)) {
      types.add("item");
    }

    // Check if any material in recyclesInto matches
    if (item.recyclesInto) {
      const hasMatch = Object.keys(item.recyclesInto).some((material) =>
        formatMaterialName(material).toLowerCase().includes(lowerSearchTerm),
      );
      if (hasMatch) types.add("recycles");
    }

    // Check if any material in salvagesInto matches
    if (item.salvagesInto) {
      const hasMatch = Object.keys(item.salvagesInto).some((material) =>
        formatMaterialName(material).toLowerCase().includes(lowerSearchTerm),
      );
      if (hasMatch) types.add("salvages");
    }

    // Check if any requirement source matches
    if (itemRequirements) {
      const requirements = itemRequirements[item.id];
      if (requirements) {
        const hasMatch = requirements.usedIn.some((usage) =>
          usage.source.toLowerCase().includes(lowerSearchTerm),
        );
        if (hasMatch) types.add("requirement");
      }
    }

    if (types.size === 0) continue;

    matchTypes[item.id] = types;

    // Place into priority bucket based on highest-priority match
    if (types.has("item")) {
      if (itemName === lowerSearchTerm) {
        exactMatches.push(item);
      } else if (itemName?.startsWith(lowerSearchTerm)) {
        startsWithMatches.push(item);
      } else {
        otherNameMatches.push(item);
      }
    } else if (types.has("recycles") || types.has("salvages")) {
      materialMatches.push(item);
    } else {
      requirementMatches.push(item);
    }
  }

  return {
    items: [
      ...exactMatches,
      ...startsWithMatches,
      ...otherNameMatches,
      ...materialMatches,
      ...requirementMatches,
    ],
    matchTypes,
  };
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

