import filterOptions from "../generated/filterOptions.json";

export const ITEM_RARITIES: string[] = filterOptions.rarities;
export const FOUND_IN_LOCATIONS: string[] = filterOptions.locations;

// Static — source type detection is pattern-based, not data-derived
export const NEEDED_FOR_SOURCE_TYPES: string[] = [
  "Hideout",
  "Quest",
  "Project",
  "Not Needed",
];
