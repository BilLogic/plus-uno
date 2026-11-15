import { describe, it, expect } from 'vitest';
import { buildBarAxes } from './BarChart.jsx';

const base = { categories: ['Math', 'Science', 'Art'] };

describe('buildBarAxes', () => {
    it('keeps the category names on xAxis for a horizontal chart, so the bars are labeled by name', () => {
        const { xAxis, yAxis } = buildBarAxes({ ...base, horizontal: true });
        expect(xAxis.categories).toEqual(base.categories);
        expect(yAxis.categories).toBeUndefined();
    });

    it('leaves value ticks to the axis: no fixed tick positions unless asked', () => {
        const { yAxis } = buildBarAxes({ ...base, horizontal: true });
        expect(yAxis.tickPositions).toBeUndefined();
        expect(yAxis.tickInterval).toBeUndefined();
    });

    it('reads the label switches and the max as drawn when horizontal', () => {
        const { xAxis, yAxis } = buildBarAxes({ ...base, horizontal: true, xAxisMax: 100, hideYAxisLabels: true });
        expect(xAxis.labels.enabled).toBe(false);
        expect(yAxis.labels.enabled).toBe(true);
        expect(yAxis.max).toBe(100);
    });

    it('keeps a column chart as before', () => {
        const { xAxis, yAxis } = buildBarAxes({ ...base, horizontal: false, yAxisMax: 80, yAxisLabel: 'Score' });
        expect(xAxis.categories).toEqual(base.categories);
        expect(yAxis.max).toBe(80);
        expect(yAxis.title.text).toBe('Score');
    });
});
