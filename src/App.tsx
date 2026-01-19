import { useState } from "react";
import "./App.scss";
import Navigation, { type NavigationPage } from "./components/Navigation";
import ProfitableItems from "./components/ProfitableItems";
import RecyclingTools from "./RecyclingTools";

const App = () => {
  const [activePage, setActivePage] = useState<"recycling" | "crafts">(
    "recycling",
  );

  const onNavigate = (page: NavigationPage) => {
    if (page === "github") {
      window.open(
        "https://github.com/SquaredCub/arc-raiders-recycle-tool",
        "_blank",
      );
    } else if (page === "maps") {
      window.open("https://arcraidersmaps.app/", "_blank");
    } else if (page === "damage-calculator") {
      window.open("https://arcdamagecalculator.tiiny.site/", "_blank");
    } else {
      setActivePage(page);
    }
  };

  return (
    <>
      <Navigation activePage={activePage} onNavigate={onNavigate} />
      {activePage === "recycling" && <RecyclingTools />}
      {activePage === "crafts" && <ProfitableItems />}
    </>
  );
};

export default App;
