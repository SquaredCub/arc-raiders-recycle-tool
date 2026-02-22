import { createContext } from "react";
import type { HideoutBench, Item, Project, Quest } from "../generated/types";

export interface DataContextType {
  items: Item[];
  quests: Quest[];
  hideoutBenches: HideoutBench[];
  projects: Project[];
}

export const DataContext = createContext<DataContextType | undefined>(undefined);
