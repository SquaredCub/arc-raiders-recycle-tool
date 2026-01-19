import type { ItemType } from "../types";

// All item categories from ItemType - already sorted alphabetically
export const ITEM_CATEGORIES: ItemType[] = [
  "Ammunition",
  "Assault Rifle",
  "Augment",
  "Backpack Charm",
  "Basic Material",
  "Battle Rifle",
  "Blueprint",
  "Cosmetic",
  "Hand Cannon",
  "Key",
  "LMG",
  "Misc",
  "Modification",
  "Nature",
  "Outfit",
  "Pistol",
  "Quick Use",
  "Recyclable",
  "Refined Material",
  "SMG",
  "Shield",
  "Shotgun",
  "Sniper Rifle",
  "Special",
  "Topside Material",
  "Trinket",
];

export const BLACKLISTED_ITEM_CATEGORIES: ItemType[] = [
  // Categories to exclude from recycling calculations
  // e.g., items that cannot be recycled or are not relevant
  "Key",
  "Blueprint",
  "Cosmetic",
  "Backpack Charm",
  "Outfit",
];

// Filterable categories - excludes blacklisted categories
export const FILTERABLE_ITEM_CATEGORIES: ItemType[] = ITEM_CATEGORIES.filter(
  (category) => !BLACKLISTED_ITEM_CATEGORIES.includes(category)
);
