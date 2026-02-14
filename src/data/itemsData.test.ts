import { jest, describe, it, expect } from "@jest/globals";

jest.mock("../services/dataService");

import {
  formatMaterialName,
  filterBlacklistedItemCategories,
  getItemImage,
  getMaterialImage,
} from "./itemsData";
import { BLACKLISTED_ITEM_CATEGORIES } from "../constants/itemCategories";
import type { Item } from "../types";
import itemsData from "../generated/items.json";

const items = itemsData as Item[];
const itemLookup = new Map(items.map((item) => [item.id, item]));

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
  it("uses imageFilename when present", () => {
    const item: Item = {
      id: "test",
      name: { en: "Test" },
      description: { en: "" },
      type: "Misc",
      rarity: "Common",
      value: 0,
      weightKg: 0,
      stackSize: 1,
      imageFilename: "https://cdn.example.com/items/test_item.png",
      updatedAt: "",
    };
    const url = getItemImage(item);
    expect(url).toBe("https://test-cdn/images/items/test_item.png");
  });

  it("falls back to item.id when no imageFilename", () => {
    const item: Item = {
      id: "my_item",
      name: { en: "My Item" },
      description: { en: "" },
      type: "Misc",
      rarity: "Common",
      value: 0,
      weightKg: 0,
      stackSize: 1,
      imageFilename: "",
      updatedAt: "",
    };
    const url = getItemImage(item);
    expect(url).toBe("https://test-cdn/images/items/my_item.png");
  });
});

describe("getMaterialImage", () => {
  it("finds item in lookup map and returns its image", () => {
    const realItem = itemLookup.get("plastic_parts");
    if (realItem) {
      const url = getMaterialImage("plastic_parts", itemLookup);
      expect(url).toBeDefined();
      expect(url).toContain("test-cdn");
    }
  });

  it("falls back to id-based URL when item not found", () => {
    const url = getMaterialImage("nonexistent_material", itemLookup);
    expect(url).toBe("https://test-cdn/images/items/nonexistent_material.png");
  });
});
