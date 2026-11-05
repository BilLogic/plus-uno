import { createContext, useContext } from 'react';

/**
 * Whether the List and detail split holds, as the Frame's layout resolver
 * decided it (the Page's content reaches 960). A Frame with `listDetail`
 * hands it to everything inside, so the layout and the resolver that
 * collapsed the Sidebar to keep 960 never disagree. Null outside such a
 * Frame; a List and detail layout then measures its own box.
 */
export const SplitContext = createContext(null);

/** @returns {boolean | null} */
export const useSplitHolds = () => useContext(SplitContext);
