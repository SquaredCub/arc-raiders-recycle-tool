import { describe, it, expect } from "@jest/globals";
import { getItemRequirements, type RequirementTemplates } from "./requirementsData";
import type { HideoutBench, Quest, Project } from "../generated/types";
import hideoutData from "../generated/hideout.json";
import questsData from "../generated/quests.json";
import projectsData from "../generated/projects.json";

const hideoutBenches = hideoutData as HideoutBench[];
const quests = questsData as Quest[];
const projects = projectsData as Project[];

describe("getItemRequirements", () => {
  const requirements = getItemRequirements(hideoutBenches, quests, projects, "en");

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
    const validTypes = new Set(["hideout", "quest", "project"]);
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
        }
      }
    }
  });

  it("hideout sources follow 'BenchName Lvl N' format", () => {
    const hideoutSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.filter((u) => u.source.includes("Lvl"))
    );
    expect(hideoutSources.length).toBeGreaterThan(0);
    for (const usage of hideoutSources) {
      expect(usage.source).toMatch(/.+ Lvl \d+/);
    }
  });

  it("quest sources follow 'Quest: QuestName' format", () => {
    const questSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.filter((u) => u.source.startsWith("Quest:"))
    );
    expect(questSources.length).toBeGreaterThan(0);
    for (const usage of questSources) {
      expect(usage.source).toMatch(/^Quest: .+/);
    }
  });

  it("project sources follow 'ProjectName - Step N' format", () => {
    const projectSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.filter((u) => u.source.includes("Step"))
    );
    expect(projectSources.length).toBeGreaterThan(0);
    for (const usage of projectSources) {
      expect(usage.source).toMatch(/.+ - Step \d+/);
    }
  });

  it("filters out Season 1 projects", () => {
    const allSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.map((u) => u.source)
    );
    const season1Sources = allSources.filter((s) => s.includes("Season 1"));
    expect(season1Sources).toHaveLength(0);
  });

  it("filters out Flickering Flames projects", () => {
    const allSources = Object.values(requirements).flatMap((data) =>
      data.usedIn.map((u) => u.source)
    );
    const flickeringSources = allSources.filter((s) =>
      s.includes("Flickering Flames")
    );
    expect(flickeringSources).toHaveLength(0);
  });

  it("correctly merges items used in multiple sources", () => {
    // Find an item used in multiple sources
    const multiSourceItem = Object.entries(requirements).find(
      ([, data]) => data.usedIn.length > 1
    );
    expect(multiSourceItem).toBeDefined();
    if (multiSourceItem) {
      const [, data] = multiSourceItem;
      const sumOfUsages = data.usedIn.reduce((sum, u) => sum + u.quantity, 0);
      expect(data.totalQuantity).toBe(sumOfUsages);
    }
  });

  it("returns empty object for empty inputs", () => {
    const result = getItemRequirements([], [], [], "en");
    expect(result).toEqual({});
  });

  it("uses custom templates when provided", () => {
    const customTemplates: RequirementTemplates = {
      lvl: "Niv.",
      quest: "Quête :",
      step: "Étape",
    };
    const customReqs = getItemRequirements(hideoutBenches, quests, projects, "en", customTemplates);

    const hideoutSources = Object.values(customReqs).flatMap((data) =>
      data.usedIn.filter((u) => u.sourceType === "hideout")
    );
    expect(hideoutSources.length).toBeGreaterThan(0);
    for (const usage of hideoutSources) {
      expect(usage.source).toMatch(/Niv\. \d+/);
    }

    const questSources = Object.values(customReqs).flatMap((data) =>
      data.usedIn.filter((u) => u.sourceType === "quest")
    );
    expect(questSources.length).toBeGreaterThan(0);
    for (const usage of questSources) {
      expect(usage.source).toMatch(/^Quête : .+/);
    }

    const projectSources = Object.values(customReqs).flatMap((data) =>
      data.usedIn.filter((u) => u.sourceType === "project")
    );
    expect(projectSources.length).toBeGreaterThan(0);
    for (const usage of projectSources) {
      expect(usage.source).toMatch(/Étape \d+/);
    }
  });
});
