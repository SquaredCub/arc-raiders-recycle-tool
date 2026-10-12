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
  expedition: string;
}

const DEFAULT_TEMPLATES: RequirementTemplates = {
  lvl: "Lvl",
  quest: "Quest:",
  step: "Step",
  expedition: "Expedition",
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
export const isExpeditionProject = (project: Project): boolean =>
  project.id.startsWith("expedition_project");

/** Expedition projects, oldest first */
export const getExpeditionProjects = (projects: Project[]): Project[] =>
  projects
    .filter(isExpeditionProject)
    .sort((a, b) => a.startDate - b.startDate);

/**
 * Display name for a project. Expeditions are always "Expedition N", numbered
 * by start date, because the API names them inconsistently across seasons.
 */
export const getProjectDisplayName = (
  project: Project,
  projects: Project[],
  language: LanguageCode,
  expeditionLabel: string,
): string => {
  if (isExpeditionProject(project)) {
    const number = getExpeditionProjects(projects).indexOf(project) + 1;
    return `${expeditionLabel} ${number}`;
  }
  return getLocalizedText(project.name, language) || project.id;
};

const buildProjectLookup = (
  projects: Project[],
  language: LanguageCode,
  templates: RequirementTemplates,
  hiddenProjectIds: Set<string>,
): EnrichedItemRequirementLookup => {
  const lookup: EnrichedItemRequirementLookup = {};
  const nowSeconds = Date.now() / 1000;

  for (const project of projects) {
    // Skip disabled and ended projects (API dates are Unix seconds). Expeditions
    // never count as ended: players who skipped one can still do it.
    const ended = project.endDate < nowSeconds && !isExpeditionProject(project);
    if (project.disabled || ended || hiddenProjectIds.has(project.id)) {
      continue;
    }

    const projectName = getProjectDisplayName(
      project,
      projects,
      language,
      templates.expedition,
    );

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
  language: LanguageCode,
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

  // Alphabetical in the display language; numeric so "Expedition 10" sorts
  // after "Expedition 2" and "Lvl 10" after "Lvl 9"
  const collator = new Intl.Collator(language, { numeric: true, sensitivity: "base" });
  for (const data of Object.values(merged)) {
    data.usedIn.sort((a, b) => collator.compare(a.source, b.source));
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
  hiddenProjectIds: Set<string> = new Set(),
): EnrichedItemRequirementLookup => {
  const hideoutLookup = buildHideoutLookup(hideoutBenches, language, templates);
  const questLookup = buildQuestLookup(quests, language, templates);
  const projectLookup = buildProjectLookup(projects, language, templates, hiddenProjectIds);

  return mergeLookups(language, hideoutLookup, questLookup, projectLookup);
};
