import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BRAND, CATEGORICAL, sequentialRamp } from '@/dataviz/palette';
import { CHART_BAR_RADIUS, CHART_LINE_WIDTH_NUMBER } from '@/dataviz/chartTheme';
import BarChart, { buildBarAxes } from './BarChart.jsx';
import BulletChart from '../BulletChart/BulletChart.jsx';
import ColumnRangeChart from '../ColumnRangeChart/ColumnRangeChart.jsx';
import DumbbellChart from '../DumbbellChart/DumbbellChart.jsx';
import LollipopChart from '../LollipopChart/LollipopChart.jsx';
import ParetoChart from '../ParetoChart/ParetoChart.jsx';
import RadarChart from '../RadarChart/RadarChart.jsx';
import SmartBarChart from '../SmartBarChart/SmartBarChart.jsx';
import StackedBarChart from '../StackedBarChart/StackedBarChart.jsx';

const capturedOptions = [];
vi.mock('@/dataviz/PlusChart', () => ({
    default: (props) => {
        capturedOptions.push(props.options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

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

describe('BarChart', () => {
    it('sorts categories from most to least by default and enters on the shared spring without animation props', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(BarChart, {
                categories: ['Math', 'Science', 'Art'],
                series: [{ name: 'Score', data: [50, 90, 70] }],
                horizontal: true,
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Science', 'Art', 'Math']);
        expect(options.series[0].data).toEqual([90, 70, 50]);
        expect(options.plotOptions.series?.animation).not.toBe(false);
        expect(options.chart.animation).not.toBe(false);
    });

    it('keeps input order when sort={false} is passed for ordinal or temporal axes', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(BarChart, {
                categories: ['Mon', 'Tue', 'Wed'],
                series: [{ name: 'Sessions', data: [12, 24, 18] }],
                sort: false,
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Mon', 'Tue', 'Wed']);
        expect(options.series[0].data).toEqual([12, 24, 18]);
    });
});

describe('Comparison family charts on the shared foundation', () => {
    it('BulletChart sorts most to least, uses BRAND and valueSpan without <b>', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(BulletChart, {
                categories: ['A', 'B'],
                data: [{ y: 60, target: 75 }, { y: 90, target: 85 }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['B', 'A']);
        expect(options.series[0].data.map((d) => d.y)).toEqual([90, 60]);
        expect(options.plotOptions.bullet.color).toBe(BRAND);
        expect(options.plotOptions.bullet.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.tooltip.pointFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).toContain('plus-chart-value');
    });

    it('ColumnRangeChart uses BRAND for its single series, CHART_BAR_RADIUS, and sorts by default', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(ColumnRangeChart, {
                categories: ['Task 1', 'Task 2'],
                data: [{ low: 10, high: 30 }, { low: 20, high: 60 }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Task 2', 'Task 1']);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.plotOptions.columnrange.borderRadius).toEqual(CHART_BAR_RADIUS);
    });

    it('DumbbellChart uses CHART_LINE_WIDTH_NUMBER and sorts categories by default', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(DumbbellChart, {
                categories: ['Student A', 'Student B'],
                data: [{ low: 40, high: 65 }, { low: 50, high: 90 }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Student B', 'Student A']);
        expect(options.series[0].connectorWidth).toBe(CHART_LINE_WIDTH_NUMBER);
    });

    it('LollipopChart uses BRAND, valueSpan without <b>, and sorts categories by default', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(LollipopChart, {
                categories: ['A', 'B'],
                data: [42, 88],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['B', 'A']);
        expect(options.series[0].data).toEqual([88, 42]);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.tooltip.pointFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).toContain('plus-chart-value');
    });

    it('ParetoChart sorts categories most to least and rounds columns with CHART_BAR_RADIUS', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(ParetoChart, {
                categories: ['Minor', 'Major'],
                data: [15, 65],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Major', 'Minor']);
        expect(options.series[1].data).toEqual([65, 15]);
        expect(options.plotOptions.column.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.yAxis[1].labels.style.fontVariantNumeric).toBe('tabular-nums');
    });

    it('RadarChart uses --icon-md instead of 14px and tooltipPointFormat without series-color text or <b>', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(RadarChart, {
                categories: ['Math', 'Reading'],
                categoryIcons: ['fa-calculator', 'fa-book-open'],
                series: [{ name: 'Score', data: [70, 90] }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Reading', 'Math']);
        const iconHtml = options.xAxis.labels.formatter.call({ pos: 0, value: 'Reading' });
        expect(iconHtml).toContain('var(--icon-md)');
        expect(iconHtml).not.toContain('14px');
        expect(options.tooltip.pointFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).not.toMatch(/style="color:\{series\.color\}">[^●]/);
    });

    it('SmartBarChart uses CHART_BAR_RADIUS instead of pill radius, sorts most to least, and puts darkest tone on biggest value', () => {
        capturedOptions.length = 0;
        const ramp = sequentialRamp('blue').map((t) => `var(${t})`);
        render(
            React.createElement(SmartBarChart, {
                data: [
                    { letter: 'C', height: '40%', color: ramp[0] },
                    { letter: 'A', height: '90%', color: ramp[3] },
                    { letter: 'B', height: '65%', color: ramp[2] },
                ],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['A', 'B', 'C']);
        expect(options.series[1].data[0].color).toBe('var(--chart-blue-boldest)');
        expect(options.plotOptions.column.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.tooltip.pointFormat).not.toContain('<b>');
    });

    it('StackedBarChart drops weight 300 and pointWidth 48 and sorts by total height unless sort={false}', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(StackedBarChart, {
                dates: ['School A', 'School B'],
                data: [
                    { segments: [{ value: '20', height: '20%', color: CATEGORICAL[0] }] },
                    { segments: [{ value: '50', height: '50%', color: CATEGORICAL[0] }] },
                ],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['School B', 'School A']);
        expect(options.plotOptions.column.pointWidth).toBeUndefined();
        expect(options.plotOptions.column.dataLabels.style).toBeUndefined();
    });
});
