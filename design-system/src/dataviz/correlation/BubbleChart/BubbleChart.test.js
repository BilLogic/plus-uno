import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { CHART_BUBBLE_MAX_SIZE, CHART_BUBBLE_MIN_SIZE, MEDIUM } from '@/dataviz/chartTheme';
import { BRAND, CATEGORICAL } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import BubbleChart from './BubbleChart';

describe('BubbleChart options', () => {
    it('uses BRAND for a single series, CATEGORICAL for multiple series, CHART_BUBBLE_MIN_SIZE and CHART_BUBBLE_MAX_SIZE for bubble sizes, and format helpers without <b>', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(BubbleChart, {
                xAxisLabel: 'Hours',
                yAxisLabel: 'Score',
                zAxisLabel: 'Count',
                data: [{ name: 'Class A', data: [[10, 75, 8]] }],
            }),
        );
        const single = capturedOptions.at(-1);
        expect(single.series[0].color).toBe(BRAND);
        expect(single.plotOptions.bubble.minSize).toBe(CHART_BUBBLE_MIN_SIZE);
        expect(single.plotOptions.bubble.maxSize).toBe(CHART_BUBBLE_MAX_SIZE);
        expect(single.plotOptions.bubble.minSize).toBe(12);
        expect(single.plotOptions.bubble.maxSize).toBe(48);
        expect(single.plotOptions.bubble.marker.fillOpacity).toBe(0.7);
        expect(single.xAxis.title.style.fontWeight).toBe(MEDIUM);
        expect(single.yAxis.title.style.fontWeight).toBe(MEDIUM);
        expect(single.tooltip.headerFormat).toContain(CHART_VALUE_CLASS);
        expect(single.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(single.tooltip.headerFormat).not.toMatch(/<b\b/i);
        expect(single.tooltip.pointFormat).not.toMatch(/<b\b/i);
        expect(single.plotOptions.bubble.tooltip.pointFormat).not.toMatch(/<b\b/i);

        render(
            React.createElement(BubbleChart, {
                data: [
                    { name: 'Class A', data: [[10, 75, 8]] },
                    { name: 'Class B', data: [[12, 80, 10]] },
                ],
            }),
        );
        const multi = capturedOptions.at(-1);
        expect(multi.series.map((s) => s.color)).toEqual([CATEGORICAL[0], CATEGORICAL[1]]);
    });
});
