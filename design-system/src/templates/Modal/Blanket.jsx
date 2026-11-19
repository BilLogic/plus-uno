import { useMotionReduced } from '@/lib/motionPreference';
import React, { useRef } from 'react';
import { useOverlayPresence } from '@/lib/overlayMotion';
import PropTypes from 'prop-types';

/**
 * Internal Blanket layer for the Modal template (`design-system/src/templates/Modal/`).
 * Covers the screen (or a stand-in screen when `inline`) with `--ds-blanket`,
 * holds the screen grid and pads (`--blanket-pad-x`, `--blanket-pad-y`), and
 * centers the Dialog inside it. Not exported from `@/templates`.
 */
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
    const present = useOverlayPresence(inline ? show : true, surface);

    const classes = [
        'plus-modal-blanket',
        inline ? 'plus-modal-blanket-inline' : '',
        className,
    ].filter(Boolean).join(' ');

    const blanketStyle = {
        ...(inline && screenWidth != null
            ? { '--plus-overlay-screen': typeof screenWidth === 'number' ? `${screenWidth}px` : screenWidth }
            : {}),
        ...(inline && screenHeight != null
            ? { '--plus-overlay-screen-height': typeof screenHeight === 'number' ? `${screenHeight}px` : screenHeight }
            : {}),
        ...style,
    };

    const handleClick = (event) => {
        if (onBlanketClick && event.target === event.currentTarget) {
            onBlanketClick(event);
        }
    };

    if (inline && !present) return null;

    // `data-ending-style` fades the dim out in both modes. Only the inline Blanket goes inert as it
    // leaves: the portaled one holds the focused Dialog, and inert would strip focus to the body
    // before Base UI can hand it back to the trigger.

    return (
        <div
            data-reduced={reduced ? 'true' : undefined}
            ref={surface}
            data-ending-style={!show ? '' : undefined}
            aria-hidden={inline && !show ? true : undefined}
            inert={inline && !show ? true : undefined}
            className={classes}
            style={blanketStyle}
            onClick={handleClick}
            {...props}
        >
            {children}
        </div>
    );
};

Blanket.propTypes = {
    show: PropTypes.bool,
    inline: PropTypes.bool,
    screenWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    screenHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onBlanketClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

export default Blanket;
