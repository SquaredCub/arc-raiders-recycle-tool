import { useEffect, useState, type ReactNode } from "react";
import { filterBlacklistedItems } from "../data/itemsData";
import {
  fetchAllItems,
  fetchAllQuests,
  fetchHideoutBenches,
  fetchProjects,
} from "../services/dataService";
import type { HideoutBench, Item, Project, Quest } from "../types";
import { DataContext, type DataContextType } from "./DataContextDefinition";

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [hideoutBenches, setHideoutBenches] = useState<HideoutBench[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [itemsData, questsData, benchesData, projectsData] =
        await Promise.all([
          fetchAllItems(),
          fetchAllQuests(),
          fetchHideoutBenches(),
          fetchProjects(),
        ]);

      // Filter blacklisted items
      const filteredItems = filterBlacklistedItems(itemsData);

      setItems(filteredItems);
      setQuests(questsData);
      setHideoutBenches(benchesData);
      setProjects(projectsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const value: DataContextType = {
    items,
    quests,
    hideoutBenches,
    projects,
    isLoading,
    error,
    refetch: fetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
