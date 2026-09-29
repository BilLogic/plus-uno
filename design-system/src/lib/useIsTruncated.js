import { useLayoutEffect, useState } from 'react';

/**
 * Whether the element in `ref` is clipped: its content is wider than its box.
 *
 * Measured after layout and again whenever the element resizes, because the
 * width a label has depends on the page around it. Status and Tag use it to
 * decide when a label needs a tooltip, and a tab stop to reach it.
 *
 * @param {{ current: Element | null }} ref
 * @param {unknown[]} deps  what changes the label's width besides a resize
 * @returns {boolean}
 */
export const useIsTruncated = (ref, deps) => {
    const [truncated, setTruncated] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return truncated;
};

export default useIsTruncated;
