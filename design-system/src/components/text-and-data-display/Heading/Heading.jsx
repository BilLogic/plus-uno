import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Heading.scss';

export const HEADING_SIZES = ['xxlarge', 'xlarge', 'large', 'medium', 'small', 'xsmall', 'xxsmall'];

/** Each size's default tag, when `as` is not given. */
const DEFAULT_TAG_OF_SIZE = {
    xxlarge: 'h1',
    xlarge: 'h1',
    large: 'h2',
    medium: 'h3',
    small: 'h4',
    xsmall: 'h5',
    xxsmall: 'h6',
};

/**
 * The tag `Heading` falls back to when its own `as` is not given: the
 * nearest `HeadingContextProvider`'s level, read the same way Card already
 * reads page/section nesting (`@/lib/headingLevel`).
 */
const HeadingLevelContext = createContext(null);

/**
 * Pins every `Heading` under it to one tag, regardless of `size` — a modal
 * whose body is a fixed `h2` no matter which size its heading is drawn at.
 */
export const HeadingContextProvider = ({ level, children }) => (
    <HeadingLevelContext.Provider value={level}>{children}</HeadingLevelContext.Provider>
);

HeadingContextProvider.propTypes = {
    level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]).isRequired,
    children: PropTypes.node,
};

/**
 * Heading: a piece of text drawn at a type-scale size, with its semantic tag
 * and its visual size chosen independently. Props follow Atlassian's Heading
 * (https://atlassian.design/components/heading).
 */
export const Heading = ({
    size = 'medium',
    as,
    color = 'default',
    id,
    className,
    children,
    ...props
}) => {
    const contextLevel = useContext(HeadingLevelContext);
    const Tag = as || (contextLevel ? `h${contextLevel}` : DEFAULT_TAG_OF_SIZE[size]);

    return (
        <Tag
            id={id}
            className={classNames(
                'plus-heading',
                `plus-heading--${size}`,
                { 'plus-heading--inverse': color === 'inverse' },
                className
            )}
            {...props}
        >
            {children}
        </Tag>
    );
};

Heading.propTypes = {
    /** The type-scale step, independent of `as`. */
    size: PropTypes.oneOf(HEADING_SIZES),
    /** Override the rendered tag; otherwise the nearest `HeadingContextProvider`'s level, or the size's own default. */
    as: PropTypes.elementType,
    /** `default` reads on a light surface; `inverse` on a bold/dark one. */
    color: PropTypes.oneOf(['default', 'inverse']),
    id: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};

export default Heading;
