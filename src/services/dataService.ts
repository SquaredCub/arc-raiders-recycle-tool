import hideoutData from "../generated/hideout.json";
import itemsData from "../generated/items.json";
import projectsData from "../generated/projects.json";
import questsData from "../generated/quests.json";
import type { HideoutBench, Item, Project, Quest } from "../types";

// Configuration (still used for image URLs)
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || "SquaredCub";
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || "arcraiders-data";
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

const GITHUB_RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

/**
 * Data accessors — all data is bundled at build time, no runtime fetches needed.
 * These remain async to preserve the existing API contract.
 */
export const fetchAllItems = async (): Promise<Item[]> =>
  itemsData as Item[];

export const fetchAllQuests = async (): Promise<Quest[]> =>
  questsData as Quest[];

export const fetchHideoutBenches = async (): Promise<HideoutBench[]> =>
  hideoutData as HideoutBench[];

export const fetchProjects = async (): Promise<Project[]> =>
  projectsData as Project[];

/**
 * Get image URL for an item from GitHub
 */
export const getImageUrl = (path: string): string => {
  return `${GITHUB_RAW_BASE_URL}/${path}`;
};
