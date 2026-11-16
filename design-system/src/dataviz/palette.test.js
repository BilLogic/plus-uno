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
    sequentialTone,
    seriesColor,
    sortCategories,
    toneByRank,
} from './palette';
import { dsName } from '../../../scripts/lib/color/emit.mjs';
import { contrastRatio, inkFor } from './colorMode';

const semantic = readFileSync(resolve(__dirname, '../tokens/color/_semantic.scss'), 'utf8');
const defined = new Set(semantic.match(/--[\w-]+(?=:)/g));
const css = dsName;
const named = (value) => value.match(/^var\((--[\w-]+)\)$/)[1];

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
            '--chart-orange-boldest', '--chart-orange-bolder', '--chart-orange-bold',
            DIVERGING_MIDPOINT,
            '--chart-blue-bold', '--chart-blue-bolder', '--chart-blue-boldest',
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

    it('sorts categories from most to least stably without touching the input or item colors', () => {
        const items = [
            { label: 'first-5', y: 5, color: 'var(--chart-blue-bold)' },
            { label: 'nine', y: 9, color: 'var(--ds-background-accent-blue-subtler)' },
            { label: 'second-5', y: 5, color: 'var(--chart-blue-boldest)' },
            { label: 'two', y: 2, color: 'var(--chart-blue-bolder)' },
        ];
        const sorted = mostToLeast(items);
        expect(sorted.map((i) => i.label)).toEqual(['nine', 'first-5', 'second-5', 'two']);
        expect(sorted.map((i) => i.color)).toEqual([
            'var(--ds-background-accent-blue-subtler)',
            'var(--chart-blue-bold)',
            'var(--chart-blue-boldest)',
            'var(--chart-blue-bolder)',
        ]);
        expect(items.map((i) => i.y)).toEqual([5, 9, 5, 2]);
    });

    it('tones ranked items explicitly with toneByRank and spreads sequentialTone across the ramp for 3, 5 and 8 items', () => {
        const three = toneByRank([{ label: 'A' }, { label: 'B' }, { label: 'C' }], 'blue');
        expect(three.map((i) => i.color)).toEqual([
            'var(--chart-blue-boldest)',
            'var(--chart-blue-bolder)',
            'var(--ds-background-accent-blue-subtler)',
        ]);
        expect(new Set(three.map((i) => i.color)).size).toBe(3);

        const five = toneByRank(
            [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }, { label: 'E' }],
            'blue',
        );
        expect(five.map((i) => i.color)).toEqual([
            'var(--chart-blue-boldest)',
            'var(--chart-blue-bolder)',
            'var(--chart-blue-bolder)',
            'var(--chart-blue-bold)',
            'var(--ds-background-accent-blue-subtler)',
        ]);
        expect(new Set(five.map((i) => i.color)).size).toBe(4);

        const eight = Array.from({ length: 8 }, (_, rank) => sequentialTone(rank, 8, 'blue'));
        expect(eight).toEqual([
            'var(--chart-blue-boldest)',
            'var(--chart-blue-boldest)',
            'var(--chart-blue-bolder)',
            'var(--chart-blue-bolder)',
            'var(--chart-blue-bold)',
            'var(--chart-blue-bold)',
            'var(--ds-background-accent-blue-subtler)',
            'var(--ds-background-accent-blue-subtler)',
        ]);
        expect(new Set(eight).size).toBe(4);
    });

    it('sorts parallel categories and series from most to least and returns the new index order', () => {
        const ranked = sortCategories({
            categories: ['Math', 'Science', 'Art'],
            series: [
                { name: '2024', data: [50, 90, 70] },
                { name: '2023', data: [40, 80, 60] },
            ],
        });
        expect(ranked.categories).toEqual(['Science', 'Art', 'Math']);
        expect(ranked.series[0].data).toEqual([90, 70, 50]);
        expect(ranked.series[1].data).toEqual([80, 60, 40]);
        expect(ranked.order).toEqual([1, 2, 0]);

        const custom = sortCategories({
            categories: ['Narrow', 'Wide'],
            series: [{ data: [{ low: 50, high: 60 }, { low: 10, high: 45 }] }],
            value: (d) => d.high - d.low,
        });
        expect(custom.categories).toEqual(['Wide', 'Narrow']);
        expect(custom.order).toEqual([1, 0]);
    });
});
