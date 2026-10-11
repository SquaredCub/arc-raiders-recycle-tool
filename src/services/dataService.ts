import hideoutData from "../generated/hideout.json";
import itemsData from "../generated/items.json";
import projectsData from "../generated/projects.json";
import questsData from "../generated/quests.json";
import type { HideoutBench, Item, Project, Quest } from "../generated/types";

/**
 * Data accessors — all data is bundled at build time, no runtime fetches needed.
 */
export const getAllItems = (): Item[] => itemsData as Item[];

export const getAllQuests = (): Quest[] => questsData as Quest[];

export const getHideoutBenches = (): HideoutBench[] =>
  hideoutData as HideoutBench[];

export const getProjects = (): Project[] => projectsData as Project[];

/**
 * URL of an image in public/, served alongside the site
 */
export const getImageUrl = (path: string): string =>
  `${import.meta.env.BASE_URL}${path}`;
