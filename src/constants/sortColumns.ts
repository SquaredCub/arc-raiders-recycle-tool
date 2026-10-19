import type { NavigationPage } from "../components/Navigation";
import type { UIStringKey } from "../localization/uiStrings";

export const SORT_COLUMNS = [
  { id: "item", label: "sort.name" as UIStringKey, descFirst: false },
  { id: "recycles", label: "sort.recyclesInto" as UIStringKey, descFirst: true },
  { id: "salvages", label: "sort.salvagesInto" as UIStringKey, descFirst: true },
  { id: "foundIn", label: "sort.foundIn" as UIStringKey, descFirst: false },
  { id: "neededFor", label: "sort.neededFor" as UIStringKey, descFirst: true },
  { id: "usedToCraft", label: "sort.usedToCraft" as UIStringKey, descFirst: true },
  { id: "value", label: "sort.value" as UIStringKey, descFirst: true },
] as const;

export type SortColumnId = (typeof SORT_COLUMNS)[number]["id"];

export const SORT_COLUMNS_BY_ID = Object.fromEntries(
  SORT_COLUMNS.map((col) => [col.id, col]),
) as Record<SortColumnId, (typeof SORT_COLUMNS)[number]>;

// Columns each page's table shows, in display order
const PAGE_COLUMN_IDS: Record<NavigationPage, SortColumnId[]> = {
  recycling: ["item", "recycles", "salvages", "foundIn", "neededFor", "value"],
  crafting: ["item", "usedToCraft", "value"],
};

export const PAGE_SORT_COLUMNS = Object.fromEntries(
  Object.entries(PAGE_COLUMN_IDS).map(([page, ids]) => [
    page,
    ids.map((id) => SORT_COLUMNS_BY_ID[id]),
  ]),
) as Record<NavigationPage, (typeof SORT_COLUMNS)[number][]>;
