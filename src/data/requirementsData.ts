import type {
  HideoutBench,
  ItemUsage,
  Project,
  Quest,
} from "../generated/types";
import {
  getLocalizedText,
  type LanguageCode,
} from "../localization/languageUtils";

export type SourceType = "hideout" | "quest" | "project";

export interface RequirementTemplates {
  lvl: string;
  quest: string;
  step: string;
}

const DEFAULT_TEMPLATES: RequirementTemplates = {
  lvl: "Lvl",
  quest: "Quest:",
  step: "Step",
};

export interface EnrichedItemUsage extends ItemUsage {
  sourceType: SourceType;
}

export interface EnrichedItemRequirementLookup {
  [itemId: string]: {
    totalQuantity: number;
    usedIn: EnrichedItemUsage[];
  };
}

/**
 * Build lookup map from hideout bench requirements
 */
const buildHideoutLookup = (
  hideoutBenches: HideoutBench[],
  language: LanguageCode,
  templates: RequirementTemplates,
): EnrichedItemRequirementLookup => {
  const lookup: EnrichedItemRequirementLookup = {};

  for (const bench of hideoutBenches) {
    const benchName = getLocalizedText(bench.name, language) || bench.id;

    for (const level of bench.levels) {
      for (const requirement of level.requirementItemIds) {
        const { itemId, quantity } = requirement;
        const source = `${benchName} ${templates.lvl} ${level.level}`;

        if (!lookup[itemId]) {
          lookup[itemId] = {
            totalQuantity: 0,
            usedIn: [],
          };
        }

        lookup[itemId].totalQuantity += quantity;
        lookup[itemId].usedIn.push({ source, quantity, sourceType: "hideout" });
      }
    }
  }

  return lookup;
};

/**
 * Build lookup map from quest requirements
 */
const buildQuestLookup = (
  quests: Quest[],
  language: LanguageCode,
  templates: RequirementTemplates,
): EnrichedItemRequirementLookup => {
  const lookup: EnrichedItemRequirementLookup = {};

  for (const quest of quests) {
    if (!quest.requiredItemIds) continue;

    const questName = getLocalizedText(quest.name, language) || quest.id;

    for (const requirement of quest.requiredItemIds) {
      const { itemId, quantity } = requirement;
      const source = `${templates.quest} ${questName}`;

      if (!lookup[itemId]) {
        lookup[itemId] = {
          totalQuantity: 0,
          usedIn: [],
        };
      }

      lookup[itemId].totalQuantity += quantity;
      lookup[itemId].usedIn.push({ source, quantity, sourceType: "quest" });
    }
  }

  return lookup;
};

/**
 * Build lookup map from project requirements
 */
const buildProjectLookup = (
  projects: Project[],
  language: LanguageCode,
  templates: RequirementTemplates,
): EnrichedItemRequirementLookup => {
  const lookup: EnrichedItemRequirementLookup = {};

  for (const project of projects) {
    // Always use English name for filtering out excluded projects
    const projectNameEn = project.name.en ?? "";

    if (projectNameEn.includes("Flickering Flames")) {
      continue;
    }

    const projectName =
      getLocalizedText(project.name, language) || projectNameEn;

    for (let i = 0; i < project.phases.length; i++) {
      const phase = project.phases[i];

      for (const requirement of phase.requirementItemIds) {
        const { itemId, quantity } = requirement;
        const source = `${projectName} - ${templates.step} ${i + 1}`;

        if (!lookup[itemId]) {
          lookup[itemId] = {
            totalQuantity: 0,
            usedIn: [],
          };
        }

        lookup[itemId].totalQuantity += quantity;
        lookup[itemId].usedIn.push({ source, quantity, sourceType: "project" });
      }
    }
  }

  return lookup;
};

/**
 * Merge multiple lookup maps into a single aggregated map
 */
const mergeLookups = (
  ...lookups: EnrichedItemRequirementLookup[]
): EnrichedItemRequirementLookup => {
  const merged: EnrichedItemRequirementLookup = {};

  for (const lookup of lookups) {
    for (const [itemId, data] of Object.entries(lookup)) {
      if (!merged[itemId]) {
        merged[itemId] = {
          totalQuantity: 0,
          usedIn: [],
        };
      }

      merged[itemId].totalQuantity += data.totalQuantity;
      merged[itemId].usedIn.push(...data.usedIn);
    }
  }

  return merged;
};

/**
 * Get the complete item requirements lookup map
 * This combines hideout upgrades, quests, and projects
 */
export const getItemRequirements = (
  hideoutBenches: HideoutBench[],
  quests: Quest[],
  projects: Project[],
  language: LanguageCode,
  templates: RequirementTemplates = DEFAULT_TEMPLATES,
): EnrichedItemRequirementLookup => {
  const hideoutLookup = buildHideoutLookup(hideoutBenches, language, templates);
  const questLookup = buildQuestLookup(quests, language, templates);
  const projectLookup = buildProjectLookup(projects, language, templates);

  return mergeLookups(hideoutLookup, questLookup, projectLookup);
};
