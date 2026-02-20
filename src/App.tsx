import { useState } from "react";
import "./App.scss";
import Navigation, { type NavigationPage } from "./components/Navigation";
import ProfitableItems from "./components/ProfitableItems";
import ScrollToTop from "./components/ScrollToTop";
import RecyclingTools from "./RecyclingTools";

const App = () => {
  const [activePage, setActivePage] = useState<NavigationPage>("recycling");

  const onNavigate = (page: NavigationPage) => {
    setActivePage(page);
  };

  return (
    <>
      <Navigation activePage={activePage} onNavigate={onNavigate} />
      {activePage === "recycling" && <RecyclingTools />}
      {activePage === "crafts" && <ProfitableItems />}
      <ScrollToTop />
      <div id="update-note">Last updated on 20/02/2026</div>
    </>
  );
};

export default App;
