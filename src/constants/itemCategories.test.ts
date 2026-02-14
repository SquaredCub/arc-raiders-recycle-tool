import { describe, it, expect } from "@jest/globals";
import {
  ITEM_CATEGORIES,
  BLACKLISTED_ITEM_CATEGORIES,
  FILTERABLE_ITEM_CATEGORIES,
} from "./itemCategories";

describe("itemCategories", () => {
  describe("ITEM_CATEGORIES", () => {
    it("has 26 entries", () => {
      expect(ITEM_CATEGORIES).toHaveLength(26);
    });

    it("is sorted alphabetically (case-sensitive)", () => {
      const sorted = [...ITEM_CATEGORIES].sort();
      expect(ITEM_CATEGORIES).toEqual(sorted);
    });

    it("includes known categories", () => {
      expect(ITEM_CATEGORIES).toContain("Ammunition");
      expect(ITEM_CATEGORIES).toContain("SMG");
      expect(ITEM_CATEGORIES).toContain("Recyclable");
      expect(ITEM_CATEGORIES).toContain("Assault Rifle");
      expect(ITEM_CATEGORIES).toContain("Basic Material");
    });
  });

  describe("BLACKLISTED_ITEM_CATEGORIES", () => {
    it("contains exactly the expected categories", () => {
      expect(BLACKLISTED_ITEM_CATEGORIES).toEqual([
        "Key",
        "Blueprint",
        "Cosmetic",
        "Backpack Charm",
        "Outfit",
      ]);
    });
  });

  describe("FILTERABLE_ITEM_CATEGORIES", () => {
    it("equals ITEM_CATEGORIES minus blacklisted", () => {
      expect(FILTERABLE_ITEM_CATEGORIES).toHaveLength(
        ITEM_CATEGORIES.length - BLACKLISTED_ITEM_CATEGORIES.length
      );
    });

    it("contains no blacklisted category", () => {
      for (const blacklisted of BLACKLISTED_ITEM_CATEGORIES) {
        expect(FILTERABLE_ITEM_CATEGORIES).not.toContain(blacklisted);
      }
    });

    it("contains all non-blacklisted categories", () => {
      const expected = ITEM_CATEGORIES.filter(
        (c) => !BLACKLISTED_ITEM_CATEGORIES.includes(c)
      );
      expect(FILTERABLE_ITEM_CATEGORIES).toEqual(expected);
    });
  });
});
