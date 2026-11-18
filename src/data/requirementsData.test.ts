import { describe, expect, it } from "bun:test";
import hideoutData from "../generated/hideout.json";
import itemsData from "../generated/items.json";
import projectsData from "../generated/projects.json";
import questsData from "../generated/quests.json";
import type { HideoutBench, Item, Project, Quest } from "../generated/types";
import {
  getItemRequirements,
  type RequirementTemplates,
} from "./requirementsData";
import { OUTPOST_EXPANSIONS } from "../constants/outpostExpansions";

const hideoutBenches = hideoutData as HideoutBench[];
const quests = questsData as Quest[];
const projects = projectsData as Project[];
const items = itemsData as Item[];

describe("getItemRequirements", () => {
  const requirements = getItemRequirements(
    hideoutBenches,
    quests,
    projects,
    items,
    "en",
  );

  it("returns a non-empty result from real data", () => {
    expect(Object.keys(requirements).length).toBeGreaterThan(0);
  });

  it("every entry has totalQuantity > 0 and non-empty usedIn", () => {
    for (const [, data] of Object.entries(requirements)) {
      expect(data.totalQuantity).toBeGreaterThan(0);
      expect(data.usedIn.length).toBeGreaterThan(0);
    }
  });

  it("every usedIn entry has a valid sourceType", () => {
    const validTypes = new Set(["hideout", "quest", "project", "amplification"]);
    for (const [, data] of Object.entries(requirements)) {
      for (const usage of data.usedIn) {
        expect(validTypes.has(usage.sourceType)).toBe(true);
      }
    }
  });

  it("sourceType matches source string format", () => {
    for (const [, data] of Object.entries(requirements)) {
      for (const usage of data.usedIn) {
        if (usage.sourceType === "hideout") {
          expect(usage.source).toMatch(/.+ Lvl \d+/);
        } else if (usage.sourceType === "quest") {
          expect(usage.source).toMatch(/^Quest: .+/);
        } else if (usage.sourceType === "project") {
          expect(usage.source).toMatch(/.+ - Step \d+/);
        } else if (usage.sourceType === "amplification") {
          expect(usage.source).toMatch(/^Amplified .+/);
        }
      }
    }
  });

  it("hideout sources follow 'BenchName Lvl N' format", () => {
    const hideoutSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.filter((u) => u.source.includes("Lvl")),
    );
    expect(hideoutSources.length).toBeGreaterThan(0);
    for (const usage of hideoutSources) {
      expect(usage.source).toMatch(/.+ Lvl \d+/);
    }
  });

  it("quest sources follow 'Quest: QuestName' format", () => {
    const questSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.filter((u) => u.source.startsWith("Quest:")),
    );
    expect(questSources.length).toBeGreaterThan(0);
    for (const usage of questSources) {
      expect(usage.source).toMatch(/^Quest: .+/);
    }
  });

  it("project sources follow 'ProjectName - Step N' format", () => {
    const projectSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.filter((u) => u.source.includes("Step")),
    );
    expect(projectSources.length).toBeGreaterThan(0);
    for (const usage of projectSources) {
      expect(usage.source).toMatch(/.+ - Step \d+/);
    }
  });

  it("filters out Flickering Flames projects", () => {
    const allSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.map((u) => u.source),
    );
    const flickeringSources = allSources.filter((s) =>
      s.includes("Flickering Flames"),
    );
    expect(flickeringSources).toHaveLength(0);
  });

  it("correctly merges items used in multiple sources", () => {
    // Find an item used in multiple sources
    const multiSourceItem = Object.entries(requirements).find(
      ([, data]) => data.usedIn.length > 1,
    );
    expect(multiSourceItem).toBeDefined();
    if (multiSourceItem) {
      const [, data] = multiSourceItem;
      const sumOfUsages = data.usedIn.reduce((sum, u) => sum + u.quantity, 0);
      expect(data.totalQuantity).toBe(sumOfUsages);
    }
  });

  it("returns only the hand-maintained Outpost expansions for empty inputs", () => {
    const result = getItemRequirements([], [], [], [], "en");
    const expansionItemIds = new Set(
      OUTPOST_EXPANSIONS.flatMap((e) => e.requirementItemIds.map((r) => r.itemId)),
    );
    expect(new Set(Object.keys(result))).toEqual(expansionItemIds);
  });

  it("uses custom templates when provided", () => {
    const customTemplates: RequirementTemplates = {
      lvl: "Niv.",
      quest: "Quête :",
      step: "Étape",
      expedition: "Expédition",
      outpost: "Avant-poste",
    };
    const customReqs = getItemRequirements(
      hideoutBenches,
      quests,
      projects,
      items,
      "en",
      customTemplates,
    );

    const hideoutSources = Object.values(customReqs).flatMap((data) =>
      data.usedIn.filter((u) => u.sourceType === "hideout"),
    );
    expect(hideoutSources.length).toBeGreaterThan(0);
    for (const usage of hideoutSources) {
      expect(usage.source).toMatch(/Niv\. \d+/);
    }

    const questSources = Object.values(customReqs).flatMap((data) =>
      data.usedIn.filter((u) => u.sourceType === "quest"),
    );
    expect(questSources.length).toBeGreaterThan(0);
    for (const usage of questSources) {
      expect(usage.source).toMatch(/^Quête : .+/);
    }

    const projectSources = Object.values(customReqs).flatMap((data) =>
      data.usedIn.filter((u) => u.sourceType === "project"),
    );
    expect(projectSources.length).toBeGreaterThan(0);
    for (const usage of projectSources) {
      expect(usage.source).toMatch(/Étape \d+/);
    }
  });
});

