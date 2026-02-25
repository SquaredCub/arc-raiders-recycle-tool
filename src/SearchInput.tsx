import { memo, useState } from "react";
import { useLanguage } from "./hooks/useLanguage";

const SearchInput = memo(({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) => {
  const { translateUI } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={"search-input" + (isFocused ? " search-input--focused" : "")}
    >
      <input
        type="text"
        placeholder={translateUI("search.placeholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <button
        className="search-input__clear-button"
        onClick={() => setSearchTerm("")}
      >
        &#x2715;
      </button>
    </div>
  );
});

export default SearchInput;
