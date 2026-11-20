import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LABEL_FONT, LABEL_ROLE, MONO_LABEL_FONT } from './paint.js';

/**
 * The kit's labels read the existing text roles, not a font-size primitive or a
 * size of the kit's own.
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

    it('draws labels from existing text roles', () => {
        expect(LABEL_ROLE.font).toBe('var(--heading-xs)');
        expect(LABEL_FONT.fontSize).toBe('0.5em');
        expect(MONO_LABEL_FONT.font).toBe('var(--body-sm)');
    });

    it('declares no label size of its own in docs-rhythm.css', () => {
        expect(rhythm).not.toMatch(/--kit-label/);
    });
});
