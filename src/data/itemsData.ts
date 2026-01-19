import { BLACKLISTED_ITEM_CATEGORIES } from "../constants/itemCategories";
import { getImageUrl } from "../services/dataService";
import type { Item } from "../types";

// Helper to get local image map (only in development)
function getLocalImageMap(): Record<string, string> {
  if (import.meta.env.MODE !== "development") return {};
  const imageModules = import.meta.glob<{ default: string }>(
    "../arcraiders-data/images/items/*.png",
    { eager: true },
  );
  const map: Record<string, string> = {};
  Object.entries(imageModules).forEach(([path, module]) => {
    const filename = path.split("/").pop()?.replace(".png", "") || "";
    map[filename] = module.default;
  });
  return map;
}

// Helper function to get image for an item
export const getItemImage = (item: Item): string | undefined => {
  if (import.meta.env.MODE === "development") {
    const imageMap = getLocalImageMap();
    // Try exact match first (e.g., "bettina_i" -> "bettina_i.png")
    if (imageMap[item.id]) {
      return imageMap[item.id];
    }
    // Fallback: Extract base name from the imageFilename URL
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
  }
};

// Helper function to get image for a material by ID
export const getMaterialImage = (materialId: string): string | undefined => {
  if (import.meta.env.MODE === "development") {
    const imageMap = getLocalImageMap();
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
