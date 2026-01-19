import { useEffect, useRef, useState } from "react";
import "./MultiSelectDropdown.scss";

interface MultiSelectDropdownProps {
  options: string[];
  selectedOptions: Set<string>;
  onToggle: (option: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  label: string;
}

const MultiSelectDropdown = ({
  options,
  selectedOptions,
  onToggle,
  onSelectAll,
  onDeselectAll,
  label,
}: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedCount = selectedOptions.size;
  const totalCount = options.length;

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <button
        className="multi-select-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="multi-select-dropdown__label">
          {label}
          <span className="multi-select-dropdown__count">
            ({selectedCount}/{totalCount})
          </span>
        </span>
        <span className={`multi-select-dropdown__arrow ${isOpen ? "open" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="multi-select-dropdown__menu">
          <div className="multi-select-dropdown__actions">
            <button
              className="multi-select-dropdown__action-button"
              onClick={onSelectAll}
              type="button"
            >
              Select All
            </button>
            <button
              className="multi-select-dropdown__action-button"
              onClick={onDeselectAll}
              type="button"
            >
              Deselect All
            </button>
          </div>
          <div className="multi-select-dropdown__options">
            {options.map((option) => (
              <label key={option} className="multi-select-dropdown__option">
                <input
                  type="checkbox"
                  checked={selectedOptions.has(option)}
                  onChange={() => onToggle(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
