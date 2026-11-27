import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { CHART_BAR_RADIUS, MEDIUM } from '@/dataviz/chartTheme';
import { BRAND, CHROME } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import HistogramChart from './HistogramChart';

describe('HistogramChart options', () => {
    it('keeps continuous bins in natural order even if sort is passed, styles bins with BRAND and CHART_BAR_RADIUS, and drops <b> from tooltips', () => {
        capturedOptions.length = 0;
        const data = [90, 62, 75, 84, 71, 68];
        render(
            React.createElement(HistogramChart, {
                data,
                xAxisLabel: 'Score',
                yAxisLabel: 'Score',
                binWidth: 10,
                sort: true,
            }),
        );
        const options = capturedOptions.at(-1);

        expect(options.series[0].type).toBe('histogram');
        expect(options.series[1].data).toEqual([90, 62, 75, 84, 71, 68]);
        expect(options.plotOptions.histogram.color).toBe(BRAND);
        expect(options.plotOptions.histogram.borderColor).toBe(CHROME.separator);
        expect(options.plotOptions.histogram.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.legend.enabled).toBe(false);
        expect(options.xAxis[0].title.style.fontWeight).toBe(MEDIUM);
        expect(options.xAxis[1].title.style.fontWeight).toBe(MEDIUM);
        expect(options.yAxis[0].title.style.fontWeight).toBe(MEDIUM);
        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).not.toMatch(/<b\b/i);
        expect(options.plotOptions.histogram.tooltip.pointFormat).not.toMatch(/<b\b/i);
    });
});
