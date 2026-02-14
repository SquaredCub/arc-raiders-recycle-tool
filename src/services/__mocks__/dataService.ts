import itemsData from "../../generated/items.json";
import questsData from "../../generated/quests.json";
import hideoutData from "../../generated/hideout.json";
import projectsData from "../../generated/projects.json";

import type { HideoutBench, Item, Project, Quest } from "../../types";

export const getImageUrl = (path: string): string => {
  return `https://test-cdn/${path}`;
};

export const fetchAllItems = async (): Promise<Item[]> =>
  itemsData as Item[];

export const fetchAllQuests = async (): Promise<Quest[]> =>
  questsData as Quest[];

export const fetchHideoutBenches = async (): Promise<HideoutBench[]> =>
  hideoutData as HideoutBench[];

export const fetchProjects = async (): Promise<Project[]> =>
  projectsData as Project[];
