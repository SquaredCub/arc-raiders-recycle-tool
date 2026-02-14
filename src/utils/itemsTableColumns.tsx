import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { getItemImage } from "../data/itemsData";
import ItemCell from "../ItemCell";
import { getImageUrl } from "../services/dataService";
import type { Item, ItemRequirementLookup } from "../types";
import {
  DEFAULT_LANGUAGE,
  isNoResultsItem,
  type SearchMatchType,
} from "./functions";
import {
  createFoundInAlphabeticalSort,
  createMaterialScoreSort,
  createNameAlphabeticalSort,
  createRequirementTotalSort,
  createSearchAwareSortFactory,
  createValueSort,
} from "./sortingFunctions";
import type { CachedMaterial, SortKeyCache } from "./tableCache";

const columnHelper = createColumnHelper<Item>();
const COINS_IMAGE_URL = getImageUrl("images/coins.png");

/**
 * Create table column definitions
 * Extracted to separate file for better organization and maintainability
 */
export const createItemsTableColumns = (
  itemRequirements: ItemRequirementLookup,
  _benchNameLookup: Record<string, string>,
  sortedMaterialsCache: Record<string, CachedMaterial[]>,
  sortKeyCache: SortKeyCache,
  hasActiveSearch: boolean,
  searchMatchTypes: Record<string, Set<SearchMatchType>>,
  materialMatchScores: Record<string, { recycles: number; salvages: number }>,
  sorting: SortingState,
) => {
  // const getBenchName = (benchId: string): string => {
  //   return benchNameLookup[benchId] || benchId;
  // };

  const sortFor = createSearchAwareSortFactory(
    hasActiveSearch,
    searchMatchTypes,
    sortKeyCache,
    sorting,
  );

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
          <>
            <span className="match-indicator-spacer left" />
            <ItemCell
              id={item.id}
              name={item.name[DEFAULT_LANGUAGE] || item.name.en}
              imageSrc={imageSrc}
              rarity={item.rarity}
            />
          </>
        );
      },
      enableSorting: true,
      sortDescFirst: false,
      sortingFn: sortFor(createNameAlphabeticalSort(sortKeyCache), "item"),
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
      enableSorting: hasActiveSearch,
      sortDescFirst: false,
      sortingFn: sortFor(
        createMaterialScoreSort(materialMatchScores, "recycles"),
        "recycles",
      ),
    }),
    columnHelper.accessor("salvagesInto", {
      id: "salvages",
      header: () => <span>Salvages Into</span>,
      size: 200,
      cell: (info) => {
        const item = info.row.original;
        if (isNoResultsItem(item.id)) {
          return <span>-</span>;
        }
        const cachedMaterials = sortedMaterialsCache[`salvage_${item.id}`];
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
      enableSorting: hasActiveSearch,
      sortDescFirst: false,
      sortingFn: sortFor(
        createMaterialScoreSort(materialMatchScores, "salvages"),
        "salvages",
      ),
    }),
    // columnHelper.accessor("recipe", {
    //   id: "craftingMaterials",
    //   header: () => <span>Crafting Materials</span>,
    //   size: 250,
    //   cell: (info) => {
    //     const item = info.row.original;
    //     if (isNoResultsItem(item.id)) {
    //       return <span>-</span>;
    //     }
    //     const cachedMaterials = sortedMaterialsCache[`recipe_${item.id}`];
    //     if (!cachedMaterials) {
    //       return <span>-</span>;
    //     }
    //     return (
    //       <div className="recycles-container">
    //         {cachedMaterials.map(({ material, quantity, name, image }) => (
    //           <ItemCell
    //             key={material}
    //             name={`${quantity} x ${name}`}
    //             imageSrc={image}
    //           />
    //         ))}
    //       </div>
    //     );
    //   },
    //   enableSorting: false,
    // }),
    // columnHelper.accessor("craftBench", {
    //   id: "craftingStation",
    //   header: () => <span>Crafting Station</span>,
    //   size: 140,
    //   cell: (info) => {
    //     const item = info.row.original;
    //     if (isNoResultsItem(item.id)) {
    //       return <span>-</span>;
    //     }
    //     const craftBench = info.getValue();
    //     if (!craftBench) {
    //       return <span>-</span>;
    //     }
    //     const benches = Array.isArray(craftBench) ? craftBench : [craftBench];
    //     return (
    //       <div className="craft-bench-container">
    //         {benches.map((benchId, index) => (
    //           <div key={index}>{getBenchName(benchId)}</div>
    //         ))}
    //       </div>
    //     );
    //   },
    //   enableSorting: true,
    //   sortDescFirst: true,
    //   invertSorting: true,
    //   sortingFn: (rowA, rowB) => {
    //     const benchA = sortKeyCache.benchSortKeys[rowA.original.id] || "";
    //     const benchB = sortKeyCache.benchSortKeys[rowB.original.id] || "";
    //     if (!benchA && !benchB) return 0;
    //     if (!benchA) return 1;
    //     if (!benchB) return -1;
    //     return compareStrings(benchA, benchB);
    //   },
    // }),
    columnHelper.accessor("foundIn", {
      id: "foundIn",
      header: () => <span>Found In</span>,
      size: 180,
      cell: (info) => {
        const item = info.row.original;
        if (isNoResultsItem(item.id)) {
          return <span>-</span>;
        }
        const foundIn = info.getValue();
        if (!foundIn) {
          return <span>-</span>;
        }
        const sources = foundIn.split(", ");
        return (
          <div className="found-in-container">
            {sources.map((source) => {
              const iconName = source.toLowerCase().replace(" ", "_");
              const iconUrl = getImageUrl(`images/found_in/${iconName}.svg`);
              return (
                <div key={source} className="found-in-item">
                  <img src={iconUrl} alt={source} className="found-in-icon" />
                  <span>{source}</span>
                </div>
              );
            })}
          </div>
        );
      },
      enableSorting: true,
      sortDescFirst: false,
      sortingFn: sortFor(createFoundInAlphabeticalSort(), "foundIn"),
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
      sortingFn: sortFor(createRequirementTotalSort(sortKeyCache), "neededFor"),
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
          <>
            <div className="value-container">
              <span>{info.getValue()}</span>
              <img
                src={COINS_IMAGE_URL}
                alt="Coins"
                className="value-coin-icon"
              />
            </div>
            <span className="match-indicator-spacer right" />
          </>
        );
      },
      enableSorting: true,
      sortDescFirst: true,
      sortingFn: sortFor(createValueSort(), "value"),
    }),
  ];
};
