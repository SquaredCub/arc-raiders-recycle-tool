import { capitalizeItemId, WIKI_BASE_URL } from "./utils/functions";

const ItemCell = ({
  id,
  name,
  imageSrc,
}: {
  name: string;
  imageSrc: string | undefined;
  id?: string;
}) => {
  return (
    <div className="cell-item">
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
      <figure className="cell-item__image">
        {imageSrc ? <img src={imageSrc} alt={name} /> : null}
      </figure>
    </div>
  );
};

export default ItemCell;
