import { createContext, useContext } from 'react';

/**
 * The heading level of the nearest page, section or dialog.
 *
 * Heading tags follow nesting: one h1 per page, sections h2, subsections h3,
 * and a container's title one level below the section it sits in. A dialog is
 * its own page, so its title is an h1 and a section inside it is an h2.
 *
 * The page and a dialog are level 1 — their title is the h1 — and that is the
 * default, so a section with no page around it (a story canvas) still opens at
 * h2. Each section provides its own level to what it holds.
 */
export const HeadingLevelContext = createContext(1);

/** The level of the nearest page, section or dialog: 1 for a page or a dialog. */
export const useHeadingLevel = () => useContext(HeadingLevelContext);

/** The tag for a heading level, held to h1 … h6. */
export const headingTag = (level) => `h${Math.min(Math.max(Math.round(level), 1), 6)}`;
