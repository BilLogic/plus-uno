import React from 'react';
import { FRAME_LAYOUT } from '@/patterns/Frame/frameLayout';

/**
 * The narrowest screen a whole-screen example reflows to on a docs page: the
 * Page's 720 content floor and its pad on both sides. Below it the screen
 * scrolls sideways in the product, so on the page it scales instead.
 */
export const STAGE_FLOOR = FRAME_LAYOUT.fullWidthBelow;

/**
 * How a stage of `width` sits in a box `available` wide. Outside the docs (a
 * story's own canvas, the test runner) it lays out at its own width and scales
 * to fit. With `reflow` (on a docs page) a stage wider than the box lays out at
 * the box's width instead, so a screen responds to the page as the product
 * would, and only scales once the box is narrower than `floor`. Never scales up.
 *
 * @returns {{ layout: number, scale: number }} the width it lays out at, and its scale
 */
export const stageLayout = ({ width, available, reflow = false, floor = STAGE_FLOOR }) => {
    const layout = reflow ? Math.min(width, Math.max(available, Math.min(width, floor))) : width;
    return { layout, scale: Math.min(1, available / layout) };
};

/** True inside a docs page, where whole-screen examples reflow to the canvas. */
export const inDocsPage = (el) => Boolean(el?.closest?.('.sbdocs'));

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

/**
 * The layout width and scale for a whole-screen stage of `width`: reflowed to
 * its box on a docs page (see `stageLayout`), scaled to fit elsewhere. With
 * `allowReflow` false it only ever scales: for a picture of one fixed width.
 *
 * @returns {[React.RefObject<HTMLElement>, number, number, boolean]} the ref for the box, the layout width, the scale, and whether it reflows (a docs page)
 */
export const useStageLayout = (width, allowReflow = true) => {
    const ref = React.useRef(null);
    const [state, setState] = React.useState({ layout: width, scale: 1, reflow: false });
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const read = () => {
            const reflow = allowReflow && inDocsPage(el);
            const next = { ...stageLayout({ width, available: el.clientWidth, reflow }), reflow };
            setState((prev) => (prev.layout === next.layout && prev.scale === next.scale && prev.reflow === next.reflow ? prev : next));
        };
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(el);
        return () => observer.disconnect();
    }, [width, allowReflow]);
    return [ref, state.layout, state.scale, state.reflow];
};

export default useFitScale;
