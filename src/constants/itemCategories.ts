import type { ItemType } from "../generated/types";
import { ITEM_TYPES } from "../generated/types";

export const BLACKLISTED_ITEM_CATEGORIES: ItemType[] = [
  "Key",
  "Blueprint",
  "Design",
];

// Amplified weapon variants all recycle/salvage into amplified fragments only,
// so they add rows without adding information (ids like "anvil_amplified_x_rounds")
export const AMPLIFIED_WEAPON_ID_PATTERN = /_amplified(_|$)/;

// Filterable categories - excludes blacklisted categories
export const FILTERABLE_ITEM_CATEGORIES: ItemType[] = ITEM_TYPES.filter(
  (category) => !BLACKLISTED_ITEM_CATEGORIES.includes(category),
);
