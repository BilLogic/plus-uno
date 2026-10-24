import { describe, expect, it } from 'vitest';

import { BLOCKS, cardsPerRow, columnWidth, homeLayout, spanWidth, splitRow } from './homeGrid';
import { tokenCorpus } from '@/lib/tokens-node.mjs';

/**
 * The formulas at the three content widths the Layout tokens hold: 720 at
 * Medium, 744 at Large (sidebar docked) and 1144 at X-Large. The gutter and
 * the minimums are read from the token corpus. The first test pins the values
 * they read as, so a token change fails here by name before it moves a split.
 */
const first = tokenCorpus();
const last = tokenCorpus({ precedence: 'last' });
/** A length token's Medium value (`:root`), or its widest-mode value with `last`. */
const px = (token, corpus = first) => parseFloat(corpus.get(token).value);
const grid = {
    columns: parseInt(first.get('--layout-columns').value, 10),
    gutter: px('--layout-gutter'),
    mainMin: px('--section-min-width-main'),
    sideMin: px('--section-min-width-side'),
    cardMin: px('--card-min-width-md'),
};
const width = {
    md: px('--layout-width-content'),
    // Large's content: the screen less the docked sidebar, the frame's right pad and two surface pads.
    lg: px('--breakpoint-lg-min') - px('--layout-width-sidebar') - px('--surface-container-pad') - 2 * px('--surface-pad'),
    xl: px('--layout-width-content', last),
};

describe('the grid arithmetic', () => {
    it('reads the decided tokens', () => {
        expect(grid).toEqual({ columns: 12, gutter: 16, mainMin: 480, sideMin: 224, cardMin: 304 });
        expect(width).toEqual({ md: 720, lg: 744, xl: 1144 });
    });

    it('covers the content width with 12 columns and 11 gutters', () => {
        expect(spanWidth(12, width.xl, grid)).toBeCloseTo(width.xl);
        expect(columnWidth(width.md, grid) * 12 + 11 * grid.gutter).toBeCloseTo(width.md);
    });
});

describe('a row with a side column', () => {
    it('stacks at 720: 8 columns are 474.67, under the 480 main minimum', () => {
        expect(spanWidth(8, width.md, grid)).toBeLessThan(grid.mainMin);
        expect(splitRow(width.md, grid, 3)).toEqual({ main: 12, side: 12, stacked: true });
        expect(splitRow(width.md, grid, 4)).toEqual({ main: 12, side: 12, stacked: true });
    });

    it('widens the side until it reaches 224: at 744 the badge needs 4 columns', () => {
        expect(spanWidth(3, width.lg, grid)).toBeLessThan(grid.sideMin);
        expect(splitRow(width.lg, grid, 3)).toEqual({ main: 8, side: 4, stacked: false });
    });

    it('keeps the preferred side when it fits: 9 + 3 at 1144', () => {
        expect(splitRow(width.xl, grid, 3)).toEqual({ main: 9, side: 3, stacked: false });
        expect(splitRow(width.xl, grid, 4)).toEqual({ main: 8, side: 4, stacked: false });
    });

    it('places the blocks side by side once both rows split: 8 + 4 at 744', () => {
        expect(homeLayout(width.lg, grid)).toEqual({
            stacked: false,
            greeting: { column: '1 / span 8', row: 1 },
            badge: { column: '9 / span 4', row: 1 },
            skills: { column: '1 / span 8', row: 2 },
            impact: { column: '9 / span 4', row: 2 },
            lessons: { column: '1 / span 12', row: 3 },
        });
        expect(homeLayout(width.xl, grid)).toMatchObject({
            greeting: { column: '1 / span 9', row: 1 },
            badge: { column: '10 / span 3', row: 1 },
            skills: { column: '1 / span 8', row: 2 },
            impact: { column: '9 / span 4', row: 2 },
        });
    });

    it('stacks at 720, one block per row in reading order', () => {
        expect(homeLayout(width.md, grid)).toEqual({
            stacked: true,
            greeting: { column: '1 / span 12', row: 1 },
            badge: { column: '1 / span 12', row: 2 },
            skills: { column: '1 / span 12', row: 3 },
            impact: { column: '1 / span 12', row: 4 },
            lessons: { column: '1 / span 12', row: 5 },
        });
    });

    it('never places a block before one that precedes it in reading order', () => {
        for (const w of [width.md, width.lg, width.xl]) {
            const layout = homeLayout(w, grid);
            const key = (b) => layout[b].row * 100 + parseInt(layout[b].column, 10);
            const keys = BLOCKS.map(key);
            expect(keys).toEqual([...keys].sort((x, y) => x - y));
        }
    });
});

describe('a row of cards', () => {
    it('shows the most of 4 · 3 · 2 · 1 that keeps each card at 304', () => {
        expect(cardsPerRow(width.md, grid, grid.cardMin)).toBe(2);
        expect(cardsPerRow(width.lg, grid, grid.cardMin)).toBe(2);
        expect(cardsPerRow(width.xl, grid, grid.cardMin)).toBe(3);
        expect(cardsPerRow(1232, grid, grid.cardMin)).toBe(3);
        expect(cardsPerRow(1264, grid, grid.cardMin)).toBe(4);
        expect(cardsPerRow(200, grid, grid.cardMin)).toBe(1);
    });
});
