import type { UIStringKey } from "../localization/uiStrings";

export const SORT_COLUMNS = [
  { id: "item", label: "sort.name" as UIStringKey, descFirst: false },
  { id: "recycles", label: "sort.recyclesInto" as UIStringKey, descFirst: true },
  { id: "salvages", label: "sort.salvagesInto" as UIStringKey, descFirst: true },
  { id: "foundIn", label: "sort.foundIn" as UIStringKey, descFirst: false },
  { id: "neededFor", label: "sort.neededFor" as UIStringKey, descFirst: true },
  { id: "value", label: "sort.value" as UIStringKey, descFirst: true },
] as const;

export type SortColumnId = (typeof SORT_COLUMNS)[number]["id"];

export const SORT_COLUMNS_BY_ID = Object.fromEntries(
  SORT_COLUMNS.map((col) => [col.id, col]),
) as Record<SortColumnId, (typeof SORT_COLUMNS)[number]>;
