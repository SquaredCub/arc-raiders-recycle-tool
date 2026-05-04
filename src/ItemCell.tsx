import { memo } from "react";
import { capitalizeItemId, WIKI_BASE_URL } from "./utils/functions";

const ItemCell = memo(({
  id,
  name,
  imageSrc,
  rarity,
  highlighted,
}: {
  name: string;
  imageSrc: string | undefined;
  id?: string;
  rarity?: string;
  highlighted?: boolean;
}) => {
  // Determine the URL fragment for the wiki link.
  // Ship model items have quoted names that need URL encoding.
  const wikiFragment = id?.endsWith('_ship_model')
    ? name.replace(/ /g, "_")
        .replace(/"/g, "%22")
        .replace(/'/g, "%27")
    : capitalizeItemId(id) ?? "";

  return (
    <div className={`cell-item${highlighted ? " cell-item--highlighted" : ""}`}>
      <figure className={`cell-item__image${rarity ? ` ${rarity.toLowerCase()}` : ""}`}>
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
});

export default ItemCell;
