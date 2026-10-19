import type { Item } from "../generated/types";

/** One thing an item can be used to make, from the ingredient's point of view */
export interface CraftUsage {
  outputId: string;
  /** How many of the ingredient one craft consumes */
  quantity: number;
  /** How many of the output one craft makes */
  outputQuantity: number;
  /** The full recipe: every ingredient id and how many one craft consumes */
  ingredients: Record<string, number>;
  /** "upgrade" = weapon tier upgrade (consumes the lower tier weapon too) */
  kind: "recipe" | "upgrade";
  benches: string[];
  /** Station level required, when the data gives one */
  level?: number;
  /** In-raid crafting perk level (1-3), set when craftable in raid */
  inRaidLevel?: number;
  blueprintLocked: boolean;
}

export type CraftUsageLookup = Record<string, CraftUsage[]>;

// In-raid crafting is unlocked by 3 perk levels of the survival skill tree.
// The API lists skill ids in craftSkills.in_raid without saying which level
// they are; this mapping comes from the game (e.g. Adrenaline Shot needs
// perk 1, Raider Hatch Key perk 2). Recipes listing no in-raid skill (e.g.
// Defibrillator, ammo) need perk 3, as does any id not mapped here.
const IN_RAID_PERK_BY_SKILL: Record<string, number> = {
  surv_3r: 1,
  surv_5c: 2,
};
const IN_RAID_TOP_PERK = 3;

const getInRaidLevel = (item: Item): number => {
  const skills = (item.craftSkills?.in_raid ?? []) as string[];
  if (skills.length === 0) return IN_RAID_TOP_PERK;
  return Math.max(
    ...skills.map((skill) => IN_RAID_PERK_BY_SKILL[skill] ?? IN_RAID_TOP_PERK),
  );
};

// craftBench id of in-raid (field) crafting
export const IN_RAID_BENCH = "in_raid";

const toBenchList = (craftBench: Item["craftBench"]): string[] =>
  craftBench === undefined
    ? []
    : Array.isArray(craftBench)
      ? craftBench
      : [craftBench];

/**
 * Invert recipes and weapon upgrades into "ingredient -> what it crafts".
 * Pass every item (not only the displayed ones): outputs such as keys and
 * amplified weapons are hidden from the table but are still worth showing.
 */
export const getCraftUsages = (items: Item[]): CraftUsageLookup => {
  const lookup: CraftUsageLookup = {};
  const add = (ingredientId: string, usage: CraftUsage) => {
    (lookup[ingredientId] ??= []).push(usage);
  };

  for (const item of items) {
    if (item.recipe) {
      const benches = toBenchList(item.craftBench);
      const usage = {
        outputId: item.id,
        outputQuantity: item.craftQuantity ?? 1,
        ingredients: item.recipe,
        kind: "recipe" as const,
        benches,
        level: item.stationLevelRequired,
        inRaidLevel: benches.includes(IN_RAID_BENCH)
          ? getInRaidLevel(item)
          : undefined,
        blueprintLocked: item.blueprintLocked ?? false,
      };
      for (const [ingredientId, quantity] of Object.entries(item.recipe)) {
        add(ingredientId, { ...usage, quantity });
      }
    }

    for (const upgrade of item.upgrades ?? []) {
      const to = upgrade.to as string;
      const cost = (upgrade.cost ?? {}) as Record<string, number>;
      const requires = (upgrade.requires ?? []) as {
        station?: string;
        level?: number;
      }[];
      const station = requires.find((requirement) => requirement.station);
      const usage = {
        outputId: to,
        outputQuantity: 1,
        // The weapon being upgraded is consumed along with the materials
        ingredients: { [item.id]: 1, ...cost },
        kind: "upgrade" as const,
        benches: station?.station
          ? [station.station]
          : toBenchList(item.craftBench),
        level: station?.level,
        blueprintLocked: false,
      };
      for (const [ingredientId, quantity] of Object.entries(usage.ingredients)) {
        add(ingredientId, { ...usage, quantity });
      }
    }
  }

  return lookup;
};
