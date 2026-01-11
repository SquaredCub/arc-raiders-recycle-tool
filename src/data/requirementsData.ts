import type {
  HideoutBench,
  ItemRequirementLookup,
  Project,
  Quest,
} from "../types";

const language = "en";

/**
 * Build lookup map from hideout bench requirements
 */
function buildHideoutLookup(hideoutBenches: HideoutBench[]): ItemRequirementLookup {
  const lookup: ItemRequirementLookup = {};

  for (const bench of hideoutBenches) {
    const benchName = bench.name[language];

    for (const level of bench.levels) {
      for (const requirement of level.requirementItemIds) {
        const { itemId, quantity } = requirement;
        const source = `${benchName} Lvl ${level.level}`;

        if (!lookup[itemId]) {
          lookup[itemId] = {
            totalQuantity: 0,
            usedIn: [],
          };
        }

        lookup[itemId].totalQuantity += quantity;
        lookup[itemId].usedIn.push({ source, quantity });
      }
    }
  }

  return lookup;
}

/**
 * Build lookup map from quest requirements
 */
function buildQuestLookup(quests: Quest[]): ItemRequirementLookup {
  const lookup: ItemRequirementLookup = {};

  for (const quest of quests) {
    if (!quest.requiredItemIds) continue;

    const questName = quest.name[language];

    for (const requirement of quest.requiredItemIds) {
      const { itemId, quantity } = requirement;
      const source = `Quest: ${questName}`;

      if (!lookup[itemId]) {
        lookup[itemId] = {
          totalQuantity: 0,
          usedIn: [],
        };
      }

      lookup[itemId].totalQuantity += quantity;
      lookup[itemId].usedIn.push({ source, quantity });
    }
  }

  return lookup;
}

/**
 * Build lookup map from project requirements
 */
function buildProjectLookup(projects: Project[]): ItemRequirementLookup {
  const lookup: ItemRequirementLookup = {};

  for (const project of projects) {
    const projectName = project.name[language];

    // Filter out Season 1 projects
    if (projectName.includes("Season 1")) {
      continue;
    }

    for (const phase of project.phases) {
      const phaseName = phase.name[language];

      for (const requirement of phase.requirementItemIds) {
        const { itemId, quantity } = requirement;
        const source = `${projectName} - ${phaseName}`;

        if (!lookup[itemId]) {
          lookup[itemId] = {
            totalQuantity: 0,
            usedIn: [],
          };
        }

        lookup[itemId].totalQuantity += quantity;
        lookup[itemId].usedIn.push({ source, quantity });
      }
    }
  }

  return lookup;
}

/**
 * Merge multiple lookup maps into a single aggregated map
 */
function mergeLookups(
  ...lookups: ItemRequirementLookup[]
): ItemRequirementLookup {
  const merged: ItemRequirementLookup = {};

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
}

/**
 * Get the complete item requirements lookup map
 * This combines hideout upgrades, quests, and projects
 */
export function getItemRequirements(
  hideoutBenches: HideoutBench[],
  quests: Quest[],
  projects: Project[]
): ItemRequirementLookup {
  const hideoutLookup = buildHideoutLookup(hideoutBenches);
  const questLookup = buildQuestLookup(quests);
  const projectLookup = buildProjectLookup(projects);

  return mergeLookups(hideoutLookup, questLookup, projectLookup);
}
