const ExternalLinkIcon = ({
  url,
  alt,
  size,
  style,
}: {
  url?: string;
  alt?: string;
  size?: number;
  style?: React.CSSProperties;
}) => {
  return (
    <img
      src={url || `${import.meta.env.BASE_URL}external-link.svg`}
      alt={alt || "External link"}
      width={size || 12}
      height={size || 12}
      style={style || { marginLeft: "0.2em" }}
    />
  );
};

export default ExternalLinkIcon;
