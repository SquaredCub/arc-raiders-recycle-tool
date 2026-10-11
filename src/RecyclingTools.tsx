import type { SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import type { FilterSettings } from "./components/FilterModal";
import FilterModal from "./components/FilterModal";
import SortColumnDropdown from "./components/SortColumnDropdown";
import Tooltip from "./components/Tooltip";
import {
  FOUND_IN_LOCATIONS,
  ITEM_RARITIES,
  NEEDED_FOR_SOURCE_TYPES,
} from "./constants/filterOptions";
import { FILTERABLE_ITEM_CATEGORIES } from "./constants/itemCategories";
import { getExpeditionProjects } from "./data/requirementsData";
import type { Project } from "./generated/types";
import { useData } from "./hooks/useData";
import { useDebounce } from "./hooks/useDebounce";
import { useLanguage } from "./hooks/useLanguage";
import ItemsTable from "./ItemsTable";
import SearchInput from "./SearchInput";

// Expeditions the user unticked, remembered across visits. Stored as the hidden
// ids so that newly released expeditions start out included.
const HIDDEN_EXPEDITIONS_KEY = "hiddenExpeditions";

const loadIncludedExpeditions = (projects: Project[]): Set<string> => {
  let hidden: string[] = [];
  try {
    hidden = JSON.parse(localStorage.getItem(HIDDEN_EXPEDITIONS_KEY) ?? "[]");
  } catch {
    // Storage unavailable or corrupt: include every expedition
  }
  return new Set(
    getExpeditionProjects(projects)
      .map((project) => project.id)
      .filter((id) => !hidden.includes(id)),
  );
};

const RecyclingTools = () => {
  const { translateUI } = useLanguage();
  const { projects } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [showIntroduction, setShowIntroduction] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(() => ({
    includedCategories: new Set(FILTERABLE_ITEM_CATEGORIES),
    includedRarities: new Set(ITEM_RARITIES),
    onlyRecyclable: false,
    onlySalvageable: false,
    includedLocations: new Set(FOUND_IN_LOCATIONS),
    includedSourceTypes: new Set(NEEDED_FOR_SOURCE_TYPES),
    includedExpeditions: loadIncludedExpeditions(projects),
    prioritizeNameMatches: true,
  }));

  useEffect(() => {
    const hidden = getExpeditionProjects(projects)
      .map((project) => project.id)
      .filter((id) => !filterSettings.includedExpeditions.has(id));
    try {
      localStorage.setItem(HIDDEN_EXPEDITIONS_KEY, JSON.stringify(hidden));
    } catch {
      // Storage unavailable (private mode): the choice lasts for this visit only
    }
  }, [projects, filterSettings.includedExpeditions]);
  const [itemCount, setItemCount] = useState<{
    filtered: number;
    total: number;
  } | null>(null);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "item", desc: false },
  ]);

  const handleFilteredCountChange = useCallback(
    (filtered: number, total: number) => {
      setItemCount({ filtered, total });
    },
    [],
  );

  const openModal = useCallback(() => setIsFilterModalOpen(true), []);
  const closeModal = useCallback(() => setIsFilterModalOpen(false), []);

  const toggleSortDirection = useCallback(() => {
    setSorting((prev) => [{ ...prev[0], desc: !prev[0].desc }]);
  }, []);

  return (
    <div className="recycling-tools">
      <h1>
        {translateUI("recycling.title")}{" "}
        <Tooltip
          active={showIntroduction}
          callback={() => setShowIntroduction((prev) => !prev)}
        />
      </h1>
      <section id="introduction" className={showIntroduction ? "visible" : ""}>
        <div>
          <p>{translateUI("recycling.intro.p1")}</p>
          <p>{translateUI("recycling.intro.p2")}</p>
          <p>{translateUI("recycling.intro.p3")}</p>
          <p>{translateUI("recycling.intro.p4")}</p>
        </div>
      </section>
      <section id="controlsSection">
        <div className="controls-container">
          <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <button
            className="filter-button"
            onClick={openModal}
            aria-label={translateUI("recycling.filterSettings")}
            title={translateUI("recycling.filterSettings")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
          <SortColumnDropdown sorting={sorting} onSortingChange={setSorting} />
          <button
            className="sort-direction-button"
            onClick={toggleSortDirection}
            aria-label={
              sorting[0]?.desc
                ? translateUI("sort.descending")
                : translateUI("sort.ascending")
            }
            title={
              sorting[0]?.desc
                ? translateUI("sort.descending")
                : translateUI("sort.ascending")
            }
            type="button"
          >
            {sorting[0]?.desc ? "🔽" : "🔼"}
          </button>
          {itemCount && (
            <span className="item-count">
              {itemCount.filtered} / {itemCount.total}
            </span>
          )}
        </div>
      </section>
      <section id="tableSection">
        <ItemsTable
          searchTerm={debouncedSearchTerm}
          filterSettings={filterSettings}
          sorting={sorting}
          onSortingChange={setSorting}
          onFilteredCountChange={handleFilteredCountChange}
          onSearchTermChange={setSearchTerm}
        />
      </section>
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={closeModal}
        filterSettings={filterSettings}
        onFilterChange={setFilterSettings}
      />
    </div>
  );
};

export default RecyclingTools;
