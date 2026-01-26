import type { HideoutBench, Item, Project, Quest } from "../types";

// Configuration
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || "SquaredCub";
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || "arcraiders-data";
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

// Base URL for GitHub raw content
const GITHUB_RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

/**
 * Cache management
 */
const CACHE_KEY_PREFIX = "arcraiders_data_";
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;

    if (isExpired) {
      sessionStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error writing cache:", error);
  }
};

/**
 * Fetch a single JSON file from GitHub
 */
async function fetchFromGitHub<T>(path: string): Promise<T> {
  const url = `${GITHUB_RAW_BASE_URL}/${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List files in a GitHub directory using the GitHub API
 */
interface GitHubFileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

async function listGitHubDirectory(directory: string): Promise<string[]> {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${directory}?ref=${GITHUB_BRANCH}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to list directory ${directory}: ${response.statusText}`,
    );
  }

  const entries: GitHubFileEntry[] = await response.json();

  // Filter for .json files only
  return entries
    .filter((entry) => entry.type === "file" && entry.name.endsWith(".json"))
    .map((entry) => entry.name);
}

/**
 * Fetch all JSON files from a directory on GitHub
 * Since we can't list directory contents directly, we'll need to fetch them individually
 * based on a manifest or known file list
 */
async function fetchDirectoryFiles<T>(
  directory: string,
  fileNames: string[],
): Promise<T[]> {
  const promises = fileNames.map((fileName) =>
    fetchFromGitHub<T>(`${directory}/${fileName}`),
  );

  return Promise.all(promises);
}

/**
 * Get the list of item file names
 */
async function getItemFileNames(): Promise<string[]> {
  // Use GitHub API to list directory contents
  return listGitHubDirectory("items");
}

/**
 * Get the list of quest file names
 */
async function getQuestFileNames(): Promise<string[]> {
  // Use GitHub API to list directory contents
  return listGitHubDirectory("quests");
}

/**
 * Fetch all items
 */
export async function fetchAllItems(): Promise<Item[]> {
  const cacheKey = "all_items";
  const cached = getCachedData<Item[]>(cacheKey);

  if (cached) {
    return cached;
  }

  // Fetch from GitHub
  const fileNames = await getItemFileNames();
  const items = await fetchDirectoryFiles<Item>("items", fileNames);
  setCachedData(cacheKey, items);
  return items;
}

/**
 * Fetch all quests
 */
export async function fetchAllQuests(): Promise<Quest[]> {
  const cacheKey = "all_quests";
  const cached = getCachedData<Quest[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const fileNames = await getQuestFileNames();
  const quests = await fetchDirectoryFiles<Quest>("quests", fileNames);
  setCachedData(cacheKey, quests);
  return quests;
}

/**
 * Fetch hideout benches
 */
export async function fetchHideoutBenches(): Promise<HideoutBench[]> {
  const cacheKey = "hideout_benches";
  const cached = getCachedData<HideoutBench[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const benchFiles = [
    "equipment_bench.json",
    "explosives_bench.json",
    "med_station.json",
    "refiner.json",
    "scrappy.json",
    "stash.json",
    "utility_bench.json",
    "weapon_bench.json",
    "workbench.json",
  ];

  const benches = await fetchDirectoryFiles<HideoutBench>(
    "hideout",
    benchFiles,
  );
  setCachedData(cacheKey, benches);
  return benches;
}

/**
 * Fetch projects
 */
export async function fetchProjects(): Promise<Project[]> {
  const cacheKey = "projects";
  const cached = getCachedData<Project[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const projects = await fetchFromGitHub<Project[]>("projects.json");
  setCachedData(cacheKey, projects);
  return projects;
}

/**
 * Get image URL for an item from GitHub
 */
export const getImageUrl = (path: string): string => {
  return `${GITHUB_RAW_BASE_URL}/${path}`;
};

/**
 * Clear all cached data
 */
export const clearCache = (): void => {
  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
};
