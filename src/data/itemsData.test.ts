import { describe, expect, it } from "bun:test";

import { BLACKLISTED_ITEM_CATEGORIES } from "../constants/itemCategories";
import itemsData from "../generated/items.json";
import type { Item } from "../generated/types";
import {
  filterBlacklistedItemCategories,
  formatMaterialName,
  getItemImage,
  getItemImageById,
} from "./itemsData";

const items = itemsData as Item[];

describe("formatMaterialName", () => {
  it("capitalizes and joins underscored words", () => {
    expect(formatMaterialName("plastic_parts")).toBe("Plastic Parts");
  });

  it("capitalizes single word", () => {
    expect(formatMaterialName("fabric")).toBe("Fabric");
  });

  it("returns empty string for empty input", () => {
    expect(formatMaterialName("")).toBe("");
  });
});

describe("filterBlacklistedItemCategories", () => {
  it("removes all blacklisted categories from real items", () => {
    const filtered = filterBlacklistedItemCategories(items);
    for (const item of filtered) {
      expect(BLACKLISTED_ITEM_CATEGORIES).not.toContain(item.type);
    }
  });

  it("returns fewer items than input (real data has blacklisted items)", () => {
    const filtered = filterBlacklistedItemCategories(items);
    expect(filtered.length).toBeLessThan(items.length);
    expect(filtered.length).toBeGreaterThan(0);
  });
});

describe("getItemImage", () => {
  it("points at the local copy named after the item id", () => {
    const item = items.find((candidate) => candidate.id === "plastic_parts");
    expect(item).toBeDefined();
    expect(getItemImage(item!)).toBe("https://test-cdn/images/items/plastic_parts.png");
  });
});

describe("getItemImageById", () => {
  it("builds the local image path from an id", () => {
    expect(getItemImageById("rubber_parts")).toBe(
      "https://test-cdn/images/items/rubber_parts.png",
    );
  });
});
