import { useCallback, useMemo, useRef } from "react";
import {
  FOUND_IN_LOCATIONS,
  ITEM_RARITIES,
  NEEDED_FOR_SOURCE_TYPES,
} from "../constants/filterOptions";
import { FILTERABLE_ITEM_CATEGORIES } from "../constants/itemCategories";
import { getExpeditionProjects, getProjectDisplayName } from "../data/requirementsData";
import { useData } from "../hooks/useData";
import { useLanguage } from "../hooks/useLanguage";
import { useModalBehavior } from "../hooks/useModalBehavior";
import type { UIStringKey } from "../localization/uiStrings";
import "./FilterModal.scss";
import type { NavigationPage } from "./Navigation";
import MultiSelectDropdown from "./MultiSelectDropdown";
import Toggle from "./Toggle";

export interface FilterSettings {
  includedCategories: Set<string>;
  includedRarities: Set<string>;
  onlyRecyclable: boolean;
  onlySalvageable: boolean;
  includedLocations: Set<string>;
  includedSourceTypes: Set<string>;
  includedExpeditions: Set<string>;
  prioritizeNameMatches: boolean;
}

type SetFilterKey =
  | "includedCategories"
  | "includedRarities"
  | "includedLocations"
  | "includedSourceTypes"
  | "includedExpeditions";

interface FilterModalProps {
  page: NavigationPage;
  isOpen: boolean;
  onClose: () => void;
  filterSettings: FilterSettings;
  onFilterChange: (settings: FilterSettings) => void;
}

const FilterModal = ({
  page,
  isOpen,
  onClose,
  filterSettings,
  onFilterChange,
}: FilterModalProps) => {
  const { language, translateUI } = useLanguage();
  const { projects } = useData();
  const modalRef = useRef<HTMLDivElement>(null);

  const expeditions = useMemo(() => getExpeditionProjects(projects), [projects]);
  const expeditionIds = useMemo(() => expeditions.map((project) => project.id), [expeditions]);

  const translateExpedition = useCallback(
    (id: string) => {
      const project = expeditions.find((expedition) => expedition.id === id);
      return project
        ? getProjectDisplayName(project, projects, language, translateUI("requirement.expedition"))
        : id;
    },
    [expeditions, projects, language, translateUI],
  );

  useModalBehavior({ isOpen, onClose, modalRef });

  // Translation helpers for filter option display labels
  const translateCategory = useCallback(
    (option: string) => {
      const key = `category.${option.toLowerCase().replace(/ /g, "")}` as UIStringKey;
      const translated = translateUI(key);
      return translated === key ? option : translated;
    },
    [translateUI],
  );

  const translateRarity = useCallback(
    (option: string) => {
      const key = `rarity.${option.toLowerCase()}` as UIStringKey;
      const translated = translateUI(key);
      return translated === key ? option : translated;
    },
    [translateUI],
  );

  const translateLocation = useCallback(
    (option: string) => {
      const key = `location.${option.toLowerCase().replace(/ /g, "")}` as UIStringKey;
      const translated = translateUI(key);
      return translated === key ? option : translated;
    },
    [translateUI],
  );

  const translateSourceType = useCallback(
    (option: string) => {
      const keyMap: Record<string, UIStringKey> = {
        Outpost: "source.outpost",
        Quest: "source.quest",
        Project: "source.project",
        "Not Needed": "source.notNeeded",
      };
      const key = keyMap[option];
      return key ? translateUI(key) : option;
    },
    [translateUI],
  );

  // Generic Set toggle handler
  const handleSetToggle = (
    key: SetFilterKey,
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
    key: SetFilterKey,
    allOptions: string[],
  ) => {
    onFilterChange({ ...filterSettings, [key]: new Set(allOptions) });
  };

  const handleDeselectAll = (
    key: SetFilterKey,
  ) => {
    onFilterChange({ ...filterSettings, [key]: new Set() });
  };

  if (!isOpen) return null;

  // Found in, needed for, expeditions and recycle/salvage outputs are about
  // recycling; the crafting page ignores them (see ItemsTable)
  const isRecycling = page === "recycling";

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal" ref={modalRef}>
        <div className="filter-modal__header">
          <h2>{translateUI("filter.searchSettings")}</h2>
          <button
            className="filter-modal__close-button"
            onClick={onClose}
            aria-label={translateUI("general.close")}
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
              label={translateUI("filter.itemCategories")}
              translateOption={translateCategory}
            />
          </div>

          <div className="filter-section">
            <MultiSelectDropdown
              options={ITEM_RARITIES}
              selectedOptions={filterSettings.includedRarities}
              onToggle={(v) => handleSetToggle("includedRarities", v)}
              onSelectAll={() => handleSelectAll("includedRarities", ITEM_RARITIES)}
              onDeselectAll={() => handleDeselectAll("includedRarities")}
              label={translateUI("filter.rarity")}
              translateOption={translateRarity}
            />
          </div>

          {isRecycling && (
            <>
              <div className="filter-section">
                <MultiSelectDropdown
                  options={FOUND_IN_LOCATIONS}
                  selectedOptions={filterSettings.includedLocations}
                  onToggle={(v) => handleSetToggle("includedLocations", v)}
                  onSelectAll={() => handleSelectAll("includedLocations", FOUND_IN_LOCATIONS)}
                  onDeselectAll={() => handleDeselectAll("includedLocations")}
                  label={translateUI("filter.foundIn")}
                  translateOption={translateLocation}
                />
              </div>

              <div className="filter-section">
                <MultiSelectDropdown
                  options={NEEDED_FOR_SOURCE_TYPES}
                  selectedOptions={filterSettings.includedSourceTypes}
                  onToggle={(v) => handleSetToggle("includedSourceTypes", v)}
                  onSelectAll={() => handleSelectAll("includedSourceTypes", NEEDED_FOR_SOURCE_TYPES)}
                  onDeselectAll={() => handleDeselectAll("includedSourceTypes")}
                  label={translateUI("filter.neededFor")}
                  translateOption={translateSourceType}
                />
              </div>

              <div className="filter-section">
                <MultiSelectDropdown
                  options={expeditionIds}
                  selectedOptions={filterSettings.includedExpeditions}
                  onToggle={(v) => handleSetToggle("includedExpeditions", v)}
                  onSelectAll={() => handleSelectAll("includedExpeditions", expeditionIds)}
                  onDeselectAll={() => handleDeselectAll("includedExpeditions")}
                  label={translateUI("filter.expeditions")}
                  translateOption={translateExpedition}
                />
              </div>
            </>
          )}

          <div className="filter-section filter-section--toggles">
            {isRecycling && (
              <>
                <Toggle
                  checked={filterSettings.onlyRecyclable}
                  onChange={(checked) =>
                    onFilterChange({ ...filterSettings, onlyRecyclable: checked })
                  }
                  label={translateUI("filter.hasRecycleOutput")}
                  description={translateUI("filter.hasRecycleDesc")}
                />

                <Toggle
                  checked={filterSettings.onlySalvageable}
                  onChange={(checked) =>
                    onFilterChange({ ...filterSettings, onlySalvageable: checked })
                  }
                  label={translateUI("filter.hasSalvageOutput")}
                  description={translateUI("filter.hasSalvageDesc")}
                />
              </>
            )}

            <Toggle
              checked={filterSettings.prioritizeNameMatches}
              onChange={(checked) =>
                onFilterChange({ ...filterSettings, prioritizeNameMatches: checked })
              }
              label={translateUI("filter.prioritizeNameMatches")}
              description={translateUI("filter.prioritizeNameDesc")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
