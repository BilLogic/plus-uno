import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { CHART_BAR_RADIUS, MEDIUM } from '@/dataviz/chartTheme';
import { BRAND, CHROME, toneByRank } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import VariwidthChart from './VariwidthChart';

describe('VariwidthChart options', () => {
    it('sorts columns most-to-least by default, uses BRAND for its single series, opts out with sort={false} alongside toneByRank, and drops <b>', () => {
        capturedOptions.length = 0;
        const data = [
            { name: 'Science', y: 78, z: 90 },
            { name: 'Art', y: 92, z: 30 },
            { name: 'Math', y: 85, z: 120 },
        ];
        render(React.createElement(VariwidthChart, { data, xAxisLabel: 'Subject', yAxisLabel: 'Score' }));
        const options = capturedOptions.at(-1);

        expect(options.series[0].data.map((d) => d.name)).toEqual(['Art', 'Math', 'Science']);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.series[0].colorByPoint).toBeUndefined();
        expect(options.plotOptions.variwide.borderColor).toBe(CHROME.separator);
        expect(options.plotOptions.variwide.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.xAxis.title.style.fontWeight).toBe(MEDIUM);
        expect(options.yAxis.title.style.fontWeight).toBe(MEDIUM);
        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).not.toMatch(/<b\b/i);
        expect(options.series[0].dataLabels.format).toContain(CHART_VALUE_CLASS);

        render(
            React.createElement(VariwidthChart, {
                sort: false,
                data: toneByRank(data, 'blue', (d) => d.y),
            }),
        );
        const ordinal = capturedOptions.at(-1);
        expect(ordinal.series[0].data.map((d) => d.name)).toEqual(['Science', 'Art', 'Math']);
        expect(ordinal.series[0].data[1].color).toBe('var(--chart-blue-boldest)');
    });
});
