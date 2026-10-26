import React from 'react';
import PropTypes from 'prop-types';
import './Overlay.scss';

/** The width steps a layer in the Overlay takes: columns of the screen grid. */
export const OVERLAY_WIDTHS = ['sm', 'md', 'lg'];

/** `hug` grows with the content to the screen less 128; `fill` sits at that cap. */
export const OVERLAY_HEIGHTS = ['hug', 'fill'];

/** Screen-grid columns per width step, matched by `screen-grid-width-steps` in `styles/_screen-grid.scss`. */
export const OVERLAY_SPANS = Object.freeze({ sm: 6, md: 8, lg: 10 });

/**
 * Overlay pattern for PLUS design system.
 * The full-screen layer that holds the scrim and a modal, so a modal is
 * placed, not drawn. It fills with the blanket, pads 16 at the sides and 64
 * above and below, centers its child, and sits on the scrim layer (500) with
 * its child on the modal layer (510).
 * Mirrors "Pattern/Overlay" in the Figma design system file.
 *
 * It draws the layer only: it does not trap focus, close on Escape or count
 * toward the two-overlay limit. For a real dialog, use the core Modal
 * component, which draws the same layers and scrim tokens.
 */
const Overlay = ({
    inline = false,
    screenWidth,
    screenHeight,
    onScrimClick,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-overlay',
        inline ? 'plus-pattern-overlay-inline' : '',
        className,
    ].filter(Boolean).join(' ');

    // The stand-in screen the layers inside size themselves from.
    const overlayStyle = {
        ...(inline && screenWidth != null ? { '--plus-overlay-screen': `${screenWidth}px` } : {}),
        ...(inline && screenHeight != null ? { '--plus-overlay-screen-height': `${screenHeight}px` } : {}),
        ...style,
    };

    // Only a click on the scrim itself: one inside the modal bubbles up here too.
    const handleClick = onScrimClick
        ? (event) => {
            if (event.target === event.currentTarget) onScrimClick(event);
        }
        : undefined;

    return (
        // The scrim is a pointer shortcut, not a control: a keyboard closes a
        // dialog from inside it, so the scrim takes no role or key handler.
        <div className={classes} style={overlayStyle} onClick={handleClick} {...props}>
            {children}
        </div>
    );
};

Overlay.propTypes = {
    /** Draw in the page flow at a stand-in screen, for docs and previews, instead of fixed over the page. */
    inline: PropTypes.bool,
    /** Inline only: the screen width (px) the layers inside take their width from, such as 768, 1024 or 1440. */
    screenWidth: PropTypes.number,
    /**
     * Inline only: the screen height (px); a layer inside caps at it less Overlay/pad-y above and below.
     * The pad follows the real viewport (24 under 640 tall), not this height, as Figma's frames do.
     */
    screenHeight: PropTypes.number,
    /** Called for a click on the scrim, not on the layer it holds. */
    onScrimClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    /** The layer it holds: a PatternModal, or a confirm over one. */
    children: PropTypes.node,
};

export default Overlay;
