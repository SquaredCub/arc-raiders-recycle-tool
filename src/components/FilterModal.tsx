import { useRef } from "react";
import { FILTERABLE_ITEM_CATEGORIES } from "../constants/itemCategories";
import useModalBehavior from "../hooks/useModalBehavior";
import "./FilterModal.scss";
import MultiSelectDropdown from "./MultiSelectDropdown";

export interface FilterSettings {
  includedCategories: Set<string>;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterSettings: FilterSettings;
  onFilterChange: (settings: FilterSettings) => void;
}

const FilterModal = ({
  isOpen,
  onClose,
  filterSettings,
  onFilterChange,
}: FilterModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useModalBehavior({ isOpen, onClose, modalRef });

  const handleCategoryToggle = (category: string) => {
    // Create new Set for immutable state update (React best practice)
    const newCategories = new Set(filterSettings.includedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    onFilterChange({ ...filterSettings, includedCategories: newCategories });
  };

  const handleSelectAll = () => {
    onFilterChange({
      ...filterSettings,
      includedCategories: new Set(FILTERABLE_ITEM_CATEGORIES),
    });
  };

  const handleDeselectAll = () => {
    onFilterChange({
      ...filterSettings,
      includedCategories: new Set(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal" ref={modalRef}>
        <div className="filter-modal__header">
          <h2>Search Settings</h2>
          <button
            className="filter-modal__close-button"
            onClick={onClose}
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        <div className="filter-modal__content">
          <div className="filter-category">
            <MultiSelectDropdown
              options={FILTERABLE_ITEM_CATEGORIES}
              selectedOptions={filterSettings.includedCategories}
              onToggle={handleCategoryToggle}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              label="Item Categories"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
