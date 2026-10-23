import { useLayoutEffect, useRef, useState } from 'react';

/**
 * The layout formulas the Home page lays its blocks out with, on the
 * 12-column content grid. Every input is a token read from the page; no
 * width is written here.
 *
 * - A **row with a side column** (the greeting and badge; the skills chart and
 *   Your Impact) gives the side the fewest columns, from its preferred count,
 *   that keep it at `--section-min-width-side` while the main column keeps
 *   `--section-min-width-main`. When no split keeps both, the row stacks and
 *   each block spans all 12.
 * - A **row of cards** shows the most of 4 · 3 · 2 · 1 per row that keeps each
 *   card at its minimum (`--card-min-width-md`). Each of those counts divides
 *   12, so the cards land on whole columns.
 *
 * Column widths come from the measured row, not the `--col-*` spans: those are
 * per viewport and assume the older 8 gutter, and a column is relative to its
 * container (`grid.md` § Grid rules), which moves when the sidebar docks.
 */

/** Column counts a row of cards may take, most first. Each divides 12. */
export const CARD_COUNTS = [4, 3, 2, 1];

/** The width of one column of a grid `width` wide. */
export const columnWidth = (width, { columns, gutter }) => (width - (columns - 1) * gutter) / columns;

/** The width `span` columns cover, gutters between them included. */
export const spanWidth = (span, width, grid) => span * columnWidth(width, grid) + (span - 1) * grid.gutter;

/**
 * Splits a row into a main and a side column, or stacks it.
 * @param {number} width the row's width
 * @param {{ columns: number, gutter: number, mainMin: number, sideMin: number }} grid
 * @param {number} preferredSide the side column's span when it fits
 * @returns {{ main: number, side: number, stacked: boolean }}
 */
export const splitRow = (width, grid, preferredSide) => {
    for (let side = preferredSide; side <= grid.columns / 2; side += 1) {
        const main = grid.columns - side;
        if (spanWidth(side, width, grid) >= grid.sideMin && spanWidth(main, width, grid) >= grid.mainMin) {
            return { main, side, stacked: false };
        }
    }
    return { main: grid.columns, side: grid.columns, stacked: true };
};

/**
 * How many cards a row of `width` shows: the most of `CARD_COUNTS` that keeps
 * each card at `min`, gutters between them.
 * @returns {number}
 */
export const cardsPerRow = (width, { gutter }, min) =>
    CARD_COUNTS.find((n) => (width - (n - 1) * gutter) / n >= min) ?? 1;

/** Preferred side spans: the badge takes 3 columns, Your Impact 4. */
export const PREFERRED_SIDE = { greeting: 3, progress: 4 };

/**
 * The whole page's layout at a content width.
 * @param {number} width the content grid's width
 * @param {{ columns: number, gutter: number, mainMin: number, sideMin: number, cardMin: number }} grid
 */
export const homeLayout = (width, grid) => ({
    greeting: splitRow(width, grid, PREFERRED_SIDE.greeting),
    progress: splitRow(width, grid, PREFERRED_SIDE.progress),
});

/**
 * What a length token resolves to, in pixels, in `doc`'s cascade. The layout
 * tokens are set on `:root` and switch on the viewport, so a probe in the body
 * reads the value the page draws with.
 */
const readLength = (doc, token) => {
    const probe = doc.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;width:var(${token})`;
    doc.body.appendChild(probe);
    const value = probe.getBoundingClientRect().width;
    probe.remove();
    return value;
};

/** The grid tokens the formulas read, resolved at the current viewport. */
export const readGrid = (el) => {
    const doc = el.ownerDocument;
    const root = getComputedStyle(doc.documentElement);
    return {
        columns: parseInt(root.getPropertyValue('--layout-columns'), 10),
        gutter: readLength(doc, '--layout-gutter'),
        mainMin: readLength(doc, '--section-min-width-main'),
        sideMin: readLength(doc, '--section-min-width-side'),
        cardMin: readLength(doc, '--card-min-width-md'),
    };
};

/**
 * Measures `ref`'s element and returns `measure(width, grid)`, again whenever
 * the element changes width (a breakpoint, the sidebar docking). Null until the
 * first measure, which runs before paint. `onResize` runs on every width
 * change, for state that depends on the element's size rather than the result.
 * @template T
 * @param {React.RefObject<HTMLElement>} ref
 * @param {(width: number, grid: ReturnType<typeof readGrid>) => T} measure
 * @param {() => void} [onResize]
 * @returns {T | null}
 */
export const useGridMeasure = (ref, measure, onResize) => {
    const [value, setValue] = useState(null);
    const last = useRef('');
    const resized = useRef(onResize);
    resized.current = onResize;
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const read = () => {
            resized.current?.();
            const width = el.getBoundingClientRect().width;
            const grid = readGrid(el);
            // Nothing laid out yet (or no stylesheet): keep the stacked default.
            if (!width || !Number.isFinite(grid.columns)) return;
            const next = measure(width, grid);
            // A resize that keeps the same spans does not re-render the page.
            const key = JSON.stringify(next);
            if (key === last.current) return;
            last.current = key;
            setValue(next);
        };
        read();
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
        ro?.observe(el);
        return () => ro?.disconnect();
        // `measure` is a module-level formula and `onResize` is read through a
        // ref, so the element is the only dependency.
    }, [ref]);
    return value;
};
