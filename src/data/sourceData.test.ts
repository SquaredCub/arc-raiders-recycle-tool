import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// import.meta.dir is the Bun way to handle __dirname
const DATA_DIR = join(import.meta.dir, "../arcraiders-data");

const mergeDirectories = ["items", "quests", "hideout"];
const singleFiles = ["projects.json"];

describe("source data files for generation", () => {
  it("arcraiders-data directory exists", () => {
    // existsSync correctly identifies both files AND directories
    expect(existsSync(DATA_DIR)).toBe(true);
  });

  describe.each(mergeDirectories)("%s directory", (dirName) => {
    const dirPath = join(DATA_DIR, dirName);

    it("exists", () => {
      expect(existsSync(dirPath)).toBe(true);
    });

    it("contains JSON files", () => {
      const files = readdirSync(dirPath).filter((f) => f.endsWith(".json"));
      expect(files.length).toBeGreaterThan(0);
    });

    it("all JSON files are valid", async () => {
      const files = readdirSync(dirPath).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        const filePath = join(dirPath, file);
        // We use Bun.file for the file content check
        const jsonFile = Bun.file(filePath);
        await expect(jsonFile.json()).resolves.toBeDefined();
      }
    });
  });

  describe.each(singleFiles)("%s", (file) => {
    const filePath = join(DATA_DIR, file);

    it("exists", () => {
      expect(existsSync(filePath)).toBe(true);
    });

    it("is valid JSON", async () => {
      const jsonFile = Bun.file(filePath);
      await expect(jsonFile.json()).resolves.toBeDefined();
    });
  });
});
