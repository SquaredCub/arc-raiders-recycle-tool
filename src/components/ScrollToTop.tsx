import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import "./ScrollToTop.scss";

interface ScrollToTopProps {
  // Performs the scroll. The table passes its virtualizer's smooth scroll,
  // which suppresses row-measurement scroll corrections that would otherwise
  // cancel a plain window.scrollTo animation midway.
  onScrollToTop: () => void;
}

const ScrollToTop = ({ onScrollToTop }: ScrollToTopProps) => {
  const { translateUI } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      className={`scroll-to-top${visible ? " scroll-to-top--visible" : ""}`}
      onClick={onScrollToTop}
      aria-label={translateUI("general.scrollToTop")}
      title={translateUI("general.scrollToTop")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};

export default ScrollToTop;
