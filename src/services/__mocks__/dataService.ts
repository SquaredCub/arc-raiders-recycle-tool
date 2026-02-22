import itemsData from "../../generated/items.json";
import questsData from "../../generated/quests.json";
import hideoutData from "../../generated/hideout.json";
import projectsData from "../../generated/projects.json";

import type { HideoutBench, Item, Project, Quest } from "../../generated/types";

export const getImageUrl = (path: string): string => {
  return `https://test-cdn/${path}`;
};

export const getAllItems = (): Item[] => itemsData as Item[];

export const getAllQuests = (): Quest[] => questsData as Quest[];

export const getHideoutBenches = (): HideoutBench[] =>
  hideoutData as HideoutBench[];

export const getProjects = (): Project[] => projectsData as Project[];
