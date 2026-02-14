const ExternalLinkIcon = ({
  url,
  alt,
  size,
  className,
}: {
  url?: string;
  alt?: string;
  size?: number;
  className?: string;
}) => {
  return (
    <img
      src={url || `${import.meta.env.BASE_URL}external-link.svg`}
      alt={alt || "External link"}
      width={size || 16}
      height={size || 16}
      className={`external-link-icon ${className ?? ""}`}
    />
  );
};

export default ExternalLinkIcon;
