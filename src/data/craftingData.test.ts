import { describe, expect, it } from "bun:test";
import type { Item } from "../generated/types";
import { getAllItems } from "../services/dataService";
import { filterItemsByCraftSearch } from "../utils/functions";
import { getCraftUsages } from "./craftingData";

const items = getAllItems();
const usages = getCraftUsages(items);
const byId = new Map<string, Item>(items.map((item) => [item.id, item]));

describe("getCraftUsages", () => {
  it("lists every recipe ingredient with the quantity one craft uses", () => {
    for (const item of items) {
      for (const [ingredientId, quantity] of Object.entries(item.recipe ?? {})) {
        const usage = usages[ingredientId]?.find(
          (u) => u.outputId === item.id && u.kind === "recipe",
        );
        expect(usage?.quantity).toBe(quantity);
      }
    }
  });

  it("carries the full recipe on every usage", () => {
    for (const [ingredientId, list] of Object.entries(usages)) {
      for (const usage of list) {
        expect(usage.ingredients[ingredientId]).toBe(usage.quantity);
        if (usage.kind === "recipe") {
          expect(usage.ingredients).toEqual(byId.get(usage.outputId)!.recipe!);
        }
      }
    }
  });

  it("gives in-raid recipes their crafting perk level", () => {
    const inRaidLevel = (id: string) => {
      const ingredientId = Object.keys(byId.get(id)!.recipe!)[0];
      return usages[ingredientId].find((u) => u.outputId === id)!.inRaidLevel;
    };
    expect(inRaidLevel("adrenaline_shot")).toBe(1);
    expect(inRaidLevel("raider_hatch_key")).toBe(2);
    expect(inRaidLevel("defibrillator")).toBe(3);
    expect(inRaidLevel("light_ammo")).toBe(3);
    // Station only
    expect(inRaidLevel("anvil_i")).toBeUndefined();
  });

  it("normalizes the crafting bench to a list and keeps level and blueprint", () => {
    const adrenaline = byId.get("adrenaline_shot")!;
    const ingredientId = Object.keys(adrenaline.recipe!)[0];
    const usage = usages[ingredientId].find((u) => u.outputId === adrenaline.id)!;
    expect(usage.benches).toEqual(adrenaline.craftBench as string[]);

    const anvil = byId.get("anvil_i")!;
    const anvilUsage = usages[Object.keys(anvil.recipe!)[0]].find(
      (u) => u.outputId === "anvil_i",
    )!;
    expect(anvilUsage.benches).toEqual(["weapon_bench"]);
    expect(anvilUsage.level).toBe(anvil.stationLevelRequired!);
    expect(anvilUsage.blueprintLocked).toBe(true);
  });

  it("counts the output quantity of multi-output recipes", () => {
    const multi = items.find((item) => item.recipe && (item.craftQuantity ?? 1) > 1)!;
    const usage = usages[Object.keys(multi.recipe!)[0]].find(
      (u) => u.outputId === multi.id,
    )!;
    expect(usage.outputQuantity).toBe(multi.craftQuantity!);
  });

  it("includes weapon upgrades, consuming the lower tier weapon too", () => {
    const anvilI = byId.get("anvil_i")!;
    const upgrade = anvilI.upgrades![0] as {
      to: string;
      cost: Record<string, number>;
    };
    expect(usages.anvil_i).toContainEqual(
      expect.objectContaining({
        outputId: upgrade.to,
        kind: "upgrade",
        quantity: 1,
        ingredients: { anvil_i: 1, ...upgrade.cost },
      }),
    );
    for (const [ingredientId, quantity] of Object.entries(upgrade.cost)) {
      expect(usages[ingredientId]).toContainEqual(
        expect.objectContaining({ outputId: upgrade.to, kind: "upgrade", quantity }),
      );
    }
  });

  it("takes the station level of upgrades that require one", () => {
    const amplified = usages.anvil_iv.find((u) => u.outputId === "anvil_amplified")!;
    expect(amplified.benches).toEqual(["weapon_bench"]);
    expect(amplified.level).toBe(4);
  });
});

describe("filterItemsByCraftSearch", () => {
  const craftNames = Object.fromEntries(
    Object.entries(usages).map(([id, list]) => [
      id,
      list.map((u) => ({ outputId: u.outputId, name: byId.get(u.outputId)!.name.en })),
    ]),
  );

  it("returns everything unchanged without a search term", () => {
    const result = filterItemsByCraftSearch(items, "  ", craftNames);
    expect(result.items).toBe(items);
    expect(result.matchTypes).toEqual({});
  });

  it("matches item names and the names of what they craft", () => {
    const result = filterItemsByCraftSearch(items, "anvil i", craftNames);
    expect(result.matchTypes.anvil_i?.has("item")).toBe(true);
    for (const ingredientId of Object.keys(byId.get("anvil_i")!.recipe!)) {
      expect(result.matchTypes[ingredientId]?.has("crafts")).toBe(true);
      expect(result.matchedCrafts[ingredientId]?.has("anvil_i")).toBe(true);
    }
  });
});
