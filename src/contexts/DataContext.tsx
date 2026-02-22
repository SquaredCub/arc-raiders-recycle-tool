import { useMemo, type ReactNode } from "react";
import { filterBlacklistedItemCategories } from "../data/itemsData";
import {
  getAllItems,
  getAllQuests,
  getHideoutBenches,
  getProjects,
} from "../services/dataService";
import type { Item } from "../generated/types";
import { DataContext, type DataContextType } from "./DataContextDefinition";

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const value: DataContextType = useMemo(() => {
    const items = filterBlacklistedItemCategories(getAllItems()).filter(
      (item) => (item.value ?? 0) > 0,
    ) as Item[];
    const quests = getAllQuests();
    const hideoutBenches = getHideoutBenches();
    const projects = getProjects();

    return { items, quests, hideoutBenches, projects };
  }, []);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
