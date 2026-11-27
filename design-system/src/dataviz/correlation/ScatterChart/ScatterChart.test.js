import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { CHART_MARKER_RADIUS, MEDIUM } from '@/dataviz/chartTheme';
import { BRAND, CATEGORICAL } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import ScatterChart from './ScatterChart';

describe('ScatterChart options', () => {
    it('uses CHART_MARKER_RADIUS, drops hand-rolled states, uses BRAND for one series, formats tooltips without <b>, and requires data with no empty default', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(ScatterChart, {
                xAxisLabel: 'Minutes',
                yAxisLabel: 'Score',
                data: [{ name: 'Grade 7', data: [[30, 60], [45, 75]] }],
            }),
        );
        const single = capturedOptions.at(-1);

        expect(single.series[0].color).toBe(BRAND);
        expect(single.plotOptions.scatter.marker.radius).toBe(CHART_MARKER_RADIUS);
        expect(single.plotOptions.scatter.marker.radius).toBe(3);
        expect(single.plotOptions.scatter.marker.states).toBeUndefined();
        expect(single.plotOptions.scatter.states).toBeUndefined();
        expect(single.xAxis.title.style.fontWeight).toBe(MEDIUM);
        expect(single.yAxis.title.style.fontWeight).toBe(MEDIUM);
        expect(single.plotOptions.scatter.tooltip.headerFormat).toContain(CHART_VALUE_CLASS);
        expect(single.plotOptions.scatter.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(single.plotOptions.scatter.tooltip.headerFormat).not.toMatch(/<b\b/i);
        expect(single.plotOptions.scatter.tooltip.pointFormat).not.toMatch(/<b\b/i);

        render(
            React.createElement(ScatterChart, {
                data: [
                    { name: 'Grade 7', data: [[30, 60]] },
                    { name: 'Grade 8', data: [[35, 65]] },
                ],
            }),
        );
        const multi = capturedOptions.at(-1);
        expect(multi.series.map((s) => s.color)).toEqual([CATEGORICAL[0], CATEGORICAL[1]]);

        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            expect(() => render(React.createElement(ScatterChart, {}))).toThrow();
        } finally {
            errSpy.mockRestore();
        }
    });
});
