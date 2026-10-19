import type { Item } from "../generated/types";

/** One thing an item can be used to make, from the ingredient's point of view */
export interface CraftUsage {
  outputId: string;
  /** How many of the ingredient one craft consumes */
  quantity: number;
  /** How many of the output one craft makes */
  outputQuantity: number;
  /** "upgrade" = weapon tier upgrade (consumes the lower tier weapon too) */
  kind: "recipe" | "upgrade";
  benches: string[];
  /** Station level required, when the data gives one */
  level?: number;
  blueprintLocked: boolean;
}

export type CraftUsageLookup = Record<string, CraftUsage[]>;

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
      const usage = {
        outputId: item.id,
        outputQuantity: item.craftQuantity ?? 1,
        kind: "recipe" as const,
        benches: toBenchList(item.craftBench),
        level: item.stationLevelRequired,
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
        kind: "upgrade" as const,
        benches: station?.station
          ? [station.station]
          : toBenchList(item.craftBench),
        level: station?.level,
        blueprintLocked: false,
      };
      // The weapon being upgraded is consumed along with the materials
      add(item.id, { ...usage, quantity: 1 });
      for (const [ingredientId, quantity] of Object.entries(cost)) {
        add(ingredientId, { ...usage, quantity });
      }
    }
  }

  return lookup;
};
