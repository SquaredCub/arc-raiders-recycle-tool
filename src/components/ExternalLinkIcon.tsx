const ExternalLinkIcon = ({
  url,
  alt,
  size,
  classname,
}: {
  url?: string;
  alt?: string;
  size?: number;
  classname?: string;
}) => {
  return (
    <img
      src={url || `${import.meta.env.BASE_URL}external-link.svg`}
      alt={alt || "External link"}
      width={size || 16}
      height={size || 16}
      className={`external-link-icon ${classname ?? ""}`}
    />
  );
};

export default ExternalLinkIcon;
