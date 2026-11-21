import { describe, expect, it } from 'vitest';
import { typeStyle } from './type-style.js';

describe('typeStyle', () => {
    it('pairs a text style with its tracking', () => {
        expect(typeStyle('body-sm')).toEqual({ font: 'var(--body-sm)', letterSpacing: 'var(--body-sm-tracking)' });
    });
    it('gives a metric tabular figures', () => {
        expect(typeStyle('metric-sm')).toEqual({
            font: 'var(--metric-sm)',
            letterSpacing: 'var(--metric-sm-tracking)',
            fontVariantNumeric: 'tabular-nums',
        });
    });
});
