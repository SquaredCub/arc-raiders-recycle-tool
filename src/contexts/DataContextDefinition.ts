import { createContext } from "react";
import type { HideoutBench, Item, Project, Quest } from "../types";

export interface DataContextType {
  items: Item[];
  quests: Quest[];
  hideoutBenches: HideoutBench[];
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);
