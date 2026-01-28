/**
 * Breakpoint constants for responsive design
 * These match the values in styles/_breakpoints.scss
 *
 * IMPORTANT: Keep these values in sync with _breakpoints.scss
 */

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1140,
} as const;

/**
 * Media query strings for use with useMediaQuery hook
 */
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.mobile}px)`,
  tablet: `(min-width: ${BREAKPOINTS.mobile + 1}px) and (max-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.tablet + 1}px)`,
  tabletAndBelow: `(max-width: ${BREAKPOINTS.tablet}px)`,
  mobileAndTablet: `(max-width: ${BREAKPOINTS.tablet}px)`,
} as const;

/**
 * View modes based on screen size
 */
export const ViewMode = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
} as const;

export type ViewMode = typeof ViewMode[keyof typeof ViewMode];
