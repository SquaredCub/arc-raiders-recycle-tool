import { useState } from "react";
import "./App.scss";
import Navigation from "./components/Navigation";
import ProfitableItems from "./components/ProfitableItems";
import RecyclingTools from "./RecyclingTools";

function App() {
  const [activePage, setActivePage] = useState<"recycling" | "crafts">(
    "recycling"
  );

  const onNavigate = (page: "recycling" | "crafts") => {
    setActivePage(page);
  };

  return (
    <>
      <Navigation activePage={activePage} onNavigate={onNavigate} />
      {activePage === "recycling" && <RecyclingTools />}
      {activePage === "crafts" && <ProfitableItems />}
    </>
  );
}

export default App;
