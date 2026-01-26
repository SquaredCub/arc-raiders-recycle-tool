import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import coinsPng from "./arcraiders-data/images/coins.png";
import ErrorMessage from "./components/ErrorMessage";
import type { FilterSettings } from "./components/FilterModal";
import LoadingSpinner from "./components/LoadingSpinner";
import {
  formatMaterialName,
  getItemImage,
  getMaterialImage,
} from "./data/itemsData";
import { getItemRequirements } from "./data/requirementsData";
import { useData } from "./hooks/useData";
import ItemCell from "./ItemCell";
import Table from "./Table";
import type { Item } from "./types";
import {
  createNoResultsItem,
  DEFAULT_LANGUAGE,
  filterItemsBySearch,
  isNoResultsItem,
  sortMaterialsByName,
} from "./utils/functions";

const fallbackData: Item[] = [];

const columnHelper = createColumnHelper<Item>();

const ItemsTable = ({
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
    [hideoutBenches, quests, projects]
  );

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "item",
      desc: true,
    },
  ]);

  // Define columns inside component to access itemRequirements
  const columns = useMemo(
    () => {
      // Helper function to get bench name (handles special cases and localization)
      const getBenchName = (benchId: string): string => {
        // Handle special case: in_raid means field crafting
        if (benchId === "in_raid") {
          return "Field Crafting";
        }
        const bench = hideoutBenches.find((b) => b.id === benchId);
        return bench?.name[DEFAULT_LANGUAGE] || benchId;
      };

      return [
      columnHelper.accessor("name", {
        id: "item",
        header: () => <span>Item</span>,
        cell: (info) => {
          const item = info.row.original;
          // Handle "no results" placeholder
          if (isNoResultsItem(item.id)) {
            return <span>{item.name[DEFAULT_LANGUAGE]}</span>;
          }
          const imageSrc = getItemImage(item);
          return (
            <ItemCell
              id={item.id}
              name={item.name[DEFAULT_LANGUAGE] || item.name.en}
              imageSrc={imageSrc}
            />
          );
        },
        enableSorting: true,
        sortDescFirst: true,
        invertSorting: true,
        sortingFn: (rowA, rowB) => {
          // Always sort by name in the default language (or fallback to 'en')
          const nameA =
            rowA.original.name[DEFAULT_LANGUAGE] || rowA.original.name.en || "";
          const nameB =
            rowB.original.name[DEFAULT_LANGUAGE] || rowB.original.name.en || "";
          return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        },
      }),
      columnHelper.accessor("recyclesInto", {
        id: "recycles",
        header: () => <span>Recycles Into</span>,
        cell: (info) => {
          const item = info.row.original;
          // Handle "no results" placeholder
          if (isNoResultsItem(item.id)) {
            return <span>-</span>;
          }
          const recycleData = info.getValue();
          if (!recycleData || Object.keys(recycleData).length === 0) {
            return <span>-</span>;
          }
          // Sort materials alphabetically by name
          const sortedEntries = sortMaterialsByName(
            Object.entries(recycleData),
            formatMaterialName
          );

          return (
            <div className="recycles-container">
              {sortedEntries.map(([material, quantity]) => {
                const materialImage = getMaterialImage(material);
                const materialName = `${quantity} x ${formatMaterialName(
                  material
                )}`;
                return (
                  <ItemCell
                    key={material}
                    name={materialName}
                    imageSrc={materialImage}
                  />
                );
              })}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("recipe", {
        id: "craftingMaterials",
        header: () => <span>Crafting Materials</span>,
        cell: (info) => {
          const item = info.row.original;
          // Handle "no results" placeholder
          if (isNoResultsItem(item.id)) {
            return <span>-</span>;
          }
          const recipeData = info.getValue();
          if (!recipeData || Object.keys(recipeData).length === 0) {
            return <span>-</span>;
          }
          // Sort materials alphabetically by name
          const sortedEntries = sortMaterialsByName(
            Object.entries(recipeData),
            formatMaterialName
          );

          return (
            <div className="recycles-container">
              {sortedEntries.map(([material, quantity]) => {
                const materialImage = getMaterialImage(material);
                const materialName = `${quantity} x ${formatMaterialName(
                  material
                )}`;
                return (
                  <ItemCell
                    key={material}
                    name={materialName}
                    imageSrc={materialImage}
                  />
                );
              })}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("craftBench", {
        id: "craftingStation",
        header: () => <span>Crafting Station</span>,
        cell: (info) => {
          const item = info.row.original;
          // Handle "no results" placeholder
          if (isNoResultsItem(item.id)) {
            return <span>-</span>;
          }
          const craftBench = info.getValue();
          if (!craftBench) {
            return <span>-</span>;
          }
          // Handle both string and string[] types
          const benches = Array.isArray(craftBench) ? craftBench : [craftBench];
          return (
            <div className="craft-bench-container">
              {benches.map((benchId, index) => (
                <div key={index}>{getBenchName(benchId)}</div>
              ))}
            </div>
          );
        },
        enableSorting: true,
        sortDescFirst: true,
        invertSorting: true,
        sortingFn: (rowA, rowB) => {
          const benchA = rowA.original.craftBench;
          const benchB = rowB.original.craftBench;
          // Handle null/undefined
          if (!benchA && !benchB) return 0;
          if (!benchA) return 1;
          if (!benchB) return -1;

          // Convert to localized names for comparison
          const strA = Array.isArray(benchA)
            ? benchA.map(getBenchName).join(", ")
            : getBenchName(benchA);
          const strB = Array.isArray(benchB)
            ? benchB.map(getBenchName).join(", ")
            : getBenchName(benchB);
          return strA.localeCompare(strB, undefined, { sensitivity: "base" });
        },
      }),
      columnHelper.accessor("id", {
        id: "neededFor",
        header: () => <span>Needed For</span>,
        cell: (info) => {
          const itemId = info.getValue();
          // Handle "no results" placeholder
          if (isNoResultsItem(itemId)) {
            return <span>-</span>;
          }
          const requirements = itemRequirements[itemId];

          if (!requirements) {
            return <span>-</span>;
          }

          return (
            <div className="needed-for-container">
              <div className="needed-for-total">
                Total: {requirements.totalQuantity}
              </div>
              <div className="needed-for-list">
                {requirements.usedIn.map((usage, index) => (
                  <div key={index}>
                    • {usage.source} ({usage.quantity})
                  </div>
                ))}
              </div>
            </div>
          );
        },
        enableSorting: true,
        sortDescFirst: true,
        sortingFn: (rowA, rowB) => {
          const reqA = itemRequirements[rowA.original.id];
          const reqB = itemRequirements[rowB.original.id];
          const totalA = reqA?.totalQuantity ?? 0;
          const totalB = reqB?.totalQuantity ?? 0;
          return totalA - totalB;
        },
      }),
      columnHelper.accessor("value", {
        header: () => <span>Value</span>,
        cell: (info) => {
          const item = info.row.original;
          // Handle "no results" placeholder
          if (isNoResultsItem(item.id)) {
            return <span>-</span>;
          }
          return (
            <div className="value-container">
              <span>{info.getValue()}</span>
              <img src={coinsPng} alt="Coins" className="value-coin-icon" />
            </div>
          );
        },
        enableSorting: true,
        sortDescFirst: true,
      }),
    ];
    },
    [itemRequirements, hideoutBenches]
  );

  // Filter data based on search term and category filters
  const filteredData = useMemo(() => {
    // First filter by search term
    let results = filterItemsBySearch(
      items,
      searchTerm,
      formatMaterialName,
      DEFAULT_LANGUAGE
    );

    // Then filter by included categories
    results = results.filter((item) =>
      filterSettings.includedCategories.has(item.type)
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
        (item) => !isNoResultsItem(item.id)
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
    return <ErrorMessage message={"Something went wrong fetching the data"} />;

  return <Table<Item> table={table} className="items-table" />;
};

export default ItemsTable;
