import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LABEL_FONT } from './paint.js';

/**
 * The kit's labels read a semantic role, not a font-size primitive. The role is
 * declared once in docs-rhythm.css, where the kit's other roles live.
 */
const KIT = __dirname;
const rhythm = readFileSync(join(KIT, '..', 'docs-rhythm.css'), 'utf8');

describe('illustration kit label type', () => {
    it('reads no font-size primitive anywhere in the kit', () => {
        const offenders = readdirSync(KIT)
            .filter((name) => /\.(jsx?|css)$/.test(name) && !name.includes('.test.'))
            .filter((name) => /--type-size-/.test(readFileSync(join(KIT, name), 'utf8')));
        expect(offenders).toEqual([]);
    });

    it('draws labels at the drawing-scale role', () => {
        expect(LABEL_FONT.fontSize).toBe('var(--kit-label-drawing-size)');
    });

    it('derives the drawing size by halving the real label size, sans and mono', () => {
        expect(rhythm).toMatch(/--kit-label-size:\s*var\(--type-size-0875\)/);
        expect(rhythm).toMatch(/--kit-label-mono-size:\s*var\(--type-size-075\)/);
        expect(rhythm).toMatch(/--kit-label-drawing-size:\s*calc\(var\(--kit-label-size\) \/ 2\)/);
        expect(rhythm).toMatch(/--kit-label-mono-drawing-size:\s*calc\(var\(--kit-label-mono-size\) \/ 2\)/);
    });
});
