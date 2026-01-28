import { MEDIA_QUERIES, ViewMode } from "../constants/breakpoints";
import { useMediaQuery } from "./useMediaQuery";

/**
 * Hook to determine the current view mode based on screen size
 * @returns ViewMode enum (MOBILE, TABLET, or DESKTOP)
 */
export const useViewMode = (): ViewMode => {
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const isTablet = useMediaQuery(MEDIA_QUERIES.tablet);

  if (isMobile) {
    return ViewMode.MOBILE;
  }

  if (isTablet) {
    return ViewMode.TABLET;
  }

  return ViewMode.DESKTOP;
};
