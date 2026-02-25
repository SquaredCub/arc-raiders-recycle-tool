import { useMemo } from "react";
import { COINS_IMAGE_URL, getItemImage } from "../data/itemsData";
import { useData } from "../hooks/useData";
import { useLanguage } from "../hooks/useLanguage";
import ItemCell from "../ItemCell";
import type { Item } from "../generated/types";
import { getLocalizedText } from "../localization/languageUtils";
import "./ProfitableItems.scss";

interface CraftingProfit {
  item: Item;
  craftQuantity: number;
  totalOutputValue: number;
  recipe: {
    item: Item;
    quantity: number;
    totalValue: number;
  }[];
  totalInputCost: number;
  profit: number;
  profitMargin: number;
}

/**
 * Calculate the profit for crafting a specific item
 */
const calculateCraftingProfit = (
  item: Item,
  allItems: Map<string, Item>,
): CraftingProfit | null => {
  // Check if item is craftable (has recipe or craftBench)
  if (!item.recipe && !item.craftBench) {
    return null;
  }

  // If no recipe, cannot calculate profit
  if (!item.recipe) {
    return null;
  }

  // Default craft quantity is 1 if not specified
  const craftQuantity = item.craftQuantity ?? 1;

  // Calculate total output value
  const totalOutputValue = (item.value ?? 0) * craftQuantity;

  // Calculate total input cost
  let totalInputCost = 0;
  const recipeDetails: CraftingProfit["recipe"] = [];

  for (const [materialId, quantity] of Object.entries(item.recipe)) {
    const material = allItems.get(materialId);

    if (!material) {
      console.warn(`Material ${materialId} not found for recipe of ${item.id}`);
      return null;
    }

    const materialTotalValue = (material.value ?? 0) * quantity;
    totalInputCost += materialTotalValue;

    recipeDetails.push({
      item: material,
      quantity,
      totalValue: materialTotalValue,
    });
  }

  // Calculate profit
  const profit = totalOutputValue - totalInputCost;
  const profitMargin = (profit / totalInputCost) * 100;

  return {
    item,
    craftQuantity,
    totalOutputValue,
    recipe: recipeDetails,
    totalInputCost,
    profit,
    profitMargin,
  };
};

const ProfitableItems = () => {
  const { items } = useData();
  const { language, translateUI } = useLanguage();

  // Create a map for quick lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  // Calculate profitable items
  const profitableItems = useMemo(() => {
    const profitable: CraftingProfit[] = [];

    for (const item of items) {
      const profitData = calculateCraftingProfit(item, itemsMap);

      if (profitData && profitData.profit > 0) {
        profitable.push(profitData);
      }
    }

    // Sort by profit (highest first)
    profitable.sort((a, b) => b.profit - a.profit);

    return profitable;
  }, [items, itemsMap]);

  if (profitableItems.length === 0) {
    return (
      <div className="profitable-items">
        <p className="no-results">{translateUI("crafts.noResults")}</p>
      </div>
    );
  }

  return (
    <div className="profitable-items">
      <h1>{translateUI("crafts.title")}</h1>
      <p className="description">
        {translateUI("crafts.description")}
      </p>

      <div className="profitable-list">
        {profitableItems.map((profitData) => {
          const item = profitData.item;
          const imageSrc = getItemImage(item);

          return (
            <div key={item.id} className="profitable-card">
              <div className="profitable-card__header">
                <ItemCell
                  id={item.id}
                  name={getLocalizedText(item.name, language)}
                  imageSrc={imageSrc}
                />
                <div className="profitable-card__profit">
                  <span className="profit-label">{translateUI("crafts.profit")}</span>
                  <div className="profit-value">
                    <span className="profit-amount">
                      +{profitData.profit.toLocaleString()}
                    </span>
                    <img
                      src={COINS_IMAGE_URL}
                      alt="Coins"
                      className="value-coin-icon"
                    />
                  </div>
                  <span className="profit-margin">
                    ({profitData.profitMargin.toFixed(1)}% {translateUI("crafts.margin")})
                  </span>
                </div>
              </div>

              <div className="profitable-card__details">
                <div className="craft-output">
                  <h4>{translateUI("crafts.output")}</h4>
                  <div className="output-info">
                    <span>
                      {profitData.craftQuantity}x {getLocalizedText(item.name, language)}
                    </span>
                    <div className="value-display">
                      <span>
                        {profitData.totalOutputValue.toLocaleString()}
                      </span>
                      <img
                        src={COINS_IMAGE_URL}
                        alt="Coins"
                        className="value-coin-icon"
                      />
                    </div>
                  </div>
                </div>

                <div className="craft-recipe">
                  <h4>{translateUI("crafts.recipeMaterials")}</h4>
                  <div className="recipe-list">
                    {profitData.recipe.map((ingredient) => {
                      const ingredientImage = getItemImage(ingredient.item);
                      return (
                        <div key={ingredient.item.id} className="recipe-item">
                          <ItemCell
                            id={ingredient.item.id}
                            name={`${ingredient.quantity}x ${getLocalizedText(ingredient.item.name, language)}`}
                            imageSrc={ingredientImage}
                          />
                          <div className="ingredient-cost">
                            <span>
                              {ingredient.totalValue.toLocaleString()}
                            </span>
                            <img
                              src={COINS_IMAGE_URL}
                              alt="Coins"
                              className="value-coin-icon"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="total-cost">
                    <span>{translateUI("crafts.totalCost")}</span>
                    <div className="value-display">
                      <span>{profitData.totalInputCost.toLocaleString()}</span>
                      <img
                        src={COINS_IMAGE_URL}
                        alt="Coins"
                        className="value-coin-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="profitable-summary">
        <p>
          {translateUI("crafts.found")} <strong>{profitableItems.length}</strong>{" "}
          {profitableItems.length === 1
            ? translateUI("crafts.foundRecipe")
            : translateUI("crafts.foundRecipes")}
        </p>
      </div>
    </div>
  );
};

export default ProfitableItems;
