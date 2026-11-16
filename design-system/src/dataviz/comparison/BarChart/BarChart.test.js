import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BRAND, CATEGORICAL, SMART, toneByRank } from '@/dataviz/palette';
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

    it('ColumnRangeChart uses BRAND for its single series, CHART_BAR_RADIUS, and sorts by span (high - low) by default', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(ColumnRangeChart, {
                categories: ['High but narrow', 'Wide span'],
                data: [{ low: 50, high: 60 }, { low: 10, high: 45 }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Wide span', 'High but narrow']);
        expect(options.series[0].data).toEqual([[10, 45], [50, 60]]);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.plotOptions.columnrange.borderRadius).toEqual(CHART_BAR_RADIUS);
    });

    it('DumbbellChart uses CHART_LINE_WIDTH_NUMBER and sorts categories by gap (|high - low|) by default', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(DumbbellChart, {
                categories: ['High score, small gap', 'Big swing'],
                data: [{ low: 85, high: 90 }, { low: 80, high: 40 }],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['Big swing', 'High score, small gap']);
        expect(options.series[0].data.map((d) => [d.low, d.high])).toEqual([[80, 40], [85, 90]]);
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

    it('ParetoChart always sorts categories most to least without a sort prop and rounds columns with CHART_BAR_RADIUS', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(ParetoChart, {
                categories: ['Minor', 'Major'],
                data: [15, 65],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(ParetoChart.propTypes.sort).toBeUndefined();
        expect(options.xAxis.categories).toEqual(['Major', 'Minor']);
        expect(options.series[1].data).toEqual([65, 15]);
        expect(options.plotOptions.column.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.yAxis[1].labels.style.fontVariantNumeric).toBe('tabular-nums');
    });

    it('RadarChart defaults to sort={false}, never colors axis label text with categoryColors, and reorders icons and colors via order when sort={true}', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(RadarChart, {
                categories: ['Math', 'Reading'],
                categoryColors: [SMART['mastering-content'], SMART.advocacy],
                series: [{ name: 'Score', data: [70, 90] }],
            }),
        );
        const defaultOptions = capturedOptions.at(-1);
        expect(defaultOptions.xAxis.categories).toEqual(['Math', 'Reading']);
        expect(defaultOptions.series[0].data).toEqual([70, 90]);
        expect(defaultOptions.xAxis.labels.formatter).toBeUndefined();

        render(
            React.createElement(RadarChart, {
                categories: ['Math', 'Reading'],
                categoryIcons: ['fa-calculator', 'fa-book-open'],
                categoryColors: [SMART['mastering-content'], SMART.advocacy],
                series: [{ name: 'Score', data: [70, 90] }],
                sort: true,
            }),
        );
        const sortedOptions = capturedOptions.at(-1);
        expect(sortedOptions.xAxis.categories).toEqual(['Reading', 'Math']);
        expect(sortedOptions.series[0].data).toEqual([90, 70]);
        const iconHtml = sortedOptions.xAxis.labels.formatter.call({ pos: 0, value: 'Reading' });
        expect(iconHtml).toContain('fa-book-open');
        expect(iconHtml).toContain('var(--icon-md)');
        expect(iconHtml).toContain(SMART.advocacy);
        expect(iconHtml).not.toContain('14px');
        expect(sortedOptions.tooltip.pointFormat).not.toContain('<b>');
        expect(sortedOptions.tooltip.pointFormat).not.toMatch(/style="color:\{series\.color\}">[^●]/);
    });

    it('SmartBarChart uses CHART_BAR_RADIUS, sorts most to least by default without mutating color, and pairs sort={false} with toneByRank', () => {
        capturedOptions.length = 0;
        render(
            React.createElement(SmartBarChart, {
                data: [
                    { letter: 'C', height: '40%', color: BRAND },
                    { letter: 'A', height: '90%', color: BRAND },
                    { letter: 'B', height: '65%', color: BRAND },
                ],
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.xAxis.categories).toEqual(['A', 'B', 'C']);
        expect(options.series[1].data.map((d) => d.y)).toEqual([90, 65, 40]);
        expect(options.plotOptions.column.borderRadius).toEqual(CHART_BAR_RADIUS);
        expect(options.tooltip.pointFormat).not.toContain('<b>');

        render(
            React.createElement(SmartBarChart, {
                sort: false,
                data: toneByRank(
                    [
                        { letter: 'A', height: '100' },
                        { letter: 'B', height: '75' },
                        { letter: 'C', height: '50' },
                        { letter: 'D', height: '25' },
                        { letter: 'E', height: '0' },
                    ],
                    'blue',
                ),
            }),
        );
        const ordinalOptions = capturedOptions.at(-1);
        expect(ordinalOptions.xAxis.categories).toEqual(['A', 'B', 'C', 'D', 'E']);
        expect(ordinalOptions.series[1].data[0].color).toBe('var(--chart-blue-boldest)');
        expect(ordinalOptions.series[1].data[4].color).toBe('var(--ds-background-accent-blue-subtler)');
    });

    it('StackedBarChart defaults to sort={false} for temporal dates, sorts by total height when sort={true}, and drops weight 300 and pointWidth 48', () => {
        capturedOptions.length = 0;
        const data = [
            { segments: [{ value: '20', height: '20%', color: CATEGORICAL[0] }] },
            { segments: [{ value: '50', height: '50%', color: CATEGORICAL[0] }] },
        ];
        render(
            React.createElement(StackedBarChart, {
                dates: ['Mon', 'Tue'],
                data,
            }),
        );
        const defaultOptions = capturedOptions.at(-1);
        expect(defaultOptions.xAxis.categories).toEqual(['Mon', 'Tue']);
        expect(defaultOptions.series[0].data.map((d) => d.y)).toEqual([20, 50]);
        expect(defaultOptions.plotOptions.column.pointWidth).toBeUndefined();
        expect(defaultOptions.plotOptions.column.dataLabels.style).toBeUndefined();

        render(
            React.createElement(StackedBarChart, {
                dates: ['School A', 'School B'],
                data,
                sort: true,
            }),
        );
        const sortedOptions = capturedOptions.at(-1);
        expect(sortedOptions.xAxis.categories).toEqual(['School B', 'School A']);
        expect(sortedOptions.series[0].data.map((d) => d.y)).toEqual([50, 20]);
    });
});
