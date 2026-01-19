import { useCallback, useState } from "react";
import type { FilterSettings } from "./components/FilterModal";
import FilterModal from "./components/FilterModal";
import { FILTERABLE_ITEM_CATEGORIES } from "./constants/itemCategories";
import ItemsTable from "./ItemsTable";
import SearchInput from "./SearchInput";

const RecyclingTools = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    includedCategories: new Set(FILTERABLE_ITEM_CATEGORIES),
  });
  const [itemCount, setItemCount] = useState<{
    filtered: number;
    total: number;
  } | null>(null);

  const handleFilteredCountChange = useCallback(
    (filtered: number, total: number) => {
      setItemCount({ filtered, total });
    },
    []
  );

  const openModal = useCallback(() => setIsFilterModalOpen(true), []);
  const closeModal = useCallback(() => setIsFilterModalOpen(false), []);

  return (
    <div className="recycling-tools">
      <h1>Recycling Tool</h1>
      <section id="introduction">
        <p>Welcome to the Arc Raiders Recycle Tool!</p>
        <p>
          This is a list of all the items in the game and what they recycle
          into.
        </p>
        <p>
          Search an item by name to see its recycle results or what to recycle
          to obtain it.
        </p>
      </section>
      <section id="controls">
        <div className="controls-container">
          <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <button
            className="filter-button"
            onClick={openModal}
            aria-label="Filter settings"
            title="Filter settings"
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
          {itemCount && (
            <span className="item-count">
              {itemCount.filtered} / {itemCount.total}
            </span>
          )}
        </div>
      </section>
      <section id="table">
        <ItemsTable
          searchTerm={searchTerm}
          filterSettings={filterSettings}
          onFilteredCountChange={handleFilteredCountChange}
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
