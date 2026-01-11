const ItemCell = ({
  name,
  imageSrc,
}: {
  name: string;
  imageSrc: string | undefined;
}) => {
  return (
    <div className="cell-item">
      <span className="cell-item__name">{name}</span>
      <figure className="cell-item__image">
        {imageSrc ? <img src={imageSrc} alt={name} /> : null}
      </figure>
    </div>
  );
};

export default ItemCell;
