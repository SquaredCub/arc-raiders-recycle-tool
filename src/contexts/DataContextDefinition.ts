import { createContext } from "react";
import type { HideoutBench, Item, Project, Quest } from "../generated/types";

export interface DataContextType {
  /** Items shown in the tables */
  items: Item[];
  /** Every item, including hidden categories (e.g. keys craftable from shown items) */
  allItems: Item[];
  quests: Quest[];
  hideoutBenches: HideoutBench[];
  projects: Project[];
}

export const DataContext = createContext<DataContextType | undefined>(undefined);
