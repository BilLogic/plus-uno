import React from 'react';

/**
 * The scale that fits a stage of `width` into the box `ref` points at: the
 * box's width over the stage's, never above 1. Read before the first paint and
 * kept current by a ResizeObserver, so a scaled stage never shows unscaled.
 * Shared by `ScaledPreview` and `ModeFrame`.
 *
 * @param {number} width  the stage width
 * @returns {[React.RefObject<HTMLElement>, number]} the ref to put on the box, and the scale
 */
export const useFitScale = (width) => {
    const ref = React.useRef(null);
    const [scale, setScale] = React.useState(1);
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const read = () => setScale(Math.min(1, el.clientWidth / width));
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(el);
        return () => observer.disconnect();
    }, [width]);
    return [ref, scale];
};

export default useFitScale;
