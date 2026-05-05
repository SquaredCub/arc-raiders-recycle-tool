import { describe, expect, it } from "bun:test";

import { formatMaterialName } from "../data/itemsData";
import itemsData from "../generated/items.json";
import type { Item } from "../generated/types";
import {
  createNoResultsItem,
  filterItemsBySearch,
  isNoResultsItem,
  NO_RESULTS_ID,
} from "./functions";

const items = itemsData as Item[];

describe("filterItemsBySearch", () => {
  it("returns all items with empty matchTypes for empty search", () => {
    const result = filterItemsBySearch(items, "", formatMaterialName);
    expect(result.items).toBe(items);
    expect(result.matchTypes).toEqual({});
    expect(result.matchedMaterials).toEqual({});
    expect(result.matchedSources).toEqual({});
  });

  it("returns all items for whitespace-only search", () => {
    const result = filterItemsBySearch(items, "   ", formatMaterialName);
    expect(result.items).toBe(items);
    expect(result.matchTypes).toEqual({});
    expect(result.matchedMaterials).toEqual({});
    expect(result.matchedSources).toEqual({});
  });

  it("places exact name match first", () => {
    const result = filterItemsBySearch(items, "Bandage", formatMaterialName);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].name.en).toBe("Bandage");
  });

  it("is case-insensitive", () => {
    const result = filterItemsBySearch(items, "bandage", formatMaterialName);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].name.en).toBe("Bandage");
  });

  it("tags name matches as 'item'", () => {
    const result = filterItemsBySearch(items, "Bandage", formatMaterialName);
    const bandage = result.items.find((i) => i.name.en === "Bandage");
    expect(bandage).toBeDefined();
    expect(result.matchTypes[bandage!.id].has("item")).toBe(true);
  });

  it("tags recyclesInto matches as 'recycles'", () => {
    // "metal_parts" formatted as "Metal Parts" - search for it
    const result = filterItemsBySearch(
      items,
      "Metal Parts",
      formatMaterialName,
    );
    const itemWithRecycle = result.items.find(
      (i) =>
        i.recyclesInto &&
        Object.keys(i.recyclesInto).some((m) =>
          formatMaterialName(m).toLowerCase().includes("metal parts"),
        ),
    );
    expect(itemWithRecycle).toBeDefined();
    expect(result.matchTypes[itemWithRecycle!.id].has("recycles")).toBe(true);
  });

  it("populates matchedMaterials with only matching material IDs", () => {
    const result = filterItemsBySearch(
      items,
      "Metal Parts",
      formatMaterialName,
    );
    // Find an item that recycles into metal_parts
    const itemWithRecycle = result.items.find(
      (i) =>
        i.recyclesInto && Object.keys(i.recyclesInto).includes("metal_parts"),
    );
    expect(itemWithRecycle).toBeDefined();
    const matched = result.matchedMaterials[itemWithRecycle!.id];
    expect(matched).toBeDefined();
    expect(matched.has("metal_parts")).toBe(true);
    // Non-matching materials should NOT be in the set
    const nonMatchingMaterials = Object.keys(
      itemWithRecycle!.recyclesInto!,
    ).filter(
      (m) => !formatMaterialName(m).toLowerCase().includes("metal parts"),
    );
    for (const m of nonMatchingMaterials) {
      expect(matched.has(m)).toBe(false);
    }
  });

  it("tags salvagesInto matches as 'salvages'", () => {
    // Acoustic Guitar salvages into "wires"
    const result = filterItemsBySearch(items, "Wires", formatMaterialName);
    const guitarMatch = result.items.find((i) => i.id === "acoustic_guitar");
    if (guitarMatch) {
      expect(result.matchTypes[guitarMatch.id].has("salvages")).toBe(true);
    }
  });

  it("tags requirement matches as 'requirement' and populates matchedSources", () => {
    const mockRequirements = {
      bandage: {
        totalQuantity: 10,
        usedIn: [
          { source: "Test Bench Lvl 1", quantity: 5 },
          { source: "Other Bench Lvl 2", quantity: 5 },
        ],
      },
    };
    const result = filterItemsBySearch(
      items,
      "Test Bench",
      formatMaterialName,
      "en",
      mockRequirements,
    );
    const bandage = result.items.find((i) => i.id === "bandage");
    expect(bandage).toBeDefined();
    expect(result.matchTypes["bandage"].has("requirement")).toBe(true);
    // Only the matching source should be in matchedSources
    const sources = result.matchedSources["bandage"];
    expect(sources).toBeDefined();
    expect(sources.has("Test Bench Lvl 1")).toBe(true);
    expect(sources.has("Other Bench Lvl 2")).toBe(false);
  });

  it("returns both name matches and material matches", () => {
    const result = filterItemsBySearch(items, "Plastic", formatMaterialName);
    // Should include items with "Plastic" in name (tagged as "item")
    const nameMatches = result.items.filter((i) =>
      result.matchTypes[i.id]?.has("item"),
    );
    // Should include items that only match via materials (no "item" tag)
    const materialOnlyMatches = result.items.filter(
      (i) => result.matchTypes[i.id] && !result.matchTypes[i.id].has("item"),
    );
    expect(nameMatches.length).toBeGreaterThan(0);
    expect(materialOnlyMatches.length).toBeGreaterThan(0);
  });
});

describe("createNoResultsItem", () => {
  it("creates item with NO_RESULTS_ID", () => {
    const item = createNoResultsItem("test");
    expect(item.id).toBe(NO_RESULTS_ID);
  });

  it("includes search term in name", () => {
    const item = createNoResultsItem("bandage");
    expect(item.name.en).toContain("bandage");
  });
});

describe("isNoResultsItem", () => {
  it("returns true for NO_RESULTS_ID", () => {
    expect(isNoResultsItem(NO_RESULTS_ID)).toBe(true);
  });

  it("returns false for other ids", () => {
    expect(isNoResultsItem("bandage")).toBe(false);
    expect(isNoResultsItem("")).toBe(false);
  });
});
