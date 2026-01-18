import "./Navigation.scss";

export type NavigationPage = "recycling" | "crafts";

interface NavigationProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

const Navigation = ({ activePage, onNavigate }: NavigationProps) => {
  return (
    <nav className="navigation">
      <button
        className={`navigation__item ${
          activePage === "recycling" ? "navigation__item--active" : ""
        }`}
        onClick={() => onNavigate("recycling")}
      >
        Recycling Tool
      </button>
      <button
        className={`navigation__item ${
          activePage === "crafts" ? "navigation__item--active" : ""
        }`}
        onClick={() => onNavigate("crafts")}
      >
        Profitable Crafts
      </button>
    </nav>
  );
};

export default Navigation;
