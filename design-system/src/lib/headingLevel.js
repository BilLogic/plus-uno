import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

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

/**
 * Sets the heading level for a subtree. With no `value`, nests one level below
 * its own ambient level, so a section inside a section keeps counting down;
 * `value` resets the level outright, for content outside the normal flow (a
 * dialog, a portal) that does not inherit its surrounding page's level.
 */
export const HeadingContextProvider = ({ value, children }) => {
    const ambient = useHeadingLevel();
    return React.createElement(HeadingLevelContext.Provider, { value: value ?? ambient + 1 }, children);
};

HeadingContextProvider.propTypes = {
    /** Resets the level outright. Omit to nest one level below the ambient level. */
    value: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    children: PropTypes.node,
};
