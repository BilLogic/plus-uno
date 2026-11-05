import { useLayoutEffect, useState } from 'react';

/** The width assumed when there is no window to measure: the X-Large screen. */
export const SERVER_RENDER_WIDTH = 1440;

/**
 * The width of the box `ref` points at, kept current by a ResizeObserver and
 * the window's resize event. Frame and List and detail both size themselves
 * from their own box rather than the window, so they share this one hook.
 * A box that measures 0 (hidden, not laid out) keeps the last width it had.
 * Before the first measure it reads the window, or `fallback` where there is none.
 * @param {React.RefObject<HTMLElement>} ref
 * @param {number} [fallback] width when there is no window (server render)
 * @returns {number}
 */
export const useOwnWidth = (ref, fallback = SERVER_RENDER_WIDTH) => {
    const [width, setWidth] = useState(() => (typeof window === 'undefined' ? fallback : window.innerWidth));
    useLayoutEffect(() => {
        const read = () => setWidth((last) => ref.current?.getBoundingClientRect().width || last);
        read();
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
        if (ref.current) ro?.observe(ref.current);
        window.addEventListener('resize', read);
        return () => {
            ro?.disconnect();
            window.removeEventListener('resize', read);
        };
    }, [ref]);
    return width;
};
