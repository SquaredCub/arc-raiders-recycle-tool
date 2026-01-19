import { BLACKLISTED_ITEM_CATEGORIES } from "../constants/itemCategories";
import { getImageUrl, USE_LOCAL_DATA } from "../services/dataService";
import type { Item } from "../types";

// Import all images from the items directory (only for local development)
const imageMap: Record<string, string> = {};

if (USE_LOCAL_DATA) {
  const imageModules = import.meta.glob<{ default: string }>(
    "../arcraiders-data/images/items/*.png",
    { eager: true },
  );

  Object.entries(imageModules).forEach(([path, module]) => {
    // Extract filename from path (e.g., "../arcraiders-data/images/items/acoustic_guitar.png" -> "acoustic_guitar")
    const filename = path.split("/").pop()?.replace(".png", "") || "";
    imageMap[filename] = module.default;
  });
}

// Helper function to get image for an item
export const getItemImage = (item: Item): string | undefined => {
  if (USE_LOCAL_DATA) {
    // Try exact match first (e.g., "bettina_i" -> "bettina_i.png")
    if (imageMap[item.id]) {
      return imageMap[item.id];
    }

    // Fallback: Extract base name from the imageFilename URL
    // e.g., "https://cdn.arctracker.io/items/bettina.png" -> "bettina"
    if (item.imageFilename) {
      const urlFilename = item.imageFilename
        .split("/")
        .pop()
        ?.replace(".png", "");
      if (urlFilename && imageMap[urlFilename]) {
        return imageMap[urlFilename];
      }
    }

    return undefined;
  } else {
    // Use GitHub raw URL for images
    // First, check if imageFilename exists and extract the actual filename from it
    if (item.imageFilename) {
      const urlFilename = item.imageFilename.split("/").pop();
      if (urlFilename) {
        return getImageUrl(`images/items/${urlFilename}`);
      }
    }

    // Fallback: use item.id if imageFilename doesn't exist
    if (item.id) {
      return getImageUrl(`images/items/${item.id}.png`);
    }

    return undefined;
  }
};

// Helper function to get image for a material by ID
export const getMaterialImage = (materialId: string): string | undefined => {
  if (USE_LOCAL_DATA) {
    return imageMap[materialId];
  } else {
    return getImageUrl(`images/items/${materialId}.png`);
  }
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
