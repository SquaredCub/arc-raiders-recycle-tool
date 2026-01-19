// Localization types
export interface LocalizedText {
  en: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
  pl?: string;
  no?: string;
  da?: string;
  it?: string;
  ru?: string;
  ja?: string;
  "zh-TW"?: string;
  uk?: string;
  "zh-CN"?: string;
  kr?: string;
  tr?: string;
  hr?: string;
  sr?: string;
  "pt-BR"?: string;
  he?: string;
}

// Effect with localized label and value
export interface Effect extends LocalizedText {
  value: string;
}

// Item effects (e.g., for consumables)
export interface ItemEffects {
  [effectName: string]: Effect;
}

// Material costs for crafting or recycling
export interface MaterialCosts {
  [materialId: string]: number;
}

// Item types
export type ItemType =
  | "Ammunition"
  | "Assault Rifle"
  | "Augment"
  | "Backpack Charm"
  | "Basic Material"
  | "Battle Rifle"
  | "Blueprint"
  | "Cosmetic"
  | "Hand Cannon"
  | "Key"
  | "LMG"
  | "Misc"
  | "Modification"
  | "Nature"
  | "Outfit"
  | "Pistol"
  | "Quick Use"
  | "Recyclable"
  | "Refined Material"
  | "SMG"
  | "Shield"
  | "Shotgun"
  | "Sniper Rifle"
  | "Special"
  | "Topside Material"
  | "Trinket";

// Item rarity
export type ItemRarity = "Common" | "Uncommon" | "Rare" | "Legendary" | string; // Allow for other rarities

// Main item interface
export interface Item {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  type: ItemType;
  rarity: ItemRarity;
  value: number;
  weightKg: number;
  stackSize: number;
  imageFilename: string;
  updatedAt: string;

  // Optional properties
  recyclesInto?: MaterialCosts;
  salvagesInto?: MaterialCosts;
  recipe?: MaterialCosts;
  craftBench?: string | string[];
  craftQuantity?: number;
  effects?: ItemEffects;
  foundIn?: string;
}

// Requirement for items (used in hideouts, quests, and projects)
export interface ItemRequirement {
  itemId: string;
  quantity: number;
}

// Hideout/Workbench types
export interface HideoutLevel {
  level: number;
  requirementItemIds: ItemRequirement[];
}

export interface HideoutBench {
  id: string;
  name: LocalizedText;
  maxLevel: number;
  levels: HideoutLevel[];
}

// Quest types
export interface Quest {
  id: string;
  updatedAt: string;
  name: LocalizedText;
  trader: string;
  description: LocalizedText;
  objectives: LocalizedText[];
  requiredItemIds?: ItemRequirement[];
  grantedItemIds?: ItemRequirement[];
  rewardItemIds?: ItemRequirement[];
  xp: number;
  previousQuestIds: string[];
  nextQuestIds: string[];
}

// Project types
export interface ProjectPhase {
  phase: number;
  name: LocalizedText;
  description?: LocalizedText;
  requirementItemIds: ItemRequirement[];
}

export interface Project {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  phases: ProjectPhase[];
}

// Item usage tracking
export interface ItemUsage {
  source: string; // e.g., "Gunsmith Lvl 2", "Expedition Project - Foundation"
  quantity: number;
}

export interface ItemRequirementLookup {
  [itemId: string]: {
    totalQuantity: number;
    usedIn: ItemUsage[];
  };
}
