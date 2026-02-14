import { BLACKLISTED_ITEM_CATEGORIES } from "../constants/itemCategories";
import { getImageUrl } from "../services/dataService";
import type { Item } from "../types";

export const COINS_IMAGE_URL = getImageUrl("images/coins.png");

// Helper function to get image for an item
export const getItemImage = (item: Item): string | undefined => {
  // Use GitHub CDN for images
  if (item.imageFilename) {
    const urlFilename = item.imageFilename.split("/").pop();
    if (urlFilename) {
      return getImageUrl(`images/items/${urlFilename}`);
    }
  }
  if (item.id) {
    return getImageUrl(`images/items/${item.id}.png`);
  }
  return undefined;
};

// Helper function to get image for a material by ID
// This requires access to the items map for O(1) lookup
export const getMaterialImage = (materialId: string, itemLookup: Map<string, Item>): string | undefined => {
  const item = itemLookup.get(materialId);
  if (item) {
    return getItemImage(item);
  }
  // Fallback to constructing URL from ID
  return getImageUrl(`images/items/${materialId}.png`);
};

// Helper function to capitalize material names
export const formatMaterialName = (materialId: string): string => {
  return materialId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const filterBlacklistedItemCategories = (items: Item[]): Item[] => {
  return items.filter(
    (item) => !BLACKLISTED_ITEM_CATEGORIES.includes(item.type),
  );
};
