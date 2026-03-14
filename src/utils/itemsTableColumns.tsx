import { createColumnHelper } from "@tanstack/react-table";
import { SORT_COLUMNS } from "../constants/sortColumns";
import { COINS_IMAGE_URL, getItemImage } from "../data/itemsData";
import type { EnrichedItemRequirementLookup } from "../data/requirementsData";
import type { Item } from "../generated/types";
import ItemCell from "../ItemCell";
import {
  getLocalizedText,
  type LanguageCode,
} from "../localization/languageUtils";
import type { UIStringKey } from "../localization/uiStrings";
import { getImageUrl } from "../services/dataService";
import { isNoResultsItem } from "./functions";
import type { CachedMaterial } from "./tableCache";

const columnHelper = createColumnHelper<Item>();

const col = (id: string) => {
  const found = SORT_COLUMNS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown sort column: ${id}`);
  return found;
};

/**
 * Create table column definitions
 * Extracted to separate file for better organization and maintainability
 */
export const createItemsTableColumns = (
  itemRequirements: EnrichedItemRequirementLookup,
  sortedMaterialsCache: Record<string, CachedMaterial[]>,
  matchedMaterials?: Record<string, Set<string>>,
  matchedSources?: Record<string, Set<string>>,
  language?: LanguageCode,
  translateUI?: (key: UIStringKey) => string,
  onSearchTermChange?: (term: string) => void,
) => {
  const label = (key: UIStringKey) => translateUI?.(key) ?? key;
  return [
    columnHelper.accessor("name", {
      id: col("item").id,
      header: () => <span>{label(col("item").label)}</span>,
      size: 200,
      cell: (info) => {
        const item = info.row.original;
        // Handle "no results" placeholder
        if (isNoResultsItem(item.id)) {
          return <span>{item.name.en}</span>;
        }
        const imageSrc = getItemImage(item);
        return (
          <ItemCell
            id={item.id}
            name={
              language ? getLocalizedText(item.name, language) : item.name.en
            }
            imageSrc={imageSrc}
            rarity={item.rarity}
          />
        );
      },
      enableSorting: true,
      sortDescFirst: col("item").descFirst,
    }),
    columnHelper.accessor("recyclesInto", {
      id: col("recycles").id,
      header: () => <span>{label(col("recycles").label)}</span>,
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

        const itemMatched = matchedMaterials?.[item.id];
        return (
          <div className="recycles-salvages-container">
            {cachedMaterials.map(({ material, quantity, name, image }) => (
              <ItemCell
                key={material}
                name={`${quantity} x ${name}`}
                imageSrc={image}
                highlighted={itemMatched?.has(material)}
              />
            ))}
          </div>
        );
      },
      enableSorting: true,
      sortDescFirst: col("recycles").descFirst,
    }),
    columnHelper.accessor("salvagesInto", {
      id: col("salvages").id,
      header: () => <span>{label(col("salvages").label)}</span>,
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

        const itemMatched = matchedMaterials?.[item.id];
        return (
          <div className="recycles-salvages-container">
            {cachedMaterials.map(({ material, quantity, name, image }) => (
              <ItemCell
                key={material}
                name={`${quantity} x ${name}`}
                imageSrc={image}
                highlighted={itemMatched?.has(material)}
              />
            ))}
          </div>
        );
      },
      enableSorting: true,
      sortDescFirst: col("salvages").descFirst,
    }),
    columnHelper.accessor("foundIn", {
      id: col("foundIn").id,
      header: () => <span>{label(col("foundIn").label)}</span>,
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
              const locationKey =
                `location.${source.toLowerCase().replace(/ /g, "")}` as import("../localization/uiStrings").UIStringKey;
              const displayName = translateUI
                ? translateUI(locationKey)
                : source;
              // Fall back to raw source if translateUI returned the key itself
              const translatedName =
                displayName === locationKey ? source : displayName;
              return (
                <div key={source} className="found-in-item">
                  <img src={iconUrl} alt={source} className="found-in-icon" />
                  <span>{translatedName}</span>
                </div>
              );
            })}
          </div>
        );
      },
      enableSorting: true,
      sortDescFirst: col("foundIn").descFirst,
    }),
    columnHelper.accessor("id", {
      id: col("neededFor").id,
      header: () => <span>{label(col("neededFor").label)}</span>,
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
              {label("general.total")} {requirements.totalQuantity}
            </div>
            <div className="needed-for-list">
              {requirements.usedIn.map((usage, index) => {
                const isHighlighted = matchedSources?.[itemId]?.has(
                  usage.source,
                );
                const isClickable = !!onSearchTermChange;

                const className =
                  [
                    isHighlighted && "needed-for-source--highlighted",
                    isClickable && "needed-for-source--clickable",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined;

                return isClickable ? (
                  <button
                    key={index}
                    type="button"
                    className={className}
                    onClick={() => onSearchTermChange(usage.source)}
                  >
                    • {usage.source} ({usage.quantity})
                  </button>
                ) : (
                  <div key={index} className={className}>
                    • {usage.source} ({usage.quantity})
                  </div>
                );
              })}
            </div>
          </div>
        );
      },
      enableSorting: true,
      sortDescFirst: col("neededFor").descFirst,
    }),
    columnHelper.accessor("value", {
      id: col("value").id,
      header: () => <span>{label(col("value").label)}</span>,
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
            <img
              src={COINS_IMAGE_URL}
              alt="Coins"
              className="value-coin-icon"
            />
          </div>
        );
      },
      enableSorting: true,
      sortDescFirst: col("value").descFirst,
    }),
  ];
};
