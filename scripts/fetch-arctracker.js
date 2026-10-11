// ============================================================================
// Fetch ARC Raiders game data from the arctracker.io public API
// ============================================================================
// Saves the four public endpoints (https://arctracker.io/developers/docs) to
// src/arctracker-data/, which generate-files-from-data.js reads. One request
// per endpoint; the API allows 500 requests/hour.
// ============================================================================

import { mkdirSync } from "node:fs";
import { join } from "node:path";

const API = "https://arctracker.io/api";
const OUTPUT_DIR = join(import.meta.dir, "../src/arctracker-data");
const ENDPOINTS = ["items", "quests", "hideout", "projects"];
const USER_AGENT =
  "arc-raiders-recycle-tool (+https://github.com/SquaredCub/arc-raiders-recycle-tool)";

const fetchJson = async (endpoint, tries = 3) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        headers: { "user-agent": USER_AGENT },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      if (attempt >= tries) throw error;
      await Bun.sleep(1500 * attempt);
    }
  }
};

mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("🌐 Fetching game data from arctracker.io...\n");

for (const endpoint of ENDPOINTS) {
  try {
    const data = await fetchJson(endpoint);
    await Bun.write(join(OUTPUT_DIR, `${endpoint}.json`), JSON.stringify(data));
    console.log(`✓ ${endpoint}.json (generated ${data.generatedAt})`);
  } catch (error) {
    console.error(`✗ Failed to fetch ${API}/${endpoint}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}
