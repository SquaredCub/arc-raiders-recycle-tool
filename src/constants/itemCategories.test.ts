import { describe, it, expect } from "@jest/globals";
import {
  BLACKLISTED_ITEM_CATEGORIES,
  FILTERABLE_ITEM_CATEGORIES,
} from "./itemCategories";
import { ITEM_TYPES } from "../generated/types";

describe("itemCategories", () => {
  describe("BLACKLISTED_ITEM_CATEGORIES", () => {
    it("contains exactly the expected categories", () => {
      expect(BLACKLISTED_ITEM_CATEGORIES).toEqual([
        "Key",
        "Blueprint",
      ]);
    });
  });

  describe("FILTERABLE_ITEM_CATEGORIES", () => {
    it("equals ITEM_TYPES minus blacklisted", () => {
      expect(FILTERABLE_ITEM_CATEGORIES).toHaveLength(
        ITEM_TYPES.length - BLACKLISTED_ITEM_CATEGORIES.length
      );
    });

    it("contains no blacklisted category", () => {
      for (const blacklisted of BLACKLISTED_ITEM_CATEGORIES) {
        expect(FILTERABLE_ITEM_CATEGORIES).not.toContain(blacklisted);
      }
    });

    it("contains all non-blacklisted categories", () => {
      const expected = ITEM_TYPES.filter(
        (c) => !BLACKLISTED_ITEM_CATEGORIES.includes(c)
      );
      expect(FILTERABLE_ITEM_CATEGORIES).toEqual(expected);
    });
  });
});
