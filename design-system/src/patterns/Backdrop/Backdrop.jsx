import React from 'react';
import PropTypes from 'prop-types';
import './Backdrop.scss';

/** The width steps a layer in the Backdrop takes: columns of the screen grid. */
export const BACKDROP_WIDTHS = ['sm', 'md', 'lg'];

/** `hug` grows with the content to the screen less 128; `fill` sits at that cap. */
export const BACKDROP_HEIGHTS = ['hug', 'fill'];

/** Screen-grid columns per width step, matched by `screen-grid-width-steps` in `styles/_screen-grid.scss`. */
export const BACKDROP_SPANS = Object.freeze({ sm: 6, md: 8, lg: 10 });

/**
 * Where the layer sits: `center` for a modal, or `start` · `end` for a drawer
 * held full height at that edge, with no pad.
 */
export const BACKDROP_PLACEMENTS = ['center', 'start', 'end'];

/**
 * Backdrop pattern for PLUS design system.
 * The full-screen layer that holds the backdrop fill and a modal, so a modal
 * is placed, not drawn. It fills with the backdrop, pads 16 at the sides and
 * 64 above and below, centers its child, and sits on the backdrop layer (500)
 * with its child on the modal layer (510).
 *
 * With `placement` `start` or `end` it drops the pad and holds its child
 * full height at that edge of the screen, for a drawer.
 *
 * Modal, Drawer and the overlay Panel all draw this one Backdrop, so the fill
 * and the layer order are the same under each. The Panel's is `contained`:
 * it covers its Frame, not the screen.
 *
 * It draws the layer only: it does not trap focus, close on Escape or count
 * toward the two-overlay limit. For a real dialog, use the core Modal
 * component, which draws the same layers and backdrop token; PatternDrawer
 * brings its own focus handling.
 */
const Backdrop = ({
    placement = 'center',
    inline = false,
    contained = false,
    screenWidth,
    screenHeight,
    onBackdropClick,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-backdrop',
        placement !== 'center' ? `plus-pattern-backdrop-placement-${placement}` : '',
        inline ? 'plus-pattern-backdrop-inline' : '',
        contained ? 'plus-pattern-backdrop-contained' : '',
        className,
    ].filter(Boolean).join(' ');

    // The stand-in screen the layers inside size themselves from.
    const backdropStyle = {
        ...(inline && screenWidth != null ? { '--plus-overlay-screen': `${screenWidth}px` } : {}),
        ...(inline && screenHeight != null ? { '--plus-overlay-screen-height': `${screenHeight}px` } : {}),
        ...style,
    };

    // Only a click on the backdrop itself: one inside the modal bubbles up here too.
    const handleClick = onBackdropClick
        ? (event) => {
            if (event.target === event.currentTarget) onBackdropClick(event);
        }
        : undefined;

    return (
        // The backdrop is a pointer shortcut, not a control: a keyboard closes a
        // dialog from inside it, so the backdrop takes no role or key handler.
        <div className={classes} style={backdropStyle} onClick={handleClick} {...props}>
            {children}
        </div>
    );
};

Backdrop.propTypes = {
    /** `center` (default) for a modal; `start` or `end` holds the layer full height at that edge, with no pad. */
    placement: PropTypes.oneOf(BACKDROP_PLACEMENTS),
    /** Draw in the page flow at a stand-in screen, for docs and previews, instead of fixed over the page. */
    inline: PropTypes.bool,
    /**
     * Cover the nearest positioned parent instead of the screen, with no pad and no layer inside: the
     * overlay Panel's Backdrop over a Frame's Page and Sidebar. The fill and the layer order stay the shared ones.
     */
    contained: PropTypes.bool,
    /** Inline only: the screen width (px) the layers inside take their width from, such as 768, 1024 or 1440. */
    screenWidth: PropTypes.number,
    /**
     * Inline only: the screen height (px); a layer inside caps at it less Backdrop/pad-y above and below.
     * The pad follows the real viewport (24 under 640 tall), not this height, as Figma's frames do.
     */
    screenHeight: PropTypes.number,
    /** Called for a click on the backdrop, not on the layer it holds. */
    onBackdropClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    /** The layer it holds: a PatternModal, a confirm over one, or a drawer at an edge. */
    children: PropTypes.node,
};

export default Backdrop;
