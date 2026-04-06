import { useState } from "react";
import "./App.scss";
import MapEventsPage from "./components/MapEventsPage";
import Navigation, { type NavigationPage } from "./components/Navigation";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useLanguage } from "./hooks/useLanguage";
import RecyclingTools from "./RecyclingTools";

const AppContent = () => {
  const [activePage, setActivePage] = useState<NavigationPage>("recycling");
  const { translateUI } = useLanguage();

  const onNavigate = (page: NavigationPage) => {
    setActivePage(page);
  };

  return (
    <>
      <Navigation activePage={activePage} onNavigate={onNavigate} />
      {activePage === "recycling" && <RecyclingTools />}
      {activePage === "map-events" && <MapEventsPage />}
      <ScrollToTop />
      <div id="update-note">{translateUI("general.lastUpdated")} 06/04/2026</div>
    </>
  );
};

const App = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
