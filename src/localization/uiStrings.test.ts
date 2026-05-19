import { describe, expect, it } from "bun:test";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { FOUND_IN_LOCATIONS, ITEM_RARITIES } from "../constants/filterOptions";
import { SORT_COLUMNS } from "../constants/sortColumns";
import { ITEM_TYPES } from "../generated/types";
import { SUPPORTED_LANGUAGES } from "./languageUtils";
import { UI_STRINGS, type UIStringKey } from "./uiStrings";

const NON_ENGLISH_CODES = SUPPORTED_LANGUAGES.filter(
  (l) => l.code !== "en",
).map((l) => l.code);

const allKeys = Object.keys(UI_STRINGS) as UIStringKey[];

describe("UI_STRINGS", () => {
  it("every key has an English translation", () => {
    for (const key of allKeys) {
      const entry = UI_STRINGS[key];
      expect(entry.en).toBeDefined();
      expect(typeof entry.en).toBe("string");
      expect(entry.en.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate keys", () => {
    expect(new Set(allKeys).size).toBe(allKeys.length);
  });

  it("covers all expected key prefixes", () => {
    const prefixes = [
      "nav.",
      "recycling.",
      "search.",
      "filter.",
      "sort.",
      "general.",
      "source.",
      "tooltip.",
      "error.",
      "loading.",
      "category.",
      "rarity.",
      "location.",
      "requirement.",
    ];
    for (const prefix of prefixes) {
      const matching = allKeys.filter((k) => k.startsWith(prefix));
      expect(matching.length).toBeGreaterThan(0);
    }
  });

  it("English values are non-empty strings", () => {
    for (const key of allKeys) {
      expect(UI_STRINGS[key].en.trim().length).toBeGreaterThan(0);
    }
  });

  it("every key has translations for all 19 non-English languages", () => {
    for (const key of allKeys) {
      const entry = UI_STRINGS[key];
      for (const code of NON_ENGLISH_CODES) {
        expect(entry[code]).toBeDefined();
        expect(typeof entry[code]).toBe("string");
      }
    }
  });

  it("all translation values are non-empty strings", () => {
    for (const key of allKeys) {
      const entry = UI_STRINGS[key];
      for (const code of NON_ENGLISH_CODES) {
        const value = entry[code];
        if (value !== undefined) {
          expect(value.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ── Completeness: data-driven keys ─────────────────────────────────────

describe("UI_STRINGS completeness — data-driven keys", () => {
  it("has a category.* key for every item type", () => {
    for (const type of ITEM_TYPES) {
      const key =
        `category.${type.toLowerCase().replace(/ /g, "")}` as UIStringKey;
      expect(allKeys).toContain(key);
    }
  });

  it("has a rarity.* key for every item rarity", () => {
    for (const rarity of ITEM_RARITIES) {
      const key = `rarity.${rarity.toLowerCase()}` as UIStringKey;
      expect(allKeys).toContain(key);
    }
  });

  it("has a location.* key for every found-in location", () => {
    for (const location of FOUND_IN_LOCATIONS) {
      const key =
        `location.${location.toLowerCase().replace(/ /g, "")}` as UIStringKey;
      expect(allKeys).toContain(key);
    }
  });

  it("has a sort.* key for every sort column label", () => {
    for (const col of SORT_COLUMNS) {
      expect(allKeys).toContain(col.label as UIStringKey);
    }
  });
});

// ── Completeness: source code coverage ─────────────────────────────────

/** Bun-optimized recursive collector */
const collectSourceFiles = (dir: string): string[] => {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        ["generated", "__mocks__", "node_modules", "dist"].includes(entry.name)
      )
        continue;
      results.push(...collectSourceFiles(fullPath));
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")) {
      results.push(fullPath);
    }
  }
  return results;
};

describe("UI_STRINGS completeness — source code", () => {
  const keySet = new Set<string>(allKeys);
  const srcDir = join(import.meta.dir, "..");
  const sourceFiles = collectSourceFiles(srcDir);

  it("has an entry for every static translateUI() key used in source files", async () => {
    const pattern = /translateUI\(\s*["']([^"']+)["']\s*\)/g;
    const missing: string[] = [];

    for (const file of sourceFiles) {
      // Bun.file is faster than fs.readFileSync
      const content = await Bun.file(file).text();
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (!keySet.has(match[1])) {
          const rel = relative(srcDir, file).replace(/\\/g, "/");
          missing.push(`"${match[1]}" in ${rel}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("has an entry for every UIStringKey cast in source files", async () => {
    const pattern = /["']([^"']+)["']\s+as\s+UIStringKey/g;
    const missing: string[] = [];

    for (const file of sourceFiles) {
      const content = await Bun.file(file).text();
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (!keySet.has(match[1])) {
          const rel = relative(srcDir, file).replace(/\\/g, "/");
          missing.push(`"${match[1]}" in ${rel}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
