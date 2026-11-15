import { useMotionReduced } from '@/lib/motionPreference';
import React, { createContext, useRef } from 'react';
import { useOverlayPresence } from '@/lib/overlayMotion';
import PropTypes from 'prop-types';
import './Blanket.scss';

/** The width steps a layer in the Blanket takes: columns of the screen grid. */
export const BLANKET_WIDTHS = ['sm', 'md', 'lg'];

/** `hug` grows with the content to the screen less 128; `fill` sits at that cap. */
export const BLANKET_HEIGHTS = ['hug', 'fill'];

/** Screen-grid columns per width step, matched by `screen-grid-width-steps` in `styles/_screen-grid.scss`. */
export const BLANKET_SPANS = Object.freeze({ sm: 6, md: 8, lg: 10 });

/**
 * Blanket pattern for PLUS design system.
 * The full-screen layer that holds the blanket fill and a modal, so a modal
 * is placed, not drawn. It fills with the blanket, pads 16 at the sides and
 * 64 above and below, centers its child, and sits on the blanket layer (500)
 * with its child on the modal layer (510).
 *
 * A Modal draws this Blanket. A Panel never does: it floats on the overlay
 * fill and shadow.
 *
 * It draws the layer only: it does not trap focus, close on Escape or take
 * the Modal slot. For a real dialog, use the core Modal
 * component, which draws the same layers and blanket token.
 */
export const BlanketOpenContext = createContext(true);

const Blanket = ({
    show = true,
    inline = false,
    screenWidth,
    screenHeight,
    onBlanketClick,
    className = '',
    style,
    children,
    ...props
}) => {
    const reduced = useMotionReduced();
    const surface = useRef(null);
    const present = useOverlayPresence(show, surface);
    const classes = [
        'plus-pattern-blanket',
        inline ? 'plus-pattern-blanket-inline' : '',
        className,
    ].filter(Boolean).join(' ');

    // The stand-in screen the layers inside size themselves from.
    const blanketStyle = {
        ...(inline && screenWidth != null ? { '--plus-overlay-screen': `${screenWidth}px` } : {}),
        ...(inline && screenHeight != null ? { '--plus-overlay-screen-height': `${screenHeight}px` } : {}),
        ...style,
    };

    // Only a click on the blanket itself: one inside the modal bubbles up here too.
    const handleClick = onBlanketClick
        ? (event) => {
            if (event.target === event.currentTarget) onBlanketClick(event);
        }
        : undefined;

    if (!present) return null;
    return (
        // The blanket is a pointer shortcut, not a control: a keyboard closes a
        // dialog from inside it, so the blanket takes no role or key handler.
        <BlanketOpenContext.Provider value={show}>
            <div
                data-reduced={reduced ? 'true' : undefined}
                ref={surface}
                data-ending-style={!show ? '' : undefined}
                aria-hidden={!show ? true : undefined}
                inert={!show ? true : undefined}
                className={classes}
                style={blanketStyle}
                onClick={handleClick}
                {...props}
            >
                {children}
            </div>
        </BlanketOpenContext.Provider>
    );
};

Blanket.propTypes = {
    /** Keep mounted and set false to finish the exit before removal. */
    show: PropTypes.bool,
    /** Draw in the page flow at a stand-in screen, for docs and previews, instead of fixed over the page. */
    inline: PropTypes.bool,
    /** Inline only: the screen width (px) the layers inside take their width from, such as 768, 1024 or 1440. */
    screenWidth: PropTypes.number,
    /**
     * Inline only: the screen height (px); a layer inside caps at it less Blanket/pad-y above and below.
     * The pad follows the real viewport (24 under 640 tall), not this height, as Figma's frames do.
     */
    screenHeight: PropTypes.number,
    /** Called for a click on the blanket, not on the layer it holds. */
    onBlanketClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    /** The layer it holds: a PatternModal, or a confirm over one. */
    children: PropTypes.node,
};

export default Blanket;
