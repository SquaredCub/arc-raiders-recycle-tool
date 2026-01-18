import { useState } from "react";
import ItemsTable from "./ItemsTable";
import SearchInput from "./SearchInput";

const RecyclingTools = () => {
  const [searchTerm, setSearchTerm] = useState("");

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
        <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </section>
      <section id="table">
        <ItemsTable searchTerm={searchTerm} />
      </section>
    </div>
  );
};

export default RecyclingTools;
