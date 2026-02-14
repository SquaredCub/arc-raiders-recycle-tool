import { memo } from "react";
import ItemCell from "../ItemCell";
import { COINS_IMAGE_URL } from "../data/itemsData";
import type { Item } from "../types";
import { DEFAULT_LANGUAGE } from "../utils/functions";
import type { CachedMaterial } from "../utils/tableCache";

interface MobileItemRowProps {
  item: Item;
  sortedMaterialsCache: Record<string, CachedMaterial[]>;
  index: number;
}

const MobileItemRow = memo(
  ({
    item,
    sortedMaterialsCache,
    index,
  }: MobileItemRowProps) => {
    const isEven = index % 2 === 0;

    // Get recycle materials from cache
    const recyclesMaterials = sortedMaterialsCache[`recycle_${item.id}`] || [];

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
        </div>
      </div>
    );
  },
);

export default MobileItemRow;
