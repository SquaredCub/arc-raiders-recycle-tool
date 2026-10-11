// Auto-generated TypeScript types from game data

export interface LocalizedText {
  en: string;
  "da"?: string;
  "de"?: string;
  "es"?: string;
  "fr"?: string;
  "he"?: string;
  "hr"?: string;
  "it"?: string;
  "ja"?: string;
  "ko-KR"?: string;
  "no"?: string;
  "pl"?: string;
  "pt"?: string;
  "pt-BR"?: string;
  "ru"?: string;
  "sr"?: string;
  "tr"?: string;
  "uk"?: string;
  "zh-CN"?: string;
  "zh-TW"?: string;
}

export interface Effect extends LocalizedText {
  value: string;
}

export interface ItemEffects {
  [effectName: string]: Effect;
}

export interface MaterialCosts {
  [materialId: string]: number;
}

export type ItemType =
  | "Ammunition"
  | "Assault Rifle"
  | "Augment"
  | "Basic Material"
  | "Battle Rifle"
  | "Blueprint"
  | "Design"
  | "Hand Cannon"
  | "Key"
  | "LMG"
  | "Misc"
  | "Modification"
  | "Nature"
  | "Outpost Furniture"
  | "Outpost Room"
  | "Pistol"
  | "Quick Use"
  | "Recyclable"
  | "Refined Material"
  | "Research"
  | "SMG"
  | "Shield"
  | "Shotgun"
  | "Sniper Rifle"
  | "Special"
  | "Stencil"
  | "Topside Material"
  | "Trinket";

export const ITEM_TYPES: ItemType[] = [
  "Ammunition",
  "Assault Rifle",
  "Augment",
  "Basic Material",
  "Battle Rifle",
  "Blueprint",
  "Design",
  "Hand Cannon",
  "Key",
  "LMG",
  "Misc",
  "Modification",
  "Nature",
  "Outpost Furniture",
  "Outpost Room",
  "Pistol",
  "Quick Use",
  "Recyclable",
  "Refined Material",
  "Research",
  "SMG",
  "Shield",
  "Shotgun",
  "Sniper Rifle",
  "Special",
  "Stencil",
  "Topside Material",
  "Trinket",
];

export type ItemRarity =
  | "Common"
  | "Epic"
  | "Legendary"
  | "Rare"
  | "Uncommon";

export interface Item {
  _community?: string[];
  _note?: string;
  addedIn: string;
  agility?: number;
  blueprintLocked?: boolean;
  compatibleWith?: string[];
  craftBench?: string[] | string;
  craftQuantity?: number;
  craftSkills?: Record<string, unknown>;
  damage?: number;
  damageMitigation?: number;
  description?: LocalizedText;
  durability?: number;
  effects?: ItemEffects;
  fireRate?: number;
  foundIn?: string;
  id: string;
  imageFilename: string;
  increasedFireRate?: number;
  isWeapon?: boolean;
  mechanics?: Record<string, unknown>;
  modSlots?: Record<string, unknown>;
  movementSpeedModifier?: number;
  name: LocalizedText;
  phasedOut?: Record<string, unknown>;
  questItem?: boolean;
  range?: number;
  rarity: ItemRarity;
  recipe?: MaterialCosts;
  recyclesInto?: MaterialCosts;
  reducedDurabilityBurnRate?: number;
  reducedReloadTime?: number;
  repairCost?: MaterialCosts;
  repairDurability?: number;
  repairMaterials?: MaterialCosts;
  research?: Record<string, unknown>[];
  researchPoints?: Record<string, unknown>[];
  salvagesInto?: MaterialCosts;
  shieldCharge?: number;
  stability?: number;
  stackSize: number;
  stationLevelRequired?: number;
  stealth?: number;
  tip?: string;
  type: ItemType;
  updatedAt: string;
  upgradeCost?: MaterialCosts;
  upgrades?: Record<string, unknown>[];
  upgradesTo?: string;
  value?: number;
  vendors?: Record<string, unknown>[];
  videoUrl?: string;
  weightKg?: number;
}

export interface ItemRequirement {
  itemId: string;
  quantity: number;
}

export interface HideoutLevel {
  description?: string;
  image?: string;
  level: number;
  otherRequirements?: string[];
  requirementItemIds: ItemRequirement[];
  requires?: Record<string, unknown>[];
}

export interface HideoutBench {
  id: string;
  levels: HideoutLevel[];
  maxLevel: number;
  name: LocalizedText;
}
export interface Quest {
  description: LocalizedText;
  grantedItemIds?: ItemRequirement[];
  id: string;
  kind?: string;
  map?: string[];
  name: LocalizedText;
  nextQuestIds: string[];
  objectives: LocalizedText[];
  objectiveTree: Record<string, unknown>;
  optionalRewards?: Record<string, unknown>[];
  previousQuestIds: string[];
  requiredItemIds?: ItemRequirement[];
  rewardItemIds: ItemRequirement[];
  slug: string;
  trader: string;
  updatedAt: string;
  videoUrl?: string;
  xp: number;
}
export interface ProjectRequirementCategory {
  category: string;
  kind?: string;
  localizations?: Record<string, unknown>;
  questGameAssetId?: string;
  rewardItemId?: string;
  tiers?: number[];
  valueRequired: number;
}
export interface ProjectPhase {
  cosmeticRewards?: Record<string, unknown>[];
  description: LocalizedText;
  name: LocalizedText;
  phase: number;
  requirementCategories?: ProjectRequirementCategory[];
  requirementItemIds: ItemRequirement[];
  rewards?: Record<string, unknown>[];
}
export interface Project {
  cosmeticRewards?: Record<string, unknown>[];
  description: LocalizedText;
  disabled: boolean;
  endDate: number;
  id: string;
  name: LocalizedText;
  phases: ProjectPhase[];
  rewards?: Record<string, unknown>[];
  startDate: number;
}

export interface ItemUsage {
  source: string;
  quantity: number;
}

export interface ItemRequirementLookup {
  [itemId: string]: {
    totalQuantity: number;
    usedIn: ItemUsage[];
  };
}
