import {
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import type { FilterSettings } from "./components/FilterModal";
import {
  FOUND_IN_LOCATIONS,
  NEEDED_FOR_SOURCE_TYPES,
} from "./constants/filterOptions";
import { formatMaterialName } from "./data/itemsData";
import { getItemRequirements } from "./data/requirementsData";
import { useData } from "./hooks/useData";
import Table from "./Table";
import type { Item } from "./generated/types";
import {
  createNoResultsItem,
  DEFAULT_LANGUAGE,
  filterItemsBySearch,
  isNoResultsItem,
  type SearchMatchType,
} from "./utils/functions";
import { createItemsTableColumns } from "./utils/itemsTableColumns";
import { sortItems } from "./utils/sortingFunctions";
import {
  createBenchNameLookup,
  createSortedMaterialsCache,
  createSortKeyCache,
} from "./utils/tableCache";

const fallbackData: Item[] = [];

interface ItemsTableProps {
  searchTerm: string;
  filterSettings: FilterSettings;
  sorting: SortingState;
  onSortingChange: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
  onFilteredCountChange?: (filteredCount: number, totalCount: number) => void;
}

const ItemsTable = React.memo(
  ({
    searchTerm,
    filterSettings,
    sorting,
    onSortingChange,
    onFilteredCountChange,
  }: ItemsTableProps) => {
    const {
      items,
      quests,
      hideoutBenches,
      projects,
    } = useData();

    // Compute item requirements from the data
    const itemRequirements = useMemo(
      () => getItemRequirements(hideoutBenches, quests, projects),
      [hideoutBenches, quests, projects],
    );

    // Create lookup maps for performance optimization
    const benchNameLookup = useMemo(
      () => createBenchNameLookup(hideoutBenches),
      [hideoutBenches],
    );

    const sortedMaterialsCache = useMemo(
      () => createSortedMaterialsCache(items),
      [items],
    );

    // Pre-compute sort keys for performance optimization
    const sortKeyCache = useMemo(
      () => createSortKeyCache(items, benchNameLookup, itemRequirements),
      [items, benchNameLookup, itemRequirements],
    );

    // Run search once and derive relevance index, match types, and filtered data
    const searchResult = useMemo(
      () =>
        filterItemsBySearch(
          items,
          searchTerm,
          formatMaterialName,
          DEFAULT_LANGUAGE,
          itemRequirements,
        ),
      [itemRequirements, items, searchTerm],
    );

    const hasActiveSearch = searchTerm.trim().length > 0;

    const searchMatchTypes: Record<
      string,
      Set<SearchMatchType>
    > = searchResult.matchTypes;

    // Compute material match scores for sorting recycles/salvages columns
    const materialMatchScores = useMemo(() => {
      const scores: Record<string, { recycles: number; salvages: number }> = {};
      const { matchedMaterials } = searchResult;
      if (Object.keys(matchedMaterials).length === 0) return scores;

      for (const item of searchResult.items) {
        const matched = matchedMaterials[item.id];
        if (!matched) continue;

        let recycleScore = 0;
        let salvageScore = 0;

        if (item.recyclesInto) {
          for (const [material, quantity] of Object.entries(item.recyclesInto)) {
            if (matched.has(material)) recycleScore += quantity;
          }
        }

        if (item.salvagesInto) {
          for (const [material, quantity] of Object.entries(item.salvagesInto)) {
            if (matched.has(material)) salvageScore += quantity;
          }
        }

        scores[item.id] = { recycles: recycleScore, salvages: salvageScore };
      }

      return scores;
    }, [searchResult]);

    // Create column definitions using extracted function
    const columns = useMemo(
      () =>
        createItemsTableColumns(
          itemRequirements,
          sortedMaterialsCache,
          searchResult.matchedMaterials,
          searchResult.matchedSources,
        ),
      [
        itemRequirements,
        sortedMaterialsCache,
        searchResult.matchedMaterials,
        searchResult.matchedSources,
      ],
    );

    // Filter data based on search term and all filter settings
    const filteredData = useMemo(() => {
      let results = hasActiveSearch
        ? items.filter((item) => searchResult.matchTypes[item.id])
        : items;

      // Filter by included categories
      results = results.filter((item) =>
        filterSettings.includedCategories.has(item.type),
      );

      // Filter by rarity
      results = results.filter((item) =>
        filterSettings.includedRarities.has(item.rarity),
      );

      // Filter by recycle output
      if (filterSettings.onlyRecyclable) {
        results = results.filter(
          (item) => item.recyclesInto && Object.keys(item.recyclesInto).length > 0,
        );
      }

      // Filter by salvage output
      if (filterSettings.onlySalvageable) {
        results = results.filter(
          (item) => item.salvagesInto && Object.keys(item.salvagesInto).length > 0,
        );
      }

      // Filter by found-in location
      if (filterSettings.includedLocations.size < FOUND_IN_LOCATIONS.length) {
        results = results.filter((item) => {
          if (!item.foundIn) return filterSettings.includedLocations.has("No Location");
          const locations = item.foundIn.split(", ");
          return locations.some((loc) => filterSettings.includedLocations.has(loc));
        });
      }

      // Filter by needed-for source type
      if (filterSettings.includedSourceTypes.size < NEEDED_FOR_SOURCE_TYPES.length) {
        results = results.filter((item) => {
          const req = itemRequirements[item.id];
          if (!req) return filterSettings.includedSourceTypes.has("Not Needed");

          const sources = req.usedIn.map((u) => u.source);
          const hasHideout = sources.some((s) => s.includes(" Lvl "));
          const hasQuest = sources.some((s) => s.startsWith("Quest: "));
          const hasProject = sources.some((s) => s.includes(" - Step "));

          return (
            (hasHideout && filterSettings.includedSourceTypes.has("Hideout")) ||
            (hasQuest && filterSettings.includedSourceTypes.has("Quest")) ||
            (hasProject && filterSettings.includedSourceTypes.has("Project"))
          );
        });
      }

      // If no results found, return a placeholder item
      if (results.length === 0) {
        return [createNoResultsItem(searchTerm)];
      }

      return results;
    }, [
      searchResult,
      searchTerm,
      filterSettings.includedCategories,
      filterSettings.includedRarities,
      filterSettings.onlyRecyclable,
      filterSettings.onlySalvageable,
      filterSettings.includedLocations,
      filterSettings.includedSourceTypes,
      hasActiveSearch,
      items,
      itemRequirements,
    ]);

    const isPrioritizing =
      hasActiveSearch && filterSettings.prioritizeNameMatches;

    // Sort data manually (manualSorting: true means TanStack won't sort for us)
    const sortedData = useMemo(
      () =>
        sortItems(filteredData, sorting, {
          prioritizeNameMatches: isPrioritizing,
          searchMatchTypes,
          sortKeyCache,
          materialMatchScores,
        }),
      [
        filteredData,
        sorting,
        isPrioritizing,
        searchMatchTypes,
        sortKeyCache,
        materialMatchScores,
      ],
    );

    // Index of the last name-matched row when prioritizing (for visual separator)
    const nameMatchBoundaryIndex = useMemo(() => {
      if (!isPrioritizing) return -1;
      let lastIndex = -1;
      for (let i = 0; i < sortedData.length; i++) {
        if (searchMatchTypes[sortedData[i].id]?.has("item")) {
          lastIndex = i;
        } else {
          break; // Name matches are contiguous at the top
        }
      }
      // Only show boundary if there are also non-name-matched items after
      return lastIndex >= 0 && lastIndex < sortedData.length - 1
        ? lastIndex
        : -1;
    }, [isPrioritizing, sortedData, searchMatchTypes]);

    // Notify parent of filtered count changes
    useEffect(() => {
      if (onFilteredCountChange && items.length > 0) {
        const actualFilteredCount = filteredData.filter(
          (item) => !isNoResultsItem(item.id),
        ).length;
        onFilteredCountChange(actualFilteredCount, items.length);
      }
    }, [filteredData, items, onFilteredCountChange]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
      columns,
      data: sortedData ?? fallbackData,
      getCoreRowModel: getCoreRowModel(),
      manualSorting: true,
      onSortingChange: onSortingChange,
      enableSortingRemoval: false,
      state: {
        sorting,
      },
    });

    return (
      <Table<Item>
        table={table}
        className="items-table"
        searchMatchTypes={searchMatchTypes}
        nameMatchBoundaryIndex={nameMatchBoundaryIndex}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.searchTerm === nextProps.searchTerm &&
      prevProps.onFilteredCountChange === nextProps.onFilteredCountChange &&
      prevProps.onSortingChange === nextProps.onSortingChange &&
      prevProps.sorting === nextProps.sorting &&
      prevProps.filterSettings.prioritizeNameMatches ===
        nextProps.filterSettings.prioritizeNameMatches &&
      prevProps.filterSettings.onlyRecyclable ===
        nextProps.filterSettings.onlyRecyclable &&
      prevProps.filterSettings.onlySalvageable ===
        nextProps.filterSettings.onlySalvageable &&
      areSetsEqual(
        prevProps.filterSettings.includedCategories,
        nextProps.filterSettings.includedCategories,
      ) &&
      areSetsEqual(
        prevProps.filterSettings.includedRarities,
        nextProps.filterSettings.includedRarities,
      ) &&
      areSetsEqual(
        prevProps.filterSettings.includedLocations,
        nextProps.filterSettings.includedLocations,
      ) &&
      areSetsEqual(
        prevProps.filterSettings.includedSourceTypes,
        nextProps.filterSettings.includedSourceTypes,
      )
    );
  },
);

// Helper function to compare Sets
const areSetsEqual = <T,>(setA: Set<T>, setB: Set<T>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};

export default ItemsTable;
