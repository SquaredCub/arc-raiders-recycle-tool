import type { Item, ItemRequirementLookup, LocalizedText } from "../generated/types";

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
 * Returns matched items and their match types for highlighting
 */
export type SearchMatchType = "item" | "recycles" | "salvages" | "requirement";

export interface SearchResult {
  items: Item[];
  matchTypes: Record<string, Set<SearchMatchType>>;
  matchedMaterials: Record<string, Set<string>>;
  matchedSources: Record<string, Set<string>>;
}

export const filterItemsBySearch = (
  items: Item[],
  searchTerm: string,
  formatMaterialName: (id: string) => string,
  language: keyof LocalizedText = DEFAULT_LANGUAGE,
  itemRequirements?: ItemRequirementLookup,
): SearchResult => {
  if (!searchTerm.trim()) {
    return { items, matchTypes: {}, matchedMaterials: {}, matchedSources: {} };
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  const matchedItems: Item[] = [];
  const matchTypes: Record<string, Set<SearchMatchType>> = {};
  const matchedMaterials: Record<string, Set<string>> = {};
  const matchedSources: Record<string, Set<string>> = {};

  for (const item of items) {
    const types = new Set<SearchMatchType>();
    const itemName = item.name[language]?.toLowerCase();

    // Check if item name matches
    if (itemName && itemName.includes(lowerSearchTerm)) {
      types.add("item");
    }

    // Check which materials in recyclesInto match
    if (item.recyclesInto) {
      for (const material of Object.keys(item.recyclesInto)) {
        if (formatMaterialName(material).toLowerCase().includes(lowerSearchTerm)) {
          types.add("recycles");
          if (!matchedMaterials[item.id]) matchedMaterials[item.id] = new Set();
          matchedMaterials[item.id].add(material);
        }
      }
    }

    // Check which materials in salvagesInto match
    if (item.salvagesInto) {
      for (const material of Object.keys(item.salvagesInto)) {
        if (formatMaterialName(material).toLowerCase().includes(lowerSearchTerm)) {
          types.add("salvages");
          if (!matchedMaterials[item.id]) matchedMaterials[item.id] = new Set();
          matchedMaterials[item.id].add(material);
        }
      }
    }

    // Check which requirement sources match
    if (itemRequirements) {
      const requirements = itemRequirements[item.id];
      if (requirements) {
        for (const usage of requirements.usedIn) {
          if (usage.source.toLowerCase().includes(lowerSearchTerm)) {
            types.add("requirement");
            if (!matchedSources[item.id]) matchedSources[item.id] = new Set();
            matchedSources[item.id].add(usage.source);
          }
        }
      }
    }

    if (types.size === 0) continue;

    matchTypes[item.id] = types;
    matchedItems.push(item);
  }

  return {
    items: matchedItems,
    matchTypes,
    matchedMaterials,
    matchedSources,
  };
};

/**
 * Create a "no results" placeholder item
 */
export const createNoResultsItem = (searchTerm: string, noResultsText?: string): Item => {
  return {
    id: NO_RESULTS_ID,
    name: { en: noResultsText ?? `No items found matching "${searchTerm}"` },
    description: { en: "" },
    type: "Misc" as const,
    rarity: "Common" as const,
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
