import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import React, { useMemo } from "react";
import coinsPng from "./arcraiders-data/images/coins.png";
import ErrorMessage from "./components/ErrorMessage";
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

const ItemsTable = ({ searchTerm }: { searchTerm: string }) => {
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
    () => [
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
    ],
    [itemRequirements]
  );

  // Filter data based on search term and sort by match type
  const filteredData = useMemo(() => {
    const results = filterItemsBySearch(
      items,
      searchTerm,
      formatMaterialName,
      DEFAULT_LANGUAGE
    );

    // If no results found, return a placeholder item
    if (results.length === 0) {
      return [createNoResultsItem(searchTerm)];
    }

    return results;
  }, [items, searchTerm]);

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
