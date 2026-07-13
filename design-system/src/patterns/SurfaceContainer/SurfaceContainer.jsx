import React from 'react';
import PropTypes from 'prop-types';
import './SurfaceContainer.scss';

/**
 * Surface container pattern for PLUS design system.
 * The Main-region shell: baked-in `--color-surface` background, Surface-tier
 * padding/gap/radius tokens, flat (elevation 0), and it FILLS the width it is
 * given — the page/shell owns the width and the breakpoint mode. Mirrors the
 * published `Pattern/Surface container` Figma component (auto mode + fill),
 * which carries the adaptive 12-column content grid and the Content slot.
 */
const SurfaceContainer = ({
    id,
    padding = 'md',
    gap = 'md',
    radius = 'md',
    border = false,
    as: Component = 'div',
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-surface-container',
        `plus-pattern-surface-container-pad-${padding}`,
        `plus-pattern-surface-container-gap-${gap}`,
        `plus-pattern-surface-container-radius-${radius}`,
        border ? 'plus-pattern-surface-container-bordered' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Component id={id} className={classes} style={style} {...props}>
            {children}
        </Component>
    );
};

SurfaceContainer.propTypes = {
    id: PropTypes.string,
    /** Padding scale (md maps to the surface-container padding tokens) */
    padding: PropTypes.oneOf(['none', 'md']),
    /** Gap between stacked children (md maps to --size-surface-container-gap-md) */
    gap: PropTypes.oneOf(['none', 'md']),
    /** Radius scale */
    radius: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** Outline border on/off */
    border: PropTypes.bool,
    /** Render element / component */
    as: PropTypes.elementType,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot */
    children: PropTypes.node,
};

export default SurfaceContainer;
