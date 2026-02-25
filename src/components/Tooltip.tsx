import { useLanguage } from "../hooks/useLanguage";
import "./Tooltip.scss";

const Tooltip = ({
  active = false,
  callback,
}: {
  active: boolean;
  callback: () => void;
}) => {
  const { translateUI } = useLanguage();
  const label = active ? translateUI("tooltip.hide") : translateUI("tooltip.show");

  return (
    <button
      className="tooltip-toggle"
      aria-label={label}
      title={label}
      onClick={callback}
    >
      <img
        src={active ? "tooltip_close.png" : "tooltip.png"}
        alt={label}
      />
    </button>
  );
};

export default Tooltip;
