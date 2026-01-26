import { createColumnHelper } from "@tanstack/react-table";
import coinsPng from "../arcraiders-data/images/coins.png";
import { getItemImage } from "../data/itemsData";
import ItemCell from "../ItemCell";
import type { Item, ItemRequirementLookup } from "../types";
import { compareStrings, DEFAULT_LANGUAGE, isNoResultsItem } from "./functions";
import type { CachedMaterial, SortKeyCache } from "./tableCache";

const columnHelper = createColumnHelper<Item>();

/**
 * Create table column definitions
 * Extracted to separate file for better organization and maintainability
 */
export const createItemsTableColumns = (
  itemRequirements: ItemRequirementLookup,
  benchNameLookup: Record<string, string>,
  sortedMaterialsCache: Record<string, CachedMaterial[]>,
  sortKeyCache: SortKeyCache,
  searchRelevanceIndex: Record<string, number>,
) => {
  // Helper function to get bench name (uses lookup map for performance)
  const getBenchName = (benchId: string): string => {
    return benchNameLookup[benchId] || benchId;
  };

  const hasActiveSearch = Object.keys(searchRelevanceIndex).length > 0;

  return [
    columnHelper.accessor("name", {
      id: "item",
      header: () => <span>Item</span>,
      size: 200,
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
        // When searching, use relevance order instead of alphabetical
        if (hasActiveSearch) {
          const relevanceA = searchRelevanceIndex[rowA.original.id] ?? Infinity;
          const relevanceB = searchRelevanceIndex[rowB.original.id] ?? Infinity;
          return relevanceA - relevanceB;
        }
        // Use pre-computed lowercase sort keys for faster comparison
        const nameA = sortKeyCache.nameSortKeys[rowA.original.id] || "";
        const nameB = sortKeyCache.nameSortKeys[rowB.original.id] || "";
        // Simple string comparison (sort keys are already lowercase)
        return compareStrings(nameA, nameB);
      },
    }),
    columnHelper.accessor("recyclesInto", {
      id: "recycles",
      header: () => <span>Recycles Into</span>,
      size: 250,
      cell: (info) => {
        const item = info.row.original;
        // Handle "no results" placeholder
        if (isNoResultsItem(item.id)) {
          return <span>-</span>;
        }
        // Use pre-computed cache for performance
        const cachedMaterials = sortedMaterialsCache[`recycle_${item.id}`];
        if (!cachedMaterials) {
          return <span>-</span>;
        }

        return (
          <div className="recycles-container">
            {cachedMaterials.map(({ material, quantity, name, image }) => (
              <ItemCell
                key={material}
                name={`${quantity} x ${name}`}
                imageSrc={image}
              />
            ))}
          </div>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor("recipe", {
      id: "craftingMaterials",
      header: () => <span>Crafting Materials</span>,
      size: 250,
      cell: (info) => {
        const item = info.row.original;
        // Handle "no results" placeholder
        if (isNoResultsItem(item.id)) {
          return <span>-</span>;
        }
        // Use pre-computed cache for performance
        const cachedMaterials = sortedMaterialsCache[`recipe_${item.id}`];
        if (!cachedMaterials) {
          return <span>-</span>;
        }

        return (
          <div className="recycles-container">
            {cachedMaterials.map(({ material, quantity, name, image }) => (
              <ItemCell
                key={material}
                name={`${quantity} x ${name}`}
                imageSrc={image}
              />
            ))}
          </div>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor("craftBench", {
      id: "craftingStation",
      header: () => <span>Crafting Station</span>,
      size: 140,
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
        // Use pre-computed bench sort keys
        const benchA = sortKeyCache.benchSortKeys[rowA.original.id] || "";
        const benchB = sortKeyCache.benchSortKeys[rowB.original.id] || "";

        // Handle null/undefined (empty strings sort last)
        if (!benchA && !benchB) return 0;
        if (!benchA) return 1;
        if (!benchB) return -1;

        return compareStrings(benchA, benchB);
      },
    }),
    columnHelper.accessor("id", {
      id: "neededFor",
      header: () => <span>Needed For</span>,
      size: 220,
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
        // Use pre-computed requirement totals for faster sorting
        const totalA = sortKeyCache.requirementTotals[rowA.original.id] ?? 0;
        const totalB = sortKeyCache.requirementTotals[rowB.original.id] ?? 0;
        return totalA - totalB;
      },
    }),
    columnHelper.accessor("value", {
      header: () => <span>Value</span>,
      size: 80,
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
};
