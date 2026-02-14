import {
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import ErrorMessage from "./components/ErrorMessage";
import type { FilterSettings } from "./components/FilterModal";
import LoadingSpinner from "./components/LoadingSpinner";
import { formatMaterialName } from "./data/itemsData";
import { getItemRequirements } from "./data/requirementsData";
import { useData } from "./hooks/useData";
import Table from "./Table";
import type { Item } from "./types";
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

const ItemsTable = React.memo(
  ({
    searchTerm,
    filterSettings,
    onFilteredCountChange,
  }: {
    searchTerm: string;
    filterSettings: FilterSettings;
    onFilteredCountChange?: (filteredCount: number, totalCount: number) => void;
  }) => {
    const {
      items,
      quests,
      hideoutBenches,
      projects,
      isLoading,
      error,
      refetch,
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

    const [sorting, setSorting] = React.useState<SortingState>([
      {
        id: "item",
        desc: false,
      },
    ]);

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

    // Reset sorting to default when search is cleared while sorted on a search-only column
    const searchOnlyColumns = new Set(["recycles", "salvages"]);
    useEffect(() => {
      if (!hasActiveSearch && searchOnlyColumns.has(sorting[0]?.id ?? "")) {
        setSorting([{ id: "item", desc: false }]);
      }
    }, [hasActiveSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchMatchTypes: Record<
      string,
      Set<SearchMatchType>
    > = searchResult.matchTypes;

    // Compute material match scores for sorting recycles/salvages columns
    const materialMatchScores = useMemo(() => {
      const scores: Record<string, { recycles: number; salvages: number }> = {};
      const lowerSearch = searchTerm.trim().toLowerCase();
      if (!lowerSearch) return scores;

      for (const item of searchResult.items) {
        let recycleScore = 0;
        let salvageScore = 0;

        if (item.recyclesInto) {
          for (const [material, quantity] of Object.entries(
            item.recyclesInto,
          )) {
            if (
              formatMaterialName(material).toLowerCase().includes(lowerSearch)
            ) {
              recycleScore += quantity;
            }
          }
        }

        if (item.salvagesInto) {
          for (const [material, quantity] of Object.entries(
            item.salvagesInto,
          )) {
            if (
              formatMaterialName(material).toLowerCase().includes(lowerSearch)
            ) {
              salvageScore += quantity;
            }
          }
        }

        scores[item.id] = { recycles: recycleScore, salvages: salvageScore };
      }

      return scores;
    }, [searchResult, searchTerm]);

    // Create column definitions using extracted function
    const columns = useMemo(
      () =>
        createItemsTableColumns(
          itemRequirements,
          benchNameLookup,
          sortedMaterialsCache,
          hasActiveSearch,
        ),
      [
        itemRequirements,
        benchNameLookup,
        sortedMaterialsCache,
        hasActiveSearch,
      ],
    );

    // Filter data based on search term and category filters
    const filteredData = useMemo(() => {
      let results = hasActiveSearch
        ? items.filter((item) => searchResult.matchTypes[item.id])
        : items;

      // Filter by included categories
      results = results.filter((item) =>
        filterSettings.includedCategories.has(item.type),
      );

      // If no results found, return a placeholder item
      if (results.length === 0) {
        return [createNoResultsItem(searchTerm)];
      }

      return results;
    }, [
      searchResult,
      searchTerm,
      filterSettings.includedCategories,
      hasActiveSearch,
      items,
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
      onSortingChange: setSorting,
      enableSortingRemoval: false,
      state: {
        sorting,
      },
    });

    if (isLoading) return <LoadingSpinner />;
    if (error)
      return (
        <ErrorMessage
          message="Something went wrong fetching the data."
          errorDetails={error}
          onRetry={refetch}
        />
      );

    return (
      <Table<Item>
        table={table}
        className="items-table"
        itemRequirements={itemRequirements}
        benchNameLookup={benchNameLookup}
        sortedMaterialsCache={sortedMaterialsCache}
        searchTerm={searchTerm}
        searchMatchTypes={searchMatchTypes}
        nameMatchBoundaryIndex={nameMatchBoundaryIndex}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if searchTerm, filterSettings categories, or callback changes
    return (
      prevProps.searchTerm === nextProps.searchTerm &&
      prevProps.onFilteredCountChange === nextProps.onFilteredCountChange &&
      prevProps.filterSettings.prioritizeNameMatches ===
        nextProps.filterSettings.prioritizeNameMatches &&
      areSetsEqual(
        prevProps.filterSettings.includedCategories,
        nextProps.filterSettings.includedCategories,
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
