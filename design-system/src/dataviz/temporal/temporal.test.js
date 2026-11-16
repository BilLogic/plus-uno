import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    CHART_BAR_RADIUS,
    CHART_LINE_WIDTH_NUMBER,
    CHART_MARKER_RADIUS,
    CHART_SPACING_MICRO,
    SEMIBOLD,
} from '@/dataviz/chartTheme';
import { BRAND, CATEGORICAL, CHROME } from '@/dataviz/palette';
import AreaChart from './AreaChart/AreaChart.jsx';
import AreaRangeChart from './AreaRangeChart/AreaRangeChart.jsx';
import ComboChart from './ComboChart/ComboChart.jsx';
import LineChart from './LineChart/LineChart.jsx';
import Sparkline from './Sparkline/Sparkline.jsx';
import StreamgraphChart from './StreamgraphChart/StreamgraphChart.jsx';
import TimelineChart from './TimelineChart/TimelineChart.jsx';
import WaterfallChart from './WaterfallChart/WaterfallChart.jsx';
import XRangeChart from './XRangeChart/XRangeChart.jsx';

const capturedOptions = [];
vi.mock('@/dataviz/PlusChart', () => ({
    default: (props) => {
        capturedOptions.push(props.options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

afterEach(() => {
    document.documentElement.removeAttribute('style');
});

describe('Temporal family charts on the shared foundation', () => {
    it('AreaChart uses CHART_MARKER_RADIUS, keeps temporal order by default, and sorts when sort={true}', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(AreaChart, {
                categories: ['Q1', 'Q2', 'Q3'],
                xAxisLabel: 'Quarter',
                yAxisLabel: 'Sessions',
                data: [{ name: 'Math', data: [40, 90, 60] }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.plotOptions.area.marker.radius).toBe(CHART_MARKER_RADIUS);
        expect(options.plotOptions.area.marker.states).toBeUndefined();
        expect(options.xAxis.title.style.fontWeight).toBe(SEMIBOLD);
        expect(options.yAxis.title.style.fontWeight).toBe(SEMIBOLD);
        expect(options.xAxis.categories).toEqual(['Q1', 'Q2', 'Q3']);
        expect(options.series[0].data).toEqual([40, 90, 60]);

        render(
            React.createElement(AreaChart, {
                categories: ['Q1', 'Q2', 'Q3'],
                sort: true,
                data: [{ name: 'Math', data: [40, 90, 60] }],
            }),
        );
        const sorted = capturedOptions.at(-1);
        expect(sorted.plotOptions.area.marker.radius).toBe(CHART_MARKER_RADIUS);
        expect(sorted.xAxis.categories).toEqual(['Q2', 'Q3', 'Q1']);
        expect(sorted.series[0].data).toEqual([90, 60, 40]);
    });

    it('AreaRangeChart uses BRAND for its single band series and semibold axis titles', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(AreaRangeChart, {
                xAxisLabel: 'Week',
                yAxisLabel: 'Score (%)',
                data: [[1, 52, 78], [2, 55, 80]],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.xAxis.title.style.fontWeight).toBe(SEMIBOLD);
        expect(options.yAxis.title.style.fontWeight).toBe(SEMIBOLD);
    });

    it('ComboChart uses BRAND for a single series, CATEGORICAL for multiple, token chrome, CHART_BAR_RADIUS, and sort opt-in', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(ComboChart, {
                categories: ['Jan', 'Feb', 'Mar'],
                barData: [{ name: 'Sessions', data: [30, 80, 50] }],
                lineData: [],
                primaryAxisLabel: 'Sessions',
                secondaryAxisLabel: 'Attendance (%)',
            }),
        );
        const single = capturedOptions.at(-1);
        expect(single.series[0].color).toBe(BRAND);
        expect(single.plotOptions.column.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(single.yAxis[1].title.style.color).toBe(CHROME.text);
        expect(single.xAxis.categories).toEqual(['Jan', 'Feb', 'Mar']);

        render(
            React.createElement(ComboChart, {
                categories: ['Jan', 'Feb', 'Mar'],
                barData: [{ name: 'Sessions', data: [30, 80, 50] }],
                lineData: [{ name: 'Attendance', data: [85, 92, 88], yAxis: 1 }],
                sort: true,
            }),
        );
        const multi = capturedOptions.at(-1);
        expect(multi.series[0].color).toBe(CATEGORICAL[0]);
        expect(multi.series[1].color).toBe(CATEGORICAL[1]);
        expect(multi.series[1].marker.lineColor).toBeUndefined();
        expect(multi.xAxis.categories).toEqual(['Feb', 'Mar', 'Jan']);
        expect(multi.series[0].data).toEqual([80, 50, 30]);
        expect(multi.series[1].data).toEqual([92, 88, 85]);
    });

    it('LineChart uses BRAND for one series, keeps temporal order by default, and sorts when sort={true}', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(LineChart, {
                categories: ['Wk 1', 'Wk 2', 'Wk 3'],
                data: [{ name: 'Score', data: [65, 82, 74] }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.xAxis.categories).toEqual(['Wk 1', 'Wk 2', 'Wk 3']);
        expect(options.series[0].data).toEqual([65, 82, 74]);

        render(
            React.createElement(LineChart, {
                data: [
                    { name: 'Cohort A', data: [65, 82, 74], categories: ['Wk 1', 'Wk 2', 'Wk 3'] },
                    { name: 'Cohort B', data: [60, 70, 68] },
                ],
                sort: true,
            }),
        );
        const sorted = capturedOptions.at(-1);
        expect(sorted.series[0].color).toBe(CATEGORICAL[0]);
        expect(sorted.series[1].color).toBe(CATEGORICAL[1]);
        expect(sorted.xAxis.categories).toEqual(['Wk 2', 'Wk 3', 'Wk 1']);
        expect(sorted.series[0].data).toEqual([82, 74, 65]);
        expect(sorted.series[1].data).toEqual([70, 68, 60]);
    });

    it('Sparkline uses CHART_MARKER_RADIUS for the latest point and hover marker, drops <b>, and keeps animation off', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(Sparkline, {
                label: 'Average score',
                data: [64, 70, 82],
                categories: ['W1', 'W2', 'W3'],
                valueSuffix: '%',
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.plotOptions.series.animation).toBe(false);
        expect(options.plotOptions.series.states).toBeUndefined();
        expect(options.plotOptions.line.lineWidth).toBe(CHART_LINE_WIDTH_NUMBER);
        expect(options.plotOptions.line.marker.radius).toBe(0);
        expect(options.plotOptions.line.marker.states).toEqual({
            hover: { radius: CHART_MARKER_RADIUS, radiusPlus: 0 },
        });
        expect(options.chart.spacing).toEqual([
            CHART_SPACING_MICRO,
            CHART_SPACING_MICRO,
            CHART_SPACING_MICRO,
            CHART_SPACING_MICRO,
        ]);
        expect(options.series[0].data.at(-1).marker.radius).toBe(CHART_MARKER_RADIUS);
        expect(options.tooltip.pointFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).toContain('plus-chart-value');
        expect(options.tooltip.headerFormat).toContain('plus-chart-value');
    });

    it('StreamgraphChart uses BRAND for one series, CATEGORICAL for multiple, and keeps temporal order unless sort={true}', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(StreamgraphChart, {
                categories: ['Jan', 'Feb', 'Mar'],
                series: [{ name: 'Math', data: [40, 90, 60] }],
            }),
        );
        const single = capturedOptions.at(-1);
        expect(single.series[0].color).toBe(BRAND);
        expect(single.xAxis.categories).toEqual(['Jan', 'Feb', 'Mar']);

        render(
            React.createElement(StreamgraphChart, {
                categories: ['Jan', 'Feb', 'Mar'],
                series: [
                    { name: 'Math', data: [40, 90, 60] },
                    { name: 'Reading', data: [20, 50, 30] },
                ],
                sort: true,
            }),
        );
        const sorted = capturedOptions.at(-1);
        expect(sorted.series[0].color).toBe(CATEGORICAL[0]);
        expect(sorted.series[1].color).toBe(CATEGORICAL[1]);
        expect(sorted.xAxis.categories).toEqual(['Feb', 'Mar', 'Jan']);
        expect(sorted.series[0].data).toEqual([90, 60, 40]);
        expect(sorted.series[1].data).toEqual([50, 30, 20]);
    });

    it('TimelineChart formats event labels with valueSpan, drops inline bold and pixel tooltip width, and uses BRAND for a single event', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(TimelineChart, {
                data: [{ name: 'Kickoff', label: 'Program kickoff', description: 'Term begins' }],
            }),
        );
        const single = capturedOptions.at(-1);
        expect(single.series[0].data[0].color).toBe(BRAND);
        expect(single.series[0].dataLabels.format).not.toMatch(/font-weight\s*:/i);
        expect(single.series[0].dataLabels.format).toContain('plus-chart-value');
        expect(single.tooltip.style.fontFamily).toBe('var(--type-family-body)');
        expect(single.tooltip.style.width).toBeUndefined();
    });

    it('WaterfallChart formats tooltip values without <b>, rounds bar ends with CHART_BAR_RADIUS, and preserves theme text styles', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(WaterfallChart, {
                categories: ['Start', 'Added', 'Total'],
                data: [{ y: 100, color: BRAND }, 25, { isSum: true, color: BRAND }],
                yAxisLabel: 'Students',
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.tooltip.pointFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).toContain('plus-chart-value');
        expect(options.plotOptions.waterfall.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.yAxis.title.style.fontWeight).toBe(SEMIBOLD);
        expect(options.series[0].dataLabels.style).toBeUndefined();
    });

    it('XRangeChart uses BRAND for a single row, CATEGORICAL for multiple rows, and supports sort opt-in by total duration', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(XRangeChart, {
                categories: ['Tutor A'],
                data: [{ start: 0, end: 100, y: 0, name: 'Session' }],
            }),
        );
        const single = capturedOptions.at(-1);
        expect(single.series[0].data[0].color).toBe(BRAND);

        render(
            React.createElement(XRangeChart, {
                categories: ['Short', 'Long'],
                data: [
                    { start: 0, end: 100, y: 0, name: 'A' },
                    { start: 0, end: 300, y: 1, name: 'B' },
                ],
                sort: true,
            }),
        );
        const sorted = capturedOptions.at(-1);
        expect(sorted.yAxis.categories).toEqual(['Long', 'Short']);
        expect(sorted.series[0].data.find((d) => d.name === 'B').y).toBe(0);
        expect(sorted.series[0].data.find((d) => d.name === 'A').y).toBe(1);
        expect(sorted.series[0].data[0].color).toBe(CATEGORICAL[1]);
        expect(sorted.series[0].data[1].color).toBe(CATEGORICAL[0]);
    });
});
