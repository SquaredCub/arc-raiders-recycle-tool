import { memo } from "react";
import ItemCell from "../ItemCell";
import { getImageUrl } from "../services/dataService";
import type { Item, ItemRequirementLookup } from "../types";
import { DEFAULT_LANGUAGE } from "../utils/functions";
import type { CachedMaterial } from "../utils/tableCache";

const COINS_IMAGE_URL = getImageUrl("images/coins.png");
const SHOW_FULL_DATA = false;

interface MobileItemRowProps {
  item: Item;
  itemRequirements: ItemRequirementLookup;
  benchNameLookup: Record<string, string>;
  sortedMaterialsCache: Record<string, CachedMaterial[]>;
  index: number;
}

const MobileItemRow = memo(
  ({
    item,
    itemRequirements,
    benchNameLookup,
    sortedMaterialsCache,
    index,
  }: MobileItemRowProps) => {
    const isEven = index % 2 === 0;

    // Get recycle materials from cache
    const recyclesMaterials = sortedMaterialsCache[`recycle_${item.id}`] || [];

    // Get crafting materials from cache
    const craftingMaterials = sortedMaterialsCache[`recipe_${item.id}`] || [];

    // Get needed for information
    const neededFor = itemRequirements[item.id];

    // Get craft bench name
    const benchName = item.craftBench
      ? Array.isArray(item.craftBench)
        ? item.craftBench
            .map((bench) => benchNameLookup[bench] || bench)
            .join(", ")
        : benchNameLookup[item.craftBench] || item.craftBench
      : "---";

    return (
      <div
        className={`mobile-item-card ${isEven ? "mobile-item-card--even" : ""}`}
      >
        {/* Header with item name and image */}
        <div className="mobile-item-card__header">
          <ItemCell
            id={item.id}
            name={item.name[DEFAULT_LANGUAGE] || item.name.en}
            imageSrc={item.imageFilename}
          />
          <span
            className={`mobile-item-card__rarity mobile-item-card__rarity--${item.rarity.toLowerCase()}`}
          >
            {item.rarity}
          </span>
        </div>

        {/* Main info grid */}
        <div className="mobile-item-card__grid">
          <div className="mobile-item-card__field mobile-item-card__field--type">
            <span className="mobile-item-card__label">Type:</span>
            <span className="mobile-item-card__value">{item.type}</span>
          </div>

          <div className="mobile-item-card__field mobile-item-card__field--value">
            <span className="mobile-item-card__label">Value:</span>
            <span className="mobile-item-card__value">
              <div className="value-container">
                {item.value.toLocaleString()}
                <img
                  src={COINS_IMAGE_URL}
                  className="value-coin-icon"
                  alt="Coins"
                />
              </div>
            </span>
          </div>

          <div className="mobile-item-card__field mobile-item-card__field--recycles">
            <span className="mobile-item-card__label">Recycles Into:</span>
            <div className="mobile-item-card__value">
              <div className="recycles-container">
                {recyclesMaterials.length > 0
                  ? recyclesMaterials.map(
                      ({ material, quantity, name, image }) => (
                        <ItemCell
                          key={material}
                          name={`${quantity}x ${name}`}
                          imageSrc={image}
                        />
                      ),
                    )
                  : "---"}
              </div>
            </div>
          </div>

          {SHOW_FULL_DATA ?? (
            <div className="mobile-item-card__field mobile-item-card__field--needed">
              <span className="mobile-item-card__label">Needed For:</span>
              <div className="mobile-item-card__value">
                <div className="needed-for-total">
                  {neededFor?.totalQuantity
                    ? `${neededFor.totalQuantity}x`
                    : "---"}
                </div>
                <div className="needed-for-list">
                  {neededFor?.usedIn.map((usage, idx) => (
                    <div key={idx}>
                      {usage.source}: {usage.quantity}x
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {SHOW_FULL_DATA ?? (
            <div className="mobile-item-card__field mobile-item-card__field--crafting">
              <span className="mobile-item-card__label">
                Crafting Materials:
              </span>
              <div className="mobile-item-card__value">
                <div className="recycles-container">
                  {craftingMaterials.length > 0
                    ? craftingMaterials.map(
                        ({ material, quantity, name, image }) => (
                          <ItemCell
                            key={material}
                            name={`${quantity}x ${name}`}
                            imageSrc={image}
                          />
                        ),
                      )
                    : "---"}
                </div>
              </div>
            </div>
          )}

          {SHOW_FULL_DATA ?? (
            <div className="mobile-item-card__field mobile-item-card__field--bench">
              <span className="mobile-item-card__label">Craft Bench:</span>
              <span className="mobile-item-card__value">{benchName}</span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default MobileItemRow;
