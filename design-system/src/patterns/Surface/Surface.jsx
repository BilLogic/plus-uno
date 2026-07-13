import React from 'react';
import PropTypes from 'prop-types';
import './Surface.scss';

export const SURFACE_LEVELS = [
    'surface',
    'surface-container-lowest',
    'surface-container-low',
    'surface-container',
    'surface-container-high',
    'surface-container-highest',
];

/**
 * Surface pattern for PLUS design system.
 * Bare tokenized surface: pick a surface level, padding scale, radius scale,
 * border, and elevation — children fill the content slot.
 * Mirrors the "Surface" slot component in the Figma design system file.
 */
const Surface = ({
    id,
    level = 'surface',
    padding = 'md',
    radius = 'none',
    border = false,
    elevation = 0,
    as: Component = 'div',
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
        elevation ? `plus-pattern-surface-elevation-${elevation}` : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Component id={id} className={classes} style={style} {...props}>
            {children}
        </Component>
    );
};

Surface.propTypes = {
    id: PropTypes.string,
    /** Surface color token: surface, surface-container, or a container low/high step */
    level: PropTypes.oneOf(SURFACE_LEVELS),
    /** Padding scale (md maps to the canonical surface padding tokens) */
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** Radius scale */
    radius: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** Outline border on/off */
    border: PropTypes.bool,
    /** Elevation level (0 = flat; maps to --elevation-light-N) */
    elevation: PropTypes.oneOf([0, 1, 2, 3, 4, 5]),
    /** Render element / component */
    as: PropTypes.elementType,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot */
    children: PropTypes.node,
};

export default Surface;
