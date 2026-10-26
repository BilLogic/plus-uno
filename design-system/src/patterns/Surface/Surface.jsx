import React from 'react';
import PropTypes from 'prop-types';
import './Surface.scss';

/**
 * The elevation levels, lowest to highest. A level is a pair: its fill and the
 * shadow that goes with it, so a surface never wears one without the other.
 */
export const SURFACE_LEVELS = ['sunken', 'default', 'raised', 'overlay'];

/**
 * The default surface's edge, as the `surface-edge` mixin in
 * `styles/_surface-edge.scss` draws it. For the stories that measure it.
 */
export const SURFACE_EDGE = '0 0 0 var(--size-surface-border) var(--ds-border-surface)';

/**
 * Surface pattern for PLUS design system.
 * Bare tokenized surface: pick an elevation level, padding scale, radius scale
 * and border — children fill the content slot. The level sets the fill and its
 * shadow together: sunken (the frame's backdrop), default (the page, edged by
 * the surface border), raised (a card) and overlay (anything over the UI).
 * Mirrors the "Surface" slot component in the Figma design system file.
 *
 * A surface that holds a page can carry the page's `title`: the page's one
 * h1, at Heading/large 24, above the content. Sections inside it open at h2.
 */
const Surface = ({
    id,
    level = 'default',
    padding = 'md',
    radius = 'none',
    border = false,
    as: Component = 'div',
    title,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-surface',
        `plus-pattern-surface-level-${level}`,
        `plus-pattern-surface-pad-${padding}`,
        `plus-pattern-surface-radius-${radius}`,
        border ? 'plus-pattern-surface-bordered' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Component id={id} className={classes} style={style} {...props}>
            {title && <h1 className="plus-pattern-surface-title">{title}</h1>}
            {children}
        </Component>
    );
};

Surface.propTypes = {
    id: PropTypes.string,
    /** Elevation level: its fill and its shadow, as a pair */
    level: PropTypes.oneOf(SURFACE_LEVELS),
    /** Padding scale (md is the frame surface's pad) */
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** Radius scale */
    radius: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** A bold border on/off */
    border: PropTypes.bool,
    /** Render element / component */
    as: PropTypes.elementType,
    /** The page's title: its one h1, at Heading/large 24. Leave it unset on a surface that is not a page. */
    title: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot */
    children: PropTypes.node,
};

export default Surface;
