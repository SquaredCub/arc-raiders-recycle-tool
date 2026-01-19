import ExternalLinkIcon from "./ExternalLinkIcon";
import "./Navigation.scss";

export type NavigationPage =
  | "recycling"
  | "crafts"
  | "github"
  | "maps"
  | "damage-calculator";

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
      <button
        className={`navigation__item`}
        onClick={() => onNavigate("github")}
      >
        <ExternalLinkIcon
          url={"https://github.com/favicon.ico"}
          alt="Github Icon"
          style={{ marginRight: "0.3em", filter: "invert(1)" }}
        />
        <span>Github Repository</span>
        <ExternalLinkIcon />
      </button>
      <button className={`navigation__item`} onClick={() => onNavigate("maps")}>
        <ExternalLinkIcon
          url={"https://arcraidersmaps.app/favicon/favicon-96x96.png"}
          alt="Arc Raiders Maps icon"
          size={10}
          style={{ marginRight: "0.2rem" }}
        />
        <span>Maps</span>
        <ExternalLinkIcon />
      </button>
      <button
        className={`navigation__item`}
        onClick={() => onNavigate("damage-calculator")}
      >
        <ExternalLinkIcon
          url={"https://arcdamagecalculator.tiiny.site/favicon.ico"}
          alt="Damage Calculator icon"
          size={16}
          style={{ marginBottom: "-0.2rem" }}
        />
        <span>Damage Calculator</span>
        <ExternalLinkIcon />
      </button>
    </nav>
  );
};

export default Navigation;
