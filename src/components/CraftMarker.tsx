import type { ReactNode } from "react";

// Quiet corner icon on crafting cards (styled in _table-cells.scss); the label
// is its accessible name and an instant CSS tooltip (data-tooltip): the native
// title tooltip is slow
const CraftMarker = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <span
    className="craft-usage__marker"
    data-tooltip={label}
    role="img"
    aria-label={label}
  >
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  </span>
);

export default CraftMarker;
