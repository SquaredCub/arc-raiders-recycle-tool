import { memo } from "react";
import { formatMaterialName } from "../data/itemsData";
import ItemCell from "../ItemCell";
import { getImageUrl } from "../services/dataService";
import type { Item, ItemRequirementLookup } from "../types";
import { DEFAULT_LANGUAGE } from "../utils/functions";

const COINS_IMAGE_URL = getImageUrl("images/coins.png");

interface MobileItemRowProps {
  item: Item;
  itemRequirements: ItemRequirementLookup;
  benchNameLookup: Record<string, string>;
  index: number;
}

const MobileItemRow = memo(
  ({ item, itemRequirements, benchNameLookup, index }: MobileItemRowProps) => {
    const isEven = index % 2 === 0;

    // Get recycle materials
    const recyclesMaterials = item.recyclesInto
      ? Object.entries(item.recyclesInto)
          .map(([materialId, quantity]) => ({
            name: formatMaterialName(materialId),
            quantity,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

    // Get crafting materials
    const craftingMaterials = item.recipe
      ? Object.entries(item.recipe)
          .map(([materialId, quantity]) => ({
            name: formatMaterialName(materialId),
            quantity,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

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
                  ? recyclesMaterials.map((mat, idx) => (
                      <div key={idx}>
                        {mat.quantity}x {mat.name}
                      </div>
                    ))
                  : "---"}
              </div>
            </div>
          </div>

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

          <div className="mobile-item-card__field mobile-item-card__field--crafting">
            <span className="mobile-item-card__label">Crafting Materials:</span>
            <div className="mobile-item-card__value">
              <div className="recycles-container">
                {craftingMaterials.length > 0
                  ? craftingMaterials.map((mat, idx) => (
                      <div key={idx}>
                        {mat.quantity}x {mat.name}
                      </div>
                    ))
                  : "---"}
              </div>
            </div>
          </div>

          <div className="mobile-item-card__field mobile-item-card__field--bench">
            <span className="mobile-item-card__label">Craft Bench:</span>
            <span className="mobile-item-card__value">{benchName}</span>
          </div>
        </div>
      </div>
    );
  },
);

export default MobileItemRow;
