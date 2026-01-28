import {
  getCoreRowModel,
  getSortedRowModel,
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
} from "./utils/functions";
import { createItemsTableColumns } from "./utils/itemsTableColumns";
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
    const { items, quests, hideoutBenches, projects, isLoading, error } =
      useData();

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
        desc: true,
      },
    ]);

    // Create search relevance index to preserve filter order during sorting
    const searchRelevanceIndex = useMemo(() => {
      const index: Record<string, number> = {};
      if (searchTerm.trim()) {
        const results = filterItemsBySearch(
          items,
          searchTerm,
          formatMaterialName,
          DEFAULT_LANGUAGE,
        );
        // Assign relevance scores (lower = more relevant)
        results.forEach((item, idx) => {
          index[item.id] = idx;
        });
      }
      return index;
    }, [items, searchTerm]);

    // Create column definitions using extracted function
    const columns = useMemo(
      () =>
        createItemsTableColumns(
          itemRequirements,
          benchNameLookup,
          sortedMaterialsCache,
          sortKeyCache,
          searchRelevanceIndex,
        ),
      [itemRequirements, benchNameLookup, sortedMaterialsCache, sortKeyCache, searchRelevanceIndex],
    );

    // Filter data based on search term and category filters
    const filteredData = useMemo(() => {
      // First filter by search term
      let results = filterItemsBySearch(
        items,
        searchTerm,
        formatMaterialName,
        DEFAULT_LANGUAGE,
      );

      // Then filter by included categories
      results = results.filter((item) =>
        filterSettings.includedCategories.has(item.type),
      );

      // If no results found, return a placeholder item
      if (results.length === 0) {
        return [createNoResultsItem(searchTerm)];
      }

      return results;
    }, [items, searchTerm, filterSettings]);

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
      data: filteredData ?? fallbackData,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
      enableSortingRemoval: false,
      state: {
        sorting,
      },
    });

    if (isLoading) return <LoadingSpinner />;
    if (error)
      return (
        <ErrorMessage message={"Something went wrong fetching the data"} />
      );

    return (
      <Table<Item>
        table={table}
        className="items-table"
        itemRequirements={itemRequirements}
        benchNameLookup={benchNameLookup}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if searchTerm, filterSettings categories, or callback changes
    return (
      prevProps.searchTerm === nextProps.searchTerm &&
      prevProps.onFilteredCountChange === nextProps.onFilteredCountChange &&
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
