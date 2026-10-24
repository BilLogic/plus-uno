import { describe, expect, it } from 'vitest';

import { cardsPerRow, columnWidth, spanWidth } from './homeGrid';
import { tokenCorpus } from '@/lib/tokens-node.mjs';

/**
 * The lesson strip's arithmetic at the three content widths the Layout tokens
 * hold: 720 at Medium, 744 at Large (sidebar docked) and 1144 at X-Large. The
 * gutter and the card minimum are read from the token corpus. The first test
 * pins the values they read as, so a token change fails here by name.
 */
const first = tokenCorpus();
const last = tokenCorpus({ precedence: 'last' });
/** A length token's Medium value (`:root`), or its widest-mode value with `last`. */
const px = (token, corpus = first) => parseFloat(corpus.get(token).value);
const grid = {
    columns: parseInt(first.get('--layout-columns').value, 10),
    gutter: px('--layout-gutter'),
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
        expect(grid).toEqual({ columns: 12, gutter: 16, cardMin: 304 });
        expect(width).toEqual({ md: 720, lg: 744, xl: 1144 });
    });

    it('covers the content width with 12 columns and 11 gutters', () => {
        expect(spanWidth(12, width.xl, grid)).toBeCloseTo(width.xl);
        expect(columnWidth(width.md, grid) * 12 + 11 * grid.gutter).toBeCloseTo(width.md);
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
