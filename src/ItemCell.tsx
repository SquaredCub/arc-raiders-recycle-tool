import { memo } from "react";
import { Item } from "./generated/types";
import { WIKI_BASE_URL } from "./utils/functions";

const ItemCell = memo(
  ({
    id,
    item,
    name,
    imageSrc,
    rarity,
    highlighted,
  }: {
    name: string;
    imageSrc: string | undefined;
    item?: Item;
    id?: string;
    rarity?: string;
    highlighted?: boolean;
  }) => {
    // Determine the URL fragment for the wiki link.
    let itemName = item?.name.en;
    if (item?.isWeapon) itemName = itemName?.split(" ")?.slice(0, -1).join(" "); // Remove trailing numeral for weapon variants (e.g., Osprey_I → Osprey)

    const wikiFragment =
      itemName
        ?.replace(/ /g, "_")
        .replace(/_Arc_/g, "_ARC_")
        .replace(/_of_/g, "_Of_") ?? "";

    return (
      <div
        className={`cell-item${highlighted ? " cell-item--highlighted" : ""}`}
      >
        <figure
          className={`cell-item__image${rarity ? ` ${rarity.toLowerCase()}` : ""}`}
        >
          {imageSrc ? <img src={imageSrc} alt={name} /> : null}
        </figure>
        <span className="cell-item__name">
          {id ? (
            <a
              href={`${WIKI_BASE_URL}${wikiFragment}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {name}
            </a>
          ) : (
            name
          )}
        </span>
      </div>
    );
  },
);

export default ItemCell;
