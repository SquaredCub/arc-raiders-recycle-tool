import type {
  HideoutBench,
  Item,
  ItemUsage,
  Project,
  Quest,
} from "../generated/types";
import { AMPLIFIED_WEAPON_ID_PATTERN } from "../constants/itemCategories";
import { OUTPOST_EXPANSIONS } from "../constants/outpostExpansions";
import {
  getLocalizedText,
  type LanguageCode,
} from "../localization/languageUtils";

export type SourceType = "hideout" | "quest" | "project" | "amplification";

export interface RequirementTemplates {
  lvl: string;
  quest: string;
  step: string;
  expedition: string;
  outpost: string;
}

const DEFAULT_TEMPLATES: RequirementTemplates = {
  lvl: "Lvl",
  quest: "Quest:",
  step: "Step",
  expedition: "Expedition",
  outpost: "Outpost",
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
 * Build lookup map from the hand-maintained Outpost expansions (not in the API)
 */
const buildOutpostExpansionLookup = (
  templates: RequirementTemplates,
): EnrichedItemRequirementLookup => {
  const lookup: EnrichedItemRequirementLookup = {};

  for (const expansion of OUTPOST_EXPANSIONS) {
    const source = `${templates.outpost} ${templates.lvl} ${expansion.level}`;

    for (const { itemId, quantity } of expansion.requirementItemIds) {
      lookup[itemId] ??= { totalQuantity: 0, usedIn: [] };
      lookup[itemId].totalQuantity += quantity;
      lookup[itemId].usedIn.push({ source, quantity, sourceType: "hideout" });
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

type MaterialCounts = Record<string, number>;

/** Upgrades of an item into an amplified weapon (weapon IV -> Amplified, or between amplified variants) */
const getAmplificationUpgrades = (item: Item | undefined) =>
  (item?.upgrades ?? [])
    .map((upgrade) => ({
      to: upgrade.to as string,
      cost: (upgrade.cost ?? {}) as MaterialCounts,
    }))
    .filter((upgrade) => AMPLIFIED_WEAPON_ID_PATTERN.test(upgrade.to));

/**
 * Build lookup map from weapon amplification: one source per amplified weapon
 * (e.g. "Amplified Renegade"). Its variants branch (Scoped, More Reload...)
 * and every step consumes the previous weapon, so the quantity is the most of
 * that material a single build can take, not the sum over every variant.
 */
const buildAmplificationLookup = (
  items: Item[],
  language: LanguageCode,
): EnrichedItemRequirementLookup => {
  const lookup: EnrichedItemRequirementLookup = {};
  const itemsById = new Map(items.map((item) => [item.id, item]));

  // Per material, the most any upgrade path starting at this weapon consumes
  const maxPathCosts = new Map<string, MaterialCounts>();
  const getMaxPathCosts = (itemId: string): MaterialCounts => {
    const cached = maxPathCosts.get(itemId);
    if (cached) return cached;
    maxPathCosts.set(itemId, {}); // Guards against an upgrade cycle in the data

    const result: MaterialCounts = {};
    for (const { to, cost } of getAmplificationUpgrades(itemsById.get(itemId))) {
      const pathCosts = { ...getMaxPathCosts(to) };
      for (const [materialId, quantity] of Object.entries(cost)) {
        pathCosts[materialId] = (pathCosts[materialId] ?? 0) + quantity;
      }
      for (const [materialId, quantity] of Object.entries(pathCosts)) {
        result[materialId] = Math.max(result[materialId] ?? 0, quantity);
      }
    }
    maxPathCosts.set(itemId, result);
    return result;
  };

  for (const item of items) {
    if (AMPLIFIED_WEAPON_ID_PATTERN.test(item.id)) continue;

    // The base weapon (e.g. Renegade IV) itself is not listed: only the
    // materials each amplification step costs
    for (const { to, cost } of getAmplificationUpgrades(item)) {
      const amplified = itemsById.get(to);
      const source = (amplified && getLocalizedText(amplified.name, language)) || to;
      const totals = { ...getMaxPathCosts(to) };
      for (const [materialId, quantity] of Object.entries(cost)) {
        totals[materialId] = (totals[materialId] ?? 0) + quantity;
      }

      for (const [itemId, quantity] of Object.entries(totals)) {
        lookup[itemId] ??= { totalQuantity: 0, usedIn: [] };
        lookup[itemId].totalQuantity += quantity;
        lookup[itemId].usedIn.push({ source, quantity, sourceType: "amplification" });
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
 * This combines hideout upgrades, quests, projects and weapon amplification.
 * Pass every item (not only the displayed ones): amplified weapons are hidden
 * from the table but their upgrades still need materials.
 */
export const getItemRequirements = (
  hideoutBenches: HideoutBench[],
  quests: Quest[],
  projects: Project[],
  items: Item[],
  language: LanguageCode,
  templates: RequirementTemplates = DEFAULT_TEMPLATES,
  hiddenProjectIds: Set<string> = new Set(),
): EnrichedItemRequirementLookup => {
  const hideoutLookup = buildHideoutLookup(hideoutBenches, language, templates);
  const questLookup = buildQuestLookup(quests, language, templates);
  const projectLookup = buildProjectLookup(projects, language, templates, hiddenProjectIds);
  const amplificationLookup = buildAmplificationLookup(items, language);

  const outpostExpansionLookup = buildOutpostExpansionLookup(templates);

  return mergeLookups(
    language,
    hideoutLookup,
    outpostExpansionLookup,
    questLookup,
    projectLookup,
    amplificationLookup,
  );
};
