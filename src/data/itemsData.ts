import {
  AMPLIFIED_WEAPON_ID_PATTERN,
  BLACKLISTED_ITEM_CATEGORIES,
} from "../constants/itemCategories";
import type { Item } from "../generated/types";
import { getImageUrl } from "../services/dataService";

export const COINS_IMAGE_URL = getImageUrl("images/coins.png");

// Item images are downloaded by scripts/fetch-images.js as public/images/items/<id>.png
export const getItemImageById = (itemId: string): string =>
  getImageUrl(`images/items/${itemId}.png`);

export const getItemImage = (item: Item): string => getItemImageById(item.id);

// Helper function to capitalize material names
export const formatMaterialName = (materialId: string): string => {
  return materialId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const filterBlacklistedItemCategories = (items: Item[]): Item[] => {
  return items.filter(
    (item) =>
      !BLACKLISTED_ITEM_CATEGORIES.includes(item.type) &&
      !AMPLIFIED_WEAPON_ID_PATTERN.test(item.id),
  );
};
