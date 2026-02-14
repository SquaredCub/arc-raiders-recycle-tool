import { useRef, useState } from "react";
import useModalBehavior from "../hooks/useModalBehavior";
import ExternalLinkIcon from "./ExternalLinkIcon";
import "./Navigation.scss";

export type NavigationPage = "recycling" | "crafts";

interface NavigationProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

interface ExternalLink {
  label: string;
  href: string;
  icon: string;
  classname?: string;
  size?: number;
}

const communityLinks: ExternalLink[] = [
  {
    label: "Maps",
    href: "https://arcraidersmaps.app/",
    icon: "https://arcraidersmaps.app/favicon/favicon-96x96.png",
    classname: "invert-in-light",
  },
  {
    label: "Map Selector",
    href: "https://wheelofnames.com/stu-fhg",
    icon: "https://wheelofnames.com/images/logo-dark-background-38.png",
  },
  {
    label: "Damage Calculator",
    href: "https://arcdamagecalculator.tiiny.site/",
    icon: "https://arcdamagecalculator.tiiny.site/favicon.ico",
    size: 20,
  },
  {
    label: "Tracker",
    href: "https://arctracker.io/",
    icon: "https://arctracker.io/favicon.ico",
  },
];

const myLinks: ExternalLink[] = [
  {
    label: "Github Repository",
    href: "https://github.com/SquaredCub/arc-raiders-recycle-tool",
    icon: `https://github.com/favicon.ico`,
    classname: "invert-in-dark",
  },
  {
    label: "Donate",
    href: "https://paypal.me/SquaredCub",
    icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e74c3c"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
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
          <ExternalLinkIcon classname="invert-in-light" />
          <span>External Links</span>
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
            {communityLinks.map((link) => (
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
                    classname={link.classname}
                  />
                )}
              </a>
            ))}
            <hr className="navigation__dropdown-divider" />
            {myLinks.map((link) => (
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
                    classname={link.classname}
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
