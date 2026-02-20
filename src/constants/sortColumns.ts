export const SORT_COLUMNS = [
  { id: "item", label: "Name", descFirst: false },
  { id: "recycles", label: "Recycles Into", descFirst: true },
  { id: "salvages", label: "Salvages Into", descFirst: true },
  { id: "foundIn", label: "Found In", descFirst: false },
  { id: "neededFor", label: "Needed For", descFirst: true },
  { id: "value", label: "Value", descFirst: true },
] as const;

export type SortColumnId = (typeof SORT_COLUMNS)[number]["id"];

export const SORT_COLUMNS_BY_ID = Object.fromEntries(
  SORT_COLUMNS.map((col) => [col.id, col]),
) as Record<SortColumnId, (typeof SORT_COLUMNS)[number]>;
