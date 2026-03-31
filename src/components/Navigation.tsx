import { useRef, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useModalBehavior } from "../hooks/useModalBehavior";
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "../localization/languageUtils";
import ExternalLinkIcon from "./ExternalLinkIcon";
import "./Navigation.scss";

export type NavigationPage = "recycling" | "map-events";

interface NavigationProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

interface ExternalLink {
  label: string;
  href: string;
  icon: string;
  className?: string;
  size?: number;
}

const communityLinks: ExternalLink[] = [
  {
    label: "Maps",
    href: "https://arcraidersmaps.app/",
    icon: "https://arcraidersmaps.app/favicon/favicon-96x96.png",
    className: "invert-in-light",
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
    className: "invert-in-dark",
  },
  {
    label: "Donate",
    href: "https://paypal.me/SquaredCub",
    icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e74c3c"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  },
];

const ExternalLinkList = ({ links }: { links: ExternalLink[] }) => (
  <>
    {links.map((link) => (
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
            className={link.className}
          />
        )}
      </a>
    ))}
  </>
);

const pageItems: { page: NavigationPage; key: "nav.recyclingTool" | "nav.mapEvents" }[] = [
  { page: "recycling", key: "nav.recyclingTool" },
  { page: "map-events", key: "nav.mapEvents" },
];

const Navigation = ({ activePage, onNavigate }: NavigationProps) => {
  const { language, setLanguage, translateUI } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLDivElement>(null);

  useModalBehavior({
    isOpen: dropdownOpen,
    onClose: () => setDropdownOpen(false),
    modalRef,
    preventBodyScroll: false,
  });

  useModalBehavior({
    isOpen: hamburgerOpen,
    onClose: () => setHamburgerOpen(false),
    modalRef: hamburgerRef,
    preventBodyScroll: false,
  });

  const handleMobileNavigate = (page: NavigationPage) => {
    onNavigate(page);
    setHamburgerOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="navigation__inner">
        {/* Desktop navigation */}
        {pageItems.map(({ page, key }) => (
          <button
            key={page}
            className={`navigation__item navigation__desktop-only ${
              activePage === page ? "navigation__item--active" : ""
            }`}
            onClick={() => onNavigate(page)}
          >
            {translateUI(key)}
          </button>
        ))}
        <div className="navigation__dropdown navigation__desktop-only" ref={modalRef}>
          <button
            className="navigation__item navigation__dropdown-toggle"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-expanded={dropdownOpen}
            aria-label={translateUI("nav.externalLinks")}
          >
            <ExternalLinkIcon className="invert-in-light" />
            <span>{translateUI("nav.externalLinks")}</span>
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
              <ExternalLinkList links={communityLinks} />
              <hr className="navigation__dropdown-divider" />
              <ExternalLinkList links={myLinks} />
            </div>
          )}
        </div>
        <select
          className="navigation__language-picker navigation__desktop-only"
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          aria-label="Language"
        >
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>

        {/* Mobile hamburger menu */}
        <div className="navigation__hamburger" ref={hamburgerRef}>
          <span className="navigation__hamburger-title">SquaredTools</span>
          <button
            className="navigation__hamburger-toggle"
            onClick={() => setHamburgerOpen((open) => !open)}
            aria-expanded={hamburgerOpen}
            aria-label={translateUI("nav.menu")}
          >
            {hamburgerOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
          {hamburgerOpen && (
            <div className="navigation__hamburger-panel">
              {pageItems.map(({ page, key }) => (
                <button
                  key={page}
                  className={`navigation__hamburger-page ${
                    activePage === page ? "navigation__hamburger-page--active" : ""
                  }`}
                  onClick={() => handleMobileNavigate(page)}
                >
                  {translateUI(key)}
                </button>
              ))}
              <hr className="navigation__dropdown-divider" />
              <select
                className="navigation__language-picker navigation__language-picker--hamburger"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                aria-label="Language"
              >
                {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
              <hr className="navigation__dropdown-divider" />
              <ExternalLinkList links={communityLinks} />
              <hr className="navigation__dropdown-divider" />
              <ExternalLinkList links={myLinks} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
