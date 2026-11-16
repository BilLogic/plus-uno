import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { CHART_SPACING_COMPACT } from '@/dataviz/chartTheme';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import HeatmapChart from './HeatmapChart';

describe('HeatmapChart options', () => {
    it('ignores removed animation props so entrance runs on the shared theme, omits pixel legend literals, applies CHART_SPACING_COMPACT, and formats labels and tooltips with tabular figures and no <b>', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(HeatmapChart, {
                xCategories: ['Mon', 'Tue'],
                yCategories: ['AM', 'PM'],
                data: [
                    [0, 0, 12],
                    [1, 1, 34],
                ],
                enableAnimation: false,
                animationDuration: 0,
                animate: false,
                compactSpacing: true,
            }),
        );
        const options = capturedOptions.at(-1);

        expect(options.chart.animation).not.toBe(false);
        expect(options.plotOptions.heatmap.animation).toBeUndefined();
        expect(options.chart.spacing).toEqual([
            CHART_SPACING_COMPACT,
            CHART_SPACING_COMPACT,
            CHART_SPACING_COMPACT,
            CHART_SPACING_COMPACT,
        ]);
        expect(options.chart.spacing).toEqual([6, 6, 6, 6]);
        expect(options.legend.y).toBeUndefined();
        expect(options.legend.symbolHeight).toBe(324);
        expect(options.legend.verticalAlign).toBe('middle');
        expect(options.legend.navigation).toEqual({ enabled: false });

        const tooltipHtml = options.tooltip.formatter.call({
            series: {
                xAxis: { categories: ['Mon', 'Tue'] },
                yAxis: { categories: ['AM', 'PM'] },
            },
            point: { x: 1, y: 0, value: 34 },
        });
        expect(tooltipHtml).not.toMatch(/<b\b/i);
        expect(tooltipHtml).toContain(CHART_VALUE_CLASS);
        expect(tooltipHtml).toContain('34.00');

        const cellLabelHtml = options.series[0].dataLabels.formatter.call({
            point: { color: 'rgb(0, 82, 204)', value: 34 },
        });
        expect(cellLabelHtml).toContain(CHART_VALUE_CLASS);
        expect(cellLabelHtml).toContain('>34<');
        expect(options.series[0].dataLabels.style).toBeUndefined();
    });

    it('sizes symbolHeight from chart height minus vertical margins and disables legend navigation at 350 and 250', () => {
        capturedOptions.length = 0;
        const baseProps = {
            xCategories: ['Q1', 'Q2'],
            yCategories: ['Algebra', 'Geometry'],
            data: [
                [0, 0, -5],
                [1, 1, 8],
            ],
        };

        render(React.createElement(HeatmapChart, { ...baseProps, height: 350 }));
        const tall = capturedOptions.at(-1);
        expect(tall.legend.navigation).toEqual({ enabled: false });
        expect(tall.legend.verticalAlign).toBe('middle');
        expect(tall.legend.symbolHeight).toBe(254);

        render(React.createElement(HeatmapChart, { ...baseProps, height: 250 }));
        const short = capturedOptions.at(-1);
        expect(short.legend.navigation).toEqual({ enabled: false });
        expect(short.legend.verticalAlign).toBe('middle');
        expect(short.legend.symbolHeight).toBe(154);
    });
});
