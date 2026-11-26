import { createContext, useContext } from 'react';

/**
 * The page width a Frame hands everything inside it, overlays included, so a
 * component takes its narrow form from the page rather than from its own box.
 *
 * - `width`: the Frame's own width, from its `useOwnWidth` measurement.
 * - `narrow`: true under the Frame's full-width breakpoint
 *   (`FRAME_LAYOUT.fullWidthBelow`, 768).
 *
 * Null outside a Frame, where the page counts as wide. A story stages a
 * narrow page with a Frame at narrow width, or with
 * `<PageWidthContext.Provider value={{ narrow: true }}>`.
 */
export const PageWidthContext = createContext(null);

/** @returns {{ width?: number, narrow: boolean } | null} */
export const usePageWidth = () => useContext(PageWidthContext);

/** Whether the page is narrow (under 768). False outside a Frame. */
export const usePageNarrow = () => Boolean(useContext(PageWidthContext)?.narrow);
