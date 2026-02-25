import { describe, it, expect } from "@jest/globals";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "../arcraiders-data");

// Must match the configuration in scripts/generate-files-from-data.js
const mergeDirectories = ["items", "quests", "hideout"];
const singleFiles = ["projects.json", "map-events/map-events.json"];

describe("source data files for generation", () => {
  it("arcraiders-data directory exists", () => {
    expect(existsSync(DATA_DIR)).toBe(true);
  });

  describe.each(mergeDirectories)("%s directory", (dir) => {
    const dirPath = join(DATA_DIR, dir);

    it("exists", () => {
      expect(existsSync(dirPath)).toBe(true);
    });

    it("contains JSON files", () => {
      const files = readdirSync(dirPath).filter((f) => f.endsWith(".json"));
      expect(files.length).toBeGreaterThan(0);
    });

    it("all JSON files are valid", () => {
      const files = readdirSync(dirPath).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        const content = readFileSync(join(dirPath, file), "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });

  describe.each(singleFiles)("%s", (file) => {
    const filePath = join(DATA_DIR, file);

    it("exists", () => {
      expect(existsSync(filePath)).toBe(true);
    });

    it("is valid JSON", () => {
      const content = readFileSync(filePath, "utf-8");
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });
});
