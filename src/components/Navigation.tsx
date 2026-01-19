import { useRef, useState } from "react";
import useModalBehavior from "../hooks/useModalBehavior";
import ExternalLinkIcon from "./ExternalLinkIcon";
import "./Navigation.scss";

export type NavigationPage = "recycling" | "crafts";

interface NavigationProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

const externalLinks = [
  {
    label: "Github Repository",
    href: "https://github.com/SquaredCub/arcraiders-data",
    icon: `https://github.com/favicon.ico`,
    style: { filter: "invert(1)" },
  },
  {
    label: "Maps",
    href: "https://arcraidersmaps.app/",
    icon: "https://arcraidersmaps.app/favicon/favicon-96x96.png",
  },
  {
    label: "Damage Calculator",
    href: "https://arcdamagecalculator.tiiny.site/",
    icon: "https://arcdamagecalculator.tiiny.site/favicon.ico",
    size: 20,
  },
];

const Navigation = ({ activePage, onNavigate }: NavigationProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useModalBehavior({
    isOpen: dropdownOpen,
    onClose: () => setDropdownOpen(false),
    modalRef,
    preventBodyScroll: false,
  });

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
      {/* External Links Dropdown */}
      <div className="navigation__dropdown" ref={modalRef}>
        <button
          className="navigation__item navigation__dropdown-toggle"
          onClick={() => setDropdownOpen((open) => !open)}
          aria-expanded={dropdownOpen}
          aria-label="External Links"
        >
          External Links
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transition: "transform 0.2s",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="navigation__dropdown-menu">
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="navigation__dropdown-link"
              >
                <span>{link.label}</span>
                {link.icon && (
                  <ExternalLinkIcon
                    url={link.icon}
                    alt={`${link.label} icon`}
                    size={link.size || 16}
                    style={link.style}
                  />
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
