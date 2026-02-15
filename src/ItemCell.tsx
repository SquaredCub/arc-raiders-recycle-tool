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
  return (
    <div className={`cell-item${highlighted ? " cell-item--highlighted" : ""}`}>
      <figure className={`cell-item__image${rarity ? ` ${rarity.toLowerCase()}` : ""}`}>
        {imageSrc ? <img src={imageSrc} alt={name} /> : null}
      </figure>
      <span className="cell-item__name">
        {id ? (
          <a
            href={`${WIKI_BASE_URL}${capitalizeItemId(id)}`}
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
