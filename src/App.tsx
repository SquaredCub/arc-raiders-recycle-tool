import { useState } from "react";
import "./App.scss";
import ItemsTable from "./ItemsTable";
import SearchInput from "./SearchInput";

function App() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <h1>Arc Raiders Recycle Tool</h1>
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
    </>
  );
}

export default App;
