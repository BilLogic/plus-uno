import { useMotionReduced } from '@/lib/motionPreference';
import React, { createContext, useRef } from 'react';
import { useOverlayPresence } from '@/lib/overlayMotion';
import PropTypes from 'prop-types';

/**
 * Carries Blanket's `show` down to the Modal it holds so the Modal starts its
 * exit together with the Blanket instead of snapping away when `show` drops.
 */
export const BlanketOpenContext = createContext(true);

/**
 * Internal Blanket layer for the Modal template (`design-system/src/patterns/Modal/`).
 * Covers the screen (or a stand-in screen when `inline`) with `--ds-blanket`,
 * holds the screen grid and pads (`--blanket-pad-x`, `--blanket-pad-y`), and
 * centers the Dialog inside it. Not exported from `@/patterns`.
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
        'plus-pattern-blanket',
        inline ? 'plus-pattern-blanket-inline' : '',
        className,
    ].filter(Boolean).join(' ');

    const vars = {};
    if (inline && screenWidth !== undefined) {
        vars['--plus-overlay-screen'] = typeof screenWidth === 'number' ? `${screenWidth}px` : screenWidth;
    }
    if (inline && screenHeight !== undefined) {
        const h = typeof screenHeight === 'number' ? `${screenHeight}px` : screenHeight;
        vars['--plus-overlay-screen-height'] = h;
        const pad = typeof screenHeight === 'number' && screenHeight < 640 ? 24 : 64;
        vars['--plus-overlay-max-height'] = typeof screenHeight === 'number'
            ? `${Math.max(0, screenHeight - 2 * pad)}px`
            : `calc(${h} - 2 * var(--blanket-pad-y))`;
        if (typeof screenHeight === 'number' && screenHeight < 640) {
            vars['--blanket-pad-y'] = 'var(--space-150)';
        }
    }

    const handleClick = (event) => {
        if (onBlanketClick && event.target === event.currentTarget) {
            onBlanketClick(event);
        }
    };

    if (inline && !present) return null;

    return (
        <div
            data-reduced={reduced ? 'true' : undefined}
            ref={surface}
            data-ending-style={inline && !show ? '' : undefined}
            aria-hidden={inline && !show ? true : undefined}
            inert={inline && !show ? true : undefined}
            className={classes}
            style={{ ...vars, ...style }}
            onClick={handleClick}
            {...props}
        >
            <BlanketOpenContext.Provider value={show}>
                {children}
            </BlanketOpenContext.Provider>
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
