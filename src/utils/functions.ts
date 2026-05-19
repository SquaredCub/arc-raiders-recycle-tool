import type {
  Item,
  ItemRequirementLookup,
  LocalizedText,
} from "../generated/types";

// ============================================================================
// Constants
// ============================================================================

export const WIKI_BASE_URL = "https://arcraiders.wiki/wiki/";
export const NO_RESULTS_ID = "no-results";
export const DEFAULT_LANGUAGE: keyof LocalizedText = "en";

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
        if (
          formatMaterialName(material).toLowerCase().includes(lowerSearchTerm)
        ) {
          types.add("recycles");
          if (!matchedMaterials[item.id]) matchedMaterials[item.id] = new Set();
          matchedMaterials[item.id].add(material);
        }
      }
    }

    // Check which materials in salvagesInto match
    if (item.salvagesInto) {
      for (const material of Object.keys(item.salvagesInto)) {
        if (
          formatMaterialName(material).toLowerCase().includes(lowerSearchTerm)
        ) {
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
export const createNoResultsItem = (
  searchTerm: string,
  noResultsText?: string,
): Item => {
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
