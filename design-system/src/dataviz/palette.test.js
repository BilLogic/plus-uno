import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHART_SEQUENCES, divergingArm, sequentialRamp as checkedRamp } from '../../../scripts/lib/color/checks.mjs';
import {
    BRAND,
    CATEGORICAL,
    CATEGORICAL_LIMIT,
    CHROME,
    DIVERGING_MIDPOINT,
    HUES,
    SMART,
    SMART_SUBJECTS,
    STATUS,
    divergingRamp,
    mostToLeast,
    rampStops,
    sequentialRamp,
    seriesColor,
} from './palette';
import { contrastRatio, inkFor } from './colorMode';

const semantic = readFileSync(resolve(__dirname, '../tokens/color/_semantic.scss'), 'utf8');
const defined = new Set(semantic.match(/--ds-[\w-]+(?=:)/g));
const css = (token) => `--ds-${token.replace(/^color\./, '').replaceAll('.', '-')}`;
const named = (value) => value.match(/^var\((--ds-[\w-]+)\)$/)[1];

describe('the data-viz palette', () => {
    it('names only tokens the generator emits', () => {
        const tokens = [
            ...CATEGORICAL, ...Object.values(STATUS), ...Object.values(SMART), ...Object.values(CHROME),
        ].map(named);
        tokens.push(...HUES.flatMap((h) => sequentialRamp(h)), DIVERGING_MIDPOINT);
        for (const t of tokens) expect(defined.has(t), t).toBe(true);
    });

    it('assigns series in the order the color checks hold', () => {
        expect(CATEGORICAL.slice(0, CATEGORICAL_LIMIT).map(named)).toEqual(CHART_SEQUENCES.categorical.map(css));
        expect(SMART_SUBJECTS.map((s) => named(SMART[s]))).toEqual(CHART_SEQUENCES.SMART.map(css));
    });

    it('builds ramps from the steps the color checks hold', () => {
        for (const h of HUES) {
            expect(sequentialRamp(h)).toEqual(checkedRamp(h).map(css));
            const arm = divergingArm(h).map(css);
            expect(divergingRamp('gray' === h ? 'blue' : 'gray', h).slice(3)).toEqual(arm);
        }
    });

    it('runs a diverging ramp from one hue at its strongest, through the midpoint, to the other', () => {
        expect(divergingRamp()).toEqual([
            '--ds-chart-orange-boldest', '--ds-chart-orange-bolder', '--ds-chart-orange-bold',
            DIVERGING_MIDPOINT,
            '--ds-chart-blue-bold', '--ds-chart-blue-bolder', '--ds-chart-blue-boldest',
        ]);
        expect(() => divergingRamp('blue', 'blue')).toThrow();
        expect(() => sequentialRamp('lagoon')).toThrow();
    });

    it('spaces stops evenly and resolves each one', () => {
        expect(rampStops(['--a', '--b', '--c'], (t) => t.toUpperCase())).toEqual([[0, '--A'], [0.5, '--B'], [1, '--C']]);
    });

    it('picks the ink that reads best on a fill', () => {
        const dark = 'rgb(44, 44, 43)';
        const light = 'rgb(255, 255, 255)';
        expect(inkFor('rgb(220, 235, 250)', [dark, light])).toBe(dark);
        expect(inkFor('rgb(20, 60, 120)', [dark, light])).toBe(light);
        expect(contrastRatio(light, 'rgb(0, 0, 0)')).toBeCloseTo(21, 5);
    });

    it('colors one series in the brand chart color and several in categorical order', () => {
        expect(seriesColor(0, 1)).toBe(BRAND);
        expect([0, 1, 2].map((i) => seriesColor(i, 3))).toEqual(CATEGORICAL.slice(0, 3));
    });

    it('sorts categories from most to least without touching the input', () => {
        const items = [{ y: 2 }, { y: 9 }, { y: 5 }];
        expect(mostToLeast(items).map((i) => i.y)).toEqual([9, 5, 2]);
        expect(items.map((i) => i.y)).toEqual([2, 9, 5]);
    });
});
