import { useRef } from "react";
import {
  FOUND_IN_LOCATIONS,
  ITEM_RARITIES,
  NEEDED_FOR_SOURCE_TYPES,
} from "../constants/filterOptions";
import { FILTERABLE_ITEM_CATEGORIES } from "../constants/itemCategories";
import { useModalBehavior } from "../hooks/useModalBehavior";
import "./FilterModal.scss";
import MultiSelectDropdown from "./MultiSelectDropdown";
import Toggle from "./Toggle";

export interface FilterSettings {
  includedCategories: Set<string>;
  includedRarities: Set<string>;
  onlyRecyclable: boolean;
  onlySalvageable: boolean;
  includedLocations: Set<string>;
  includedSourceTypes: Set<string>;
  prioritizeNameMatches: boolean;
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

  // Generic Set toggle handler
  const handleSetToggle = (
    key: "includedCategories" | "includedRarities" | "includedLocations" | "includedSourceTypes",
    value: string,
  ) => {
    const newSet = new Set(filterSettings[key]);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    onFilterChange({ ...filterSettings, [key]: newSet });
  };

  const handleSelectAll = (
    key: "includedCategories" | "includedRarities" | "includedLocations" | "includedSourceTypes",
    allOptions: string[],
  ) => {
    onFilterChange({ ...filterSettings, [key]: new Set(allOptions) });
  };

  const handleDeselectAll = (
    key: "includedCategories" | "includedRarities" | "includedLocations" | "includedSourceTypes",
  ) => {
    onFilterChange({ ...filterSettings, [key]: new Set() });
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
          <div className="filter-section">
            <MultiSelectDropdown
              options={FILTERABLE_ITEM_CATEGORIES}
              selectedOptions={filterSettings.includedCategories}
              onToggle={(v) => handleSetToggle("includedCategories", v)}
              onSelectAll={() => handleSelectAll("includedCategories", FILTERABLE_ITEM_CATEGORIES)}
              onDeselectAll={() => handleDeselectAll("includedCategories")}
              label="Item Categories"
            />
          </div>

          <div className="filter-section">
            <MultiSelectDropdown
              options={ITEM_RARITIES}
              selectedOptions={filterSettings.includedRarities}
              onToggle={(v) => handleSetToggle("includedRarities", v)}
              onSelectAll={() => handleSelectAll("includedRarities", ITEM_RARITIES)}
              onDeselectAll={() => handleDeselectAll("includedRarities")}
              label="Rarity"
            />
          </div>

          <div className="filter-section">
            <MultiSelectDropdown
              options={FOUND_IN_LOCATIONS}
              selectedOptions={filterSettings.includedLocations}
              onToggle={(v) => handleSetToggle("includedLocations", v)}
              onSelectAll={() => handleSelectAll("includedLocations", FOUND_IN_LOCATIONS)}
              onDeselectAll={() => handleDeselectAll("includedLocations")}
              label="Found In"
            />
          </div>

          <div className="filter-section">
            <MultiSelectDropdown
              options={NEEDED_FOR_SOURCE_TYPES}
              selectedOptions={filterSettings.includedSourceTypes}
              onToggle={(v) => handleSetToggle("includedSourceTypes", v)}
              onSelectAll={() => handleSelectAll("includedSourceTypes", NEEDED_FOR_SOURCE_TYPES)}
              onDeselectAll={() => handleDeselectAll("includedSourceTypes")}
              label="Needed For"
            />
          </div>

          <div className="filter-section filter-section--toggles">
            <Toggle
              checked={filterSettings.onlyRecyclable}
              onChange={(checked) =>
                onFilterChange({ ...filterSettings, onlyRecyclable: checked })
              }
              label="Has Recycle Output"
              description="Only show items that produce materials when recycled."
            />

            <Toggle
              checked={filterSettings.onlySalvageable}
              onChange={(checked) =>
                onFilterChange({ ...filterSettings, onlySalvageable: checked })
              }
              label="Has Salvage Output"
              description="Only show items that produce materials when salvaged."
            />

            <Toggle
              checked={filterSettings.prioritizeNameMatches}
              onChange={(checked) =>
                onFilterChange({ ...filterSettings, prioritizeNameMatches: checked })
              }
              label="Prioritize name matches"
              description="When searching, items matching by name appear first regardless of sort column."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
