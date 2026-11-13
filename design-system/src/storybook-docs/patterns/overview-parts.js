/**
 * Pieces of the Patterns overview. Each group card shows one of its patterns'
 * own figures, laid out at one stage and cropped to one ratio, so the four
 * cards match side by side. The page and its card test read these values, so
 * they cannot drift apart.
 */

/** The width every group card's figure lays out at, in px: the stage the pattern pages draw their page-wide figures at. */
export const GROUP_STAGE = 1024; // docs-literal

/** The ratio every group card's figure is cropped to, so the four boxes share one height: the in-app figures the cards show are drawn about this wide. */
export const GROUP_THUMB_RATIO = '12 / 5';