describe("Outpost expansions (hand-maintained)", () => {
  const requirements = getItemRequirements(hideoutBenches, quests, projects, items, "en");

  it("only references item ids that exist in the data", () => {
    const itemIds = new Set((itemsData as { id: string }[]).map((item) => item.id));
    for (const expansion of OUTPOST_EXPANSIONS) {
      for (const { itemId } of expansion.requirementItemIds) {
        expect(itemIds.has(itemId)).toBe(true);
      }
    }
  });

  it("lists Epoxy Buckets as needed for Outpost Lvl 3", () => {
    expect(requirements.epoxy_bucket?.usedIn).toContainEqual({
      source: "Outpost Lvl 3",
      quantity: 3,
      sourceType: "hideout",
    });
  });
});

describe("Weapon amplification", () => {
  const requirements = getItemRequirements(hideoutBenches, quests, projects, items, "en");
  const amplificationSources = (itemId: string) =>
    (requirements[itemId]?.usedIn ?? []).filter((u) => u.sourceType === "amplification");

  it("lists Fluted Rotor Core as needed for the Amplified Renegade", () => {
    expect(amplificationSources("fluted_rotor_core").map((u) => u.source)).toContain(
      "Amplified Renegade",
    );
  });

  it("lists every material of every amplification upgrade", () => {
    for (const item of items) {
      for (const upgrade of item.upgrades ?? []) {
        if (!/_amplified(_|$)/.test(upgrade.to as string)) continue;
        for (const materialId of Object.keys(upgrade.cost as Record<string, number>)) {
          expect(amplificationSources(materialId).length).toBeGreaterThan(0);
        }
      }
    }
  });

  // A made-up weapon whose variants branch and merge again:
  // gun_iv -> gun_amplified -> gun_amplified_a ----> gun_amplified_a_b
  //                         -> gun_amplified_b ---/
  const gun = (id: string, en: string, upgrades: { to: string; cost: Record<string, number> }[]) =>
    ({ id, name: { en }, upgrades }) as unknown as Item;
  const gunItems = [
    gun("gun_iii", "Gun III", [{ to: "gun_iv", cost: { gun_parts: 5 } }]),
    gun("gun_iv", "Gun IV", [{ to: "gun_amplified", cost: { module: 1 } }]),
    gun("gun_amplified", "Amplified Gun", [
      { to: "gun_amplified_a", cost: { rotor: 2 } },
      { to: "gun_amplified_b", cost: { valve: 1 } },
    ]),
    gun("gun_amplified_a", "Amplified Gun · A", [
      { to: "gun_amplified_a_b", cost: { valve: 1 } },
    ]),
    gun("gun_amplified_b", "Amplified Gun · B", [
      { to: "gun_amplified_a_b", cost: { rotor: 3 } },
    ]),
    gun("gun_amplified_a_b", "Amplified Gun · A + B", []),
  ];
  const gunRequirements = getItemRequirements([], [], [], gunItems, "en");
  const gunSource = (itemId: string) =>
    gunRequirements[itemId]?.usedIn.filter((u) => u.sourceType === "amplification");

  it("names the source after the amplified weapon and counts its module", () => {
    expect(gunSource("module")).toEqual([
      { source: "Amplified Gun", quantity: 1, sourceType: "amplification" },
    ]);
  });

  it("takes the costliest single build, not the sum of every variant", () => {
    expect(gunSource("rotor")?.map((u) => u.quantity)).toEqual([3]);
    expect(gunSource("valve")?.map((u) => u.quantity)).toEqual([1]);
  });

  it("leaves out the weapons and non-amplification upgrades", () => {
    expect(gunSource("gun_iv")).toBeUndefined();
    expect(gunSource("gun_amplified")).toBeUndefined();
    expect(gunSource("gun_parts")).toBeUndefined();
  });
});
