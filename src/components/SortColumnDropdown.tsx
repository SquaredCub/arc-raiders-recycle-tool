import type { SortingState } from "@tanstack/react-table";
import { useRef, useState } from "react";
import { SORT_COLUMNS, SORT_COLUMNS_BY_ID } from "../constants/sortColumns";
import { useModalBehavior } from "../hooks/useModalBehavior";
import "./SortColumnDropdown.scss";

interface SortColumnDropdownProps {
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

const SortColumnDropdown = ({
  sorting,
  onSortingChange,
}: SortColumnDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useModalBehavior({
    isOpen,
    onClose: () => setIsOpen(false),
    modalRef: dropdownRef,
    preventBodyScroll: false,
  });

  const currentColumnId = sorting[0]?.id ?? "item";
  const currentLabel =
    SORT_COLUMNS_BY_ID[currentColumnId as keyof typeof SORT_COLUMNS_BY_ID]
      ?.label ?? "Item";

  const handleSelect = (columnId: string) => {
    const column = SORT_COLUMNS_BY_ID[columnId as keyof typeof SORT_COLUMNS_BY_ID];
    onSortingChange([{ id: columnId, desc: column.descFirst }]);
    setIsOpen(false);
  };

  return (
    <div className="sort-column-dropdown" ref={dropdownRef}>
      <button
        className="sort-column-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Sort by column"
      >
        <span className="sort-column-dropdown__label">
          Sort: {currentLabel}
        </span>
        <span
          className={`sort-column-dropdown__arrow ${isOpen ? "open" : ""}`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="sort-column-dropdown__menu">
          <div className="sort-column-dropdown__options">
            {SORT_COLUMNS.map((column) => (
              <button
                key={column.id}
                className={`sort-column-dropdown__option ${
                  column.id === currentColumnId ? "selected" : ""
                }`}
                onClick={() => handleSelect(column.id)}
                type="button"
              >
                {column.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortColumnDropdown;
