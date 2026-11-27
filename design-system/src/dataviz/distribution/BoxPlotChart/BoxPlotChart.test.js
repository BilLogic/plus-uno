import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { MEDIUM } from '@/dataviz/chartTheme';
import { BRAND, CHROME } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import BoxPlotChart from './BoxPlotChart';

describe('BoxPlotChart options', () => {
    it('uses BRAND for its single series, sorts categories most-to-least by median by default, and opts out with sort={false}', () => {
        capturedOptions.length = 0;
        const categories = ['Class A', 'Class B', 'Class C'];
        const data = [
            [50, 60, 72, 85, 92],
            [60, 70, 88, 92, 98],
            [55, 65, 78, 86, 94],
        ];
        render(React.createElement(BoxPlotChart, { categories, data, yAxisLabel: 'Score' }));
        const options = capturedOptions.at(-1);

        expect(options.xAxis.categories).toEqual(['Class B', 'Class C', 'Class A']);
        expect(options.series[0].data.map((d) => d[2])).toEqual([88, 78, 72]);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.plotOptions.boxplot.fillColor).toBe(BRAND);
        expect(options.plotOptions.boxplot.stemColor).toBe(BRAND);
        expect(options.plotOptions.boxplot.whiskerColor).toBe(BRAND);
        expect(options.plotOptions.boxplot.medianColor).toBe(CHROME.separator);
        expect(options.legend.enabled).toBe(false);
        expect(options.yAxis.title.style.fontWeight).toBe(MEDIUM);
        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).not.toMatch(/<b\b/i);
        expect(options.plotOptions.boxplot.tooltip.pointFormat).not.toMatch(/<b\b/i);

        render(React.createElement(BoxPlotChart, { categories, data, sort: false }));
        const unsorted = capturedOptions.at(-1);
        expect(unsorted.xAxis.categories).toEqual(['Class A', 'Class B', 'Class C']);
        expect(unsorted.series[0].data.map((d) => d[2])).toEqual([72, 88, 78]);
    });
});
