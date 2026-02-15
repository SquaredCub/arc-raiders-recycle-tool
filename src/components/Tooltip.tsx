import "./Tooltip.scss";

const Tooltip = ({
  active = false,
  callback,
}: {
  active: boolean;
  callback: () => void;
}) => {
  return (
    <button
      className="tooltip-toggle"
      aria-label={active ? "Hide tooltip" : "Show tooltip"}
      title={active ? "Hide tooltip" : "Show tooltip"}
      onClick={callback}
    >
      <img
        src={active ? "tooltip_close.png" : "tooltip.png"}
        alt={active ? "Hide tooltip" : "Show tooltip"}
      />
    </button>
  );
};

export default Tooltip;
