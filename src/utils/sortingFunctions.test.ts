import { describe, expect, it } from "bun:test";
import type { Item } from "../generated/types";
import type { SortItemsConfig } from "./sortingFunctions";
import {
  compareStrings,
  compareStringsEmptyLast,
  getBenchSortKey,
  getItemSortName,
  sortItems,
  sortMaterialsByName,
} from "./sortingFunctions";
import type { SortKeyCache } from "./tableCache";

describe("compareStrings", () => {
  it("compares ASCII strings case-insensitively", () => {
    expect(compareStrings("apple", "Banana")).toBeLessThan(0);
    expect(compareStrings("Banana", "apple")).toBeGreaterThan(0);
  });

  it("returns 0 for equal strings (case-insensitive)", () => {
    expect(compareStrings("hello", "HELLO")).toBe(0);
    expect(compareStrings("test", "test")).toBe(0);
  });
});

describe("compareStringsEmptyLast", () => {
  it("pushes empty string after non-empty", () => {
    expect(compareStringsEmptyLast("", "x")).toBe(1);
  });

  it("pushes non-empty before empty string", () => {
    expect(compareStringsEmptyLast("x", "")).toBe(-1);
  });

  it("returns 0 for both empty", () => {
    expect(compareStringsEmptyLast("", "")).toBe(0);
  });

  it("delegates to compareStrings for both non-empty", () => {
    expect(compareStringsEmptyLast("apple", "banana")).toBeLessThan(0);
    expect(compareStringsEmptyLast("banana", "apple")).toBeGreaterThan(0);
  });

  it("handles undefined values", () => {
    expect(compareStringsEmptyLast(undefined, "x")).toBe(1);
    expect(compareStringsEmptyLast("x", undefined)).toBe(-1);
    expect(compareStringsEmptyLast(undefined, undefined)).toBe(0);
  });
});

describe("sortMaterialsByName", () => {
  it("sorts entries alphabetically by formatted name", () => {
    const entries: [string, number][] = [
      ["wires", 3],
      ["fabric", 2],
      ["metal_parts", 1],
    ];
    const format = (id: string) =>
      id
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    const sorted = sortMaterialsByName(entries, format);
    expect(sorted[0][0]).toBe("fabric");
    expect(sorted[1][0]).toBe("metal_parts");
    expect(sorted[2][0]).toBe("wires");
  });
});

describe("getItemSortName", () => {
  it("extracts name in specified language", () => {
    const item = {
      id: "test",
      name: { en: "English Name", de: "German Name" },
    } as Item;
    expect(getItemSortName(item, "en")).toBe("English Name");
    expect(getItemSortName(item, "de")).toBe("German Name");
  });

  it("falls back to en", () => {
    const item = {
      id: "test",
      name: { en: "Fallback" },
    } as Item;
    expect(getItemSortName(item, "de")).toBe("Fallback");
  });

  it("returns empty string when no name available", () => {
    const item = {
      id: "test",
      name: {},
    } as unknown as Item;
    expect(getItemSortName(item, "en")).toBe("");
  });
});

describe("getBenchSortKey", () => {
  const getBenchName = (id: string) =>
    id === "workbench"
      ? "Workbench"
      : id === "med_station"
        ? "Med Station"
        : id;

  it("returns empty string for undefined", () => {
    expect(getBenchSortKey(undefined, getBenchName)).toBe("");
  });

  it("returns bench name for single string", () => {
    expect(getBenchSortKey("workbench", getBenchName)).toBe("Workbench");
  });

  it("joins array bench names with comma", () => {
    expect(getBenchSortKey(["workbench", "med_station"], getBenchName)).toBe(
      "Workbench, Med Station",
    );
  });
});

describe("sortItems", () => {
  const makeItem = (id: string, name: string, value: number): Item =>
    ({
      id,
      name: { en: name },
      value,
    }) as Item;

  const makeConfig = (
    overrides?: Partial<SortItemsConfig>,
  ): SortItemsConfig => {
    const defaultCache: SortKeyCache = {
      nameSortKeys: {
        a: "alpha",
        b: "bravo",
        c: "charlie",
      },
      requirementTotals: {},
      recycleTotals: {},
      salvageTotals: {},
    };
    return {
      prioritizeNameMatches: false,
      searchMatchTypes: {},
      sortKeyCache: defaultCache,
      materialMatchScores: {},
      ...overrides,
    };
  };

  const testItems = [
    makeItem("b", "Bravo", 200),
    makeItem("c", "Charlie", 100),
    makeItem("a", "Alpha", 300),
  ];

  it("returns items unchanged when sorting is empty", () => {
    const result = sortItems(testItems, [], makeConfig());
    expect(result).toBe(testItems);
  });

  it("sorts by item name ascending", () => {
    const result = sortItems(
      testItems,
      [{ id: "item", desc: false }],
      makeConfig(),
    );
    expect(result.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts by item name descending", () => {
    const result = sortItems(
      testItems,
      [{ id: "item", desc: true }],
      makeConfig(),
    );
    expect(result.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts by value ascending", () => {
    const result = sortItems(
      testItems,
      [{ id: "value", desc: false }],
      makeConfig(),
    );
    expect(result.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts by value descending", () => {
    const result = sortItems(
      testItems,
      [{ id: "value", desc: true }],
      makeConfig(),
    );
    expect(result.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("prioritizes name matches when enabled", () => {
    const config = makeConfig({
      prioritizeNameMatches: true,
      searchMatchTypes: {
        a: new Set(["item"]),
        c: new Set(["item"]),
      },
    });
    // a and c are name matches, b is not
    const result = sortItems(testItems, [{ id: "item", desc: false }], config);
    // Name matches first (a, c), then others (b)
    expect(result.map((i) => i.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by foundIn with empty-last behavior", () => {
    const items = [
      { ...makeItem("x", "X", 0), foundIn: undefined } as Item,
      { ...makeItem("y", "Y", 0), foundIn: "ARC" } as Item,
      { ...makeItem("z", "Z", 0), foundIn: "Cave" } as Item,
    ];
    const result = sortItems(
      items,
      [{ id: "foundIn", desc: false }],
      makeConfig(),
    );
    expect(result[0].id).toBe("y"); // ARC
    expect(result[1].id).toBe("z"); // Cave
    expect(result[2].id).toBe("x"); // undefined (last)
  });

  it("sorts by neededFor using requirement totals", () => {
    const config = makeConfig({
      sortKeyCache: {
        nameSortKeys: { a: "a", b: "b", c: "c" },
        requirementTotals: { a: 10, b: 5, c: 0 },
        recycleTotals: {},
        salvageTotals: {},
      },
    });
    const result = sortItems(
      testItems,
      [{ id: "neededFor", desc: false }],
      config,
    );
    expect(result.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });
});
