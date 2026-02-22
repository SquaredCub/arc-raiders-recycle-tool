import { jest, describe, it, expect } from "@jest/globals";

jest.mock("../services/dataService");

import {
  createBenchNameLookup,
  createSortedMaterialsCache,
  createSortKeyCache,
} from "./tableCache";
import type { Item, HideoutBench } from "../generated/types";
import itemsData from "../generated/items.json";
import hideoutData from "../generated/hideout.json";
import { getItemRequirements } from "../data/requirementsData";
import questsData from "../generated/quests.json";
import projectsData from "../generated/projects.json";
import type { Quest, Project } from "../generated/types";

const items = itemsData as Item[];
const hideoutBenches = hideoutData as HideoutBench[];
const quests = questsData as Quest[];
const projects = projectsData as Project[];

describe("createBenchNameLookup", () => {
  it("maps all bench IDs to English names", () => {
    const lookup = createBenchNameLookup(hideoutBenches);
    for (const bench of hideoutBenches) {
      expect(lookup[bench.id]).toBe(bench.name.en);
    }
  });

  it("always includes in_raid → Field Crafting", () => {
    const lookup = createBenchNameLookup(hideoutBenches);
    expect(lookup["in_raid"]).toBe("Field Crafting");
  });

  it("includes in_raid even with empty input", () => {
    const lookup = createBenchNameLookup([]);
    expect(lookup["in_raid"]).toBe("Field Crafting");
  });
});

describe("createSortedMaterialsCache", () => {
  const cache = createSortedMaterialsCache(items);

  it("creates recycle_ prefixed entries for items with recyclesInto", () => {
    const itemsWithRecycle = items.filter(
      (i) => i.recyclesInto && Object.keys(i.recyclesInto).length > 0
    );
    expect(itemsWithRecycle.length).toBeGreaterThan(0);
    for (const item of itemsWithRecycle) {
      expect(cache[`recycle_${item.id}`]).toBeDefined();
    }
  });

  it("creates salvage_ prefixed entries for items with salvagesInto", () => {
    const itemsWithSalvage = items.filter(
      (i) => i.salvagesInto && Object.keys(i.salvagesInto).length > 0
    );
    expect(itemsWithSalvage.length).toBeGreaterThan(0);
    for (const item of itemsWithSalvage) {
      expect(cache[`salvage_${item.id}`]).toBeDefined();
    }
  });

  it("creates recipe_ prefixed entries for items with recipe", () => {
    const itemsWithRecipe = items.filter(
      (i) => i.recipe && Object.keys(i.recipe).length > 0
    );
    expect(itemsWithRecipe.length).toBeGreaterThan(0);
    for (const item of itemsWithRecipe) {
      expect(cache[`recipe_${item.id}`]).toBeDefined();
    }
  });

  it("each cached entry has material, quantity, name, and image fields", () => {
    const firstKey = Object.keys(cache)[0];
    const entry = cache[firstKey][0];
    expect(entry).toHaveProperty("material");
    expect(entry).toHaveProperty("quantity");
    expect(entry).toHaveProperty("name");
    expect(entry).toHaveProperty("image");
    expect(typeof entry.material).toBe("string");
    expect(typeof entry.quantity).toBe("number");
    expect(typeof entry.name).toBe("string");
  });

  it("materials are sorted alphabetically by name", () => {
    for (const key of Object.keys(cache)) {
      const entries = cache[key];
      if (entries.length > 1) {
        for (let i = 0; i < entries.length - 1; i++) {
          expect(
            entries[i].name.localeCompare(entries[i + 1].name)
          ).toBeLessThanOrEqual(0);
        }
      }
    }
  });
});

describe("createSortKeyCache", () => {
  const benchLookup = createBenchNameLookup(hideoutBenches);
  const requirements = getItemRequirements(hideoutBenches, quests, projects);
  const sortKeyCache = createSortKeyCache(items, benchLookup, requirements);

  it("populates nameSortKeys as lowercase strings", () => {
    for (const item of items) {
      const key = sortKeyCache.nameSortKeys[item.id];
      expect(key).toBeDefined();
      expect(key).toBe(key.toLowerCase());
    }
  });

  it("populates requirementTotals as numbers", () => {
    for (const item of items) {
      const total = sortKeyCache.requirementTotals[item.id];
      expect(typeof total).toBe("number");
      expect(total).toBeGreaterThanOrEqual(0);
    }
  });
});
