import type { ItemType } from "../generated/types";
import { ITEM_TYPES } from "../generated/types";

export const BLACKLISTED_ITEM_CATEGORIES: ItemType[] = [
  "Key",
  "Blueprint",
];

// Filterable categories - excludes blacklisted categories
export const FILTERABLE_ITEM_CATEGORIES: ItemType[] = ITEM_TYPES.filter(
  (category) => !BLACKLISTED_ITEM_CATEGORIES.includes(category),
);
