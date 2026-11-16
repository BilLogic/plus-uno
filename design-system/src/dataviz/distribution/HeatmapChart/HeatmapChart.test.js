import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import HeatmapChart from './HeatmapChart';

describe('HeatmapChart options', () => {
    it('drops enableAnimation and animationDuration props, omits pixel legend offsets, and formats cell labels and tooltips with tabular figures and no <b>', () => {
        expect(HeatmapChart.propTypes.enableAnimation).toBeUndefined();
        expect(HeatmapChart.propTypes.animationDuration).toBeUndefined();
        expect(HeatmapChart.propTypes.animate).toBeUndefined();
        expect(HeatmapChart.propTypes.animationDelay).toBeUndefined();

        capturedOptions.length = 0;
        render(
            React.createElement(HeatmapChart, {
                xCategories: ['Mon', 'Tue'],
                yCategories: ['AM', 'PM'],
                data: [
                    [0, 0, 12],
                    [1, 1, 34],
                ],
            }),
        );
        const options = capturedOptions.at(-1);

        expect(options.chart.animation).not.toBe(false);
        expect(options.legend.y).toBeUndefined();
        expect(options.legend.verticalAlign).toBe('middle');

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
});
