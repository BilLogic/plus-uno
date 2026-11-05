import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { dampedStretch, springBack } from '@/lib/damping';

/** Keyboard steps, in pixels: an arrow moves 16, Shift with an arrow 64. */
export const SPLITTER_STEP = 16;
export const SPLITTER_STEP_LARGE = 64;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const prefersReducedMotion = () => typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Where the drag draws the Panel's edge: 1:1 between min and max, damped past
 * either, so the edge resists and stops instead of hitting a wall.
 */
const dampedWidth = (raw, min, max) => {
    if (raw > max) return max + dampedStretch(raw, { limit: max });
    if (raw < min) return min - dampedStretch(-raw, { limit: -min });
    return raw;
};

/**
 * The Panel's splitter: the resize handle on its start edge, a window-splitter
 * separator. A drag follows the pointer between `min` and `max`, resists past
 * them through the damping unit, and springs back on release; the committed
 * width is always inside the range, so a drag never collapses the Sidebar.
 * Arrows step 16 (Shift 64): the left arrow widens the Panel, the right
 * narrows it. Home goes to the minimum, End to the maximum.
 */
const PanelSplitter = ({ width, min, max, controls, onCommit, onPreview }) => {
    const drag = useRef(null);
    const cancelSpring = useRef(() => {});
    useEffect(() => () => cancelSpring.current(), []);

    const onKeyDown = (e) => {
        const step = e.shiftKey ? SPLITTER_STEP_LARGE : SPLITTER_STEP;
        let next;
        if (e.key === 'ArrowLeft') next = width + step;
        else if (e.key === 'ArrowRight') next = width - step;
        else if (e.key === 'Home') next = min;
        else if (e.key === 'End') next = max;
        else return;
        e.preventDefault();
        onCommit(clamp(next, min, max));
    };

    const onPointerDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        cancelSpring.current();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drag.current = { x: e.clientX, width };
        e.currentTarget.focus();
    };

    const onPointerMove = (e) => {
        if (!drag.current) return;
        const raw = drag.current.width + (drag.current.x - e.clientX);
        drag.current.raw = raw;
        onPreview(dampedWidth(raw, min, max));
    };

    const onPointerEnd = (e) => {
        if (!drag.current) return;
        const raw = drag.current.raw ?? drag.current.width;
        drag.current = null;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        const committed = clamp(raw, min, max);
        const shown = dampedWidth(raw, min, max);
        onCommit(committed);
        const sign = shown >= committed ? 1 : -1;
        cancelSpring.current = springBack(Math.abs(shown - committed), {
            reducedMotion: prefersReducedMotion(),
            onUpdate: (stretch) => onPreview(committed + sign * stretch),
            onDone: () => onPreview(null),
        });
    };

    return (
        <div
            className="plus-frame__splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            aria-controls={controls}
            aria-valuenow={width}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={`${width} pixels`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
        />
    );
};

PanelSplitter.propTypes = {
    /** The committed Panel width, in pixels. */
    width: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    /** The Panel area's id. */
    controls: PropTypes.string,
    /** Called with the new width, always inside min..max. */
    onCommit: PropTypes.func.isRequired,
    /** Called with the width to draw during a drag or spring-back, and null once it settles. */
    onPreview: PropTypes.func.isRequired,
};

export default PanelSplitter;
