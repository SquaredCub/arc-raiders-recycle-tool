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
import { useData } from "./hooks/useData";
import {
  formatMaterialName,
  getItemImage,
  getMaterialImage,
} from "./data/itemsData";
import { getItemRequirements } from "./data/requirementsData";
import ItemCell from "./ItemCell";
import Table from "./Table";
import type { Item } from "./types";

const fallbackData: Item[] = [];

const language = "en";

const columnHelper = createColumnHelper<Item>();

const ItemsTable = ({ searchTerm }: { searchTerm: string }) => {
  const { items, quests, hideoutBenches, projects, isLoading, error } =
    useData();

  // Compute item requirements from the data
  const itemRequirements = useMemo(
    () => getItemRequirements(hideoutBenches, quests, projects),
    [hideoutBenches, quests, projects]
  );

  const data = useMemo(() => items, [items]);

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "item",
      desc: false,
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
          const imageSrc = getItemImage(item);
          return <ItemCell name={item.name[language]} imageSrc={imageSrc} />;
        },
        footer: (info) => info.column.id,
        enableSorting: true,
      }),
      columnHelper.accessor("recyclesInto", {
        id: "recycles",
        header: () => <span>Recycles Into</span>,
        cell: (info) => {
          const recycleData = info.getValue();
          if (!recycleData || Object.keys(recycleData).length === 0) {
            return <span>-</span>;
          }
          // Sort materials alphabetically by name
          const sortedEntries = Object.entries(recycleData).sort(
            ([materialA], [materialB]) => {
              return formatMaterialName(materialA).localeCompare(
                formatMaterialName(materialB)
              );
            }
          );

          return (
            <div style={{ display: "flex", flexDirection: "column" }}>
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
        footer: (info) => info.column.id,
        enableSorting: false,
      }),
      columnHelper.accessor("id", {
        id: "neededFor",
        header: () => <span>Needed For</span>,
        cell: (info) => {
          const itemId = info.getValue();
          const requirements = itemRequirements[itemId];

          if (!requirements) {
            return <span>-</span>;
          }

          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div style={{ fontWeight: "bold" }}>
                Total: {requirements.totalQuantity}
              </div>
              <div style={{ fontSize: "0.9em", color: "#666" }}>
                {requirements.usedIn.map((usage, index) => (
                  <div key={index}>
                    • {usage.source} ({usage.quantity})
                  </div>
                ))}
              </div>
            </div>
          );
        },
        footer: (info) => info.column.id,
        enableSorting: true,
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
        cell: (info) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textAlign: "center",
              padding: "12px",
            }}
          >
            <span>{info.getValue()}</span>
            <img
              src={coinsPng}
              alt="Coins"
              style={{ width: "18px", height: "18px", paddingTop: "2px" }}
            />
          </div>
        ),
        footer: (info) => info.column.id,
        enableSorting: true,
      }),
    ],
    [itemRequirements]
  );

  // Filter data based on search term and sort by match type
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    // Separate items into two groups: name matches and material matches
    const nameMatches: Item[] = [];
    const materialMatches: Item[] = [];

    for (const item of data) {
      const itemName = item.name[language].toLowerCase();

      // Check if item name matches
      if (itemName.includes(lowerSearchTerm)) {
        nameMatches.push(item);
        continue;
      }

      // Check if any material in recyclesInto matches
      if (item.recyclesInto) {
        const materials = Object.keys(item.recyclesInto);
        const hasMatch = materials.some((material) => {
          const materialName = formatMaterialName(material).toLowerCase();
          return materialName.includes(lowerSearchTerm);
        });

        if (hasMatch) {
          materialMatches.push(item);
        }
      }
    }

    const results = [...nameMatches, ...materialMatches];

    // If no results found, return a placeholder item
    if (results.length === 0) {
      return [
        {
          id: "no-results",
          name: { en: `No items found matching "${searchTerm}"` },
          description: { en: "" },
          type: "",
          rarity: "",
          value: 0,
          weightKg: 0,
          stackSize: 0,
          imageFilename: "",
          updatedAt: "",
        } as Item,
      ];
    }

    // Return name matches first, then material matches
    return results;
  }, [data, searchTerm]);

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
