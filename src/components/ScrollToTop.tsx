import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import "./ScrollToTop.scss";

const MAX_SCROLL_ATTEMPTS = 10;
const SCROLL_SETTLE_MS = 150;

// Resolves once no scroll event has fired for SCROLL_SETTLE_MS
// (works where the scrollend event isn't supported)
const waitForScrollToSettle = (): Promise<void> =>
  new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("scroll", onScroll);
      resolve();
    };
    let timer = setTimeout(done, SCROLL_SETTLE_MS);
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(done, SCROLL_SETTLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  });

const ScrollToTop = () => {
  const { translateUI } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Rows the user jumped past are only measured as the smooth scroll reaches
  // them, and the virtualizer's scroll correction cancels the animation midway.
  // So once scrolling settles, scroll again until the top is reached, unless
  // the user takes over in the meantime.
  const handleClick = () => {
    const userInputEvents = ["wheel", "touchstart", "keydown", "mousedown"];
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    userInputEvents.forEach((type) =>
      window.addEventListener(type, cancel, { passive: true }),
    );
    const cleanup = () =>
      userInputEvents.forEach((type) => window.removeEventListener(type, cancel));

    let attempts = 0;
    const scrollUntilTop = () => {
      if (cancelled || window.scrollY === 0 || attempts++ >= MAX_SCROLL_ATTEMPTS) {
        cleanup();
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      waitForScrollToSettle().then(scrollUntilTop);
    };
    scrollUntilTop();
  };

  return (
    <button
      className={`scroll-to-top${visible ? " scroll-to-top--visible" : ""}`}
      onClick={handleClick}
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
