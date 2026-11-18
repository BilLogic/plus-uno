import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import chartTheme, { CHART_TRACK_RADIUS } from '@/dataviz/chartTheme';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { BRAND, CATEGORICAL, CHROME, STATUS, sequentialRamp } from '@/dataviz/palette';
import DonutChart from './DonutChart/DonutChart.jsx';
import DonutChartSVGCell from './DonutChart/DonutChartSVG.jsx';
import DonutChartSVG from './DonutChartSVG/DonutChartSVG.jsx';
import GaugeChart from './GaugeChart/GaugeChart.jsx';
import ParliamentChart from './ParliamentChart/ParliamentChart.jsx';
import PieChart from './PieChart/PieChart.jsx';
import PyramidChart from './PyramidChart/PyramidChart.jsx';
import SunburstChart from './SunburstChart/SunburstChart.jsx';
import TreemapChart from './TreemapChart/TreemapChart.jsx';

const capturedOptions = [];
vi.mock('@/dataviz/PlusChart', () => ({
    default: (props) => {
        capturedOptions.push(props.options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

describe('DonutChart', () => {
    it('enters on the shared spring by default with no animation props and styles its center figure with metric-lg, metric-md or metric-sm Metric tokens only', () => {
        capturedOptions.length = 0;
        const trackSegments = [
            { value: 25, color: BRAND, label: 'Done' },
            { value: 75, color: CHROME.track, label: 'Remaining' },
        ];
        const { getByText, rerender } = render(
            React.createElement(DonutChart, {
                value: '75%',
                label: 'Completed',
                segments: trackSegments,
            }),
        );
        const options = capturedOptions.at(-1);
        expect(options.chart.animation).not.toBe(false);
        expect(options.plotOptions.pie?.animation).toBeUndefined();
        expect(options.series[0].animation).toBeUndefined();
        expect(options.plotOptions.pie?.states).toBeUndefined();
        expect(options.plotOptions.pie?.allowPointSelect).toBe(false);
        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).not.toMatch(/<b\b/i);

        // A progress ring with a track keeps the filled measure first even when < 50%.
        expect(options.series[0].data.map((d) => d.y)).toEqual([25, 75]);

        expect(DonutChart.propTypes.animate).toBeUndefined();
        expect(DonutChart.propTypes.animationDelay).toBeUndefined();
        expect(DonutChart.propTypes.animationDuration).toBeUndefined();

        expect(getByText('75%').classList.contains('metric-lg')).toBe(true);

        rerender(React.createElement(DonutChart, { value: '75%', segments: trackSegments, centerTextSize: 'metric-md' }));
        expect(getByText('75%').classList.contains('metric-md')).toBe(true);

        rerender(React.createElement(DonutChart, { value: '75%', segments: trackSegments, centerTextSize: 'metric-sm' }));
        expect(getByText('75%').classList.contains('metric-sm')).toBe(true);

        // Retired t-shirt and type-scale aliases are not mapped onto metric-md / metric-sm.
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        rerender(React.createElement(DonutChart, { value: '75%', segments: trackSegments, centerTextSize: 'md' }));
        expect(getByText('75%').classList.contains('metric-md')).toBe(false);
        expect(getByText('75%').classList.contains('metric-lg')).toBe(true);
        rerender(React.createElement(DonutChart, { value: '75%', segments: trackSegments, centerTextSize: 'h4' }));
        expect(getByText('75%').classList.contains('metric-md')).toBe(false);
        expect(getByText('75%').classList.contains('metric-lg')).toBe(true);
        errSpy.mockRestore();
    });

    it('enables point selection in categorical mode using the theme selected tokens, sorts most to least by default and respects sort={false}', () => {
        capturedOptions.length = 0;
        const segments = [
            { value: 20, color: CATEGORICAL[1], label: 'Reading' },
            { value: 50, color: CATEGORICAL[0], label: 'Math' },
            { value: 30, color: CATEGORICAL[2], label: 'Science' },
        ];
        render(React.createElement(DonutChart, { value: '100', segments }));
        const options = capturedOptions.at(-1);
        expect(options.plotOptions.pie.allowPointSelect).toBe(true);
        expect(options.plotOptions.pie.states).toBeUndefined();
        expect(options.series[0].states).toBeUndefined();
        const selectState = options.plotOptions.series?.states?.select;
        expect(selectState?.color).toBe('var(--ds-background-selected)');
        expect(selectState?.borderColor).toBe('var(--ds-border-selected)');
        expect(selectState?.color).not.toBe(BRAND);
        expect(options.series[0].data.map((d) => d.name)).toEqual(['Math', 'Science', 'Reading']);

        render(React.createElement(DonutChart, { value: '100', segments, sort: false }));
        expect(capturedOptions.at(-1).series[0].data.map((d) => d.name)).toEqual(['Reading', 'Math', 'Science']);
    });
});

describe('DonutChartSVG', () => {
    it('maps only metric-lg, metric-md and metric-sm to .metric-* classes, keeps hover on appearance.fast and rounds its tooltip with --popup-radius', () => {
        const paths = [
            { d: 'M 0 0 L 10 0 L 10 10 Z', fill: CATEGORICAL[0], label: 'Segment 1', percentage: 73 },
            { d: 'M 10 0 L 20 0 L 20 10 Z', fill: CHROME.track, label: 'Remaining', percentage: 27 },
        ];
        const { container, getByText, rerender } = render(
            React.createElement(DonutChartSVG, {
                value: '73%',
                label: 'Attended',
                paths,
            }),
        );

        const centerFigure = getByText('73%');
        expect(centerFigure.classList.contains('metric-lg')).toBe(true);
        expect(centerFigure.parentElement.style.top).toBe('50%');

        const segmentPaths = container.querySelectorAll('svg path');
        expect(segmentPaths.length).toBeGreaterThan(0);
        expect(segmentPaths[0].style.transition).toContain('var(--ds-motion-appearance-fast-duration)');
        expect(segmentPaths[0].style.transition).toContain('var(--ds-motion-appearance-fast)');

        fireEvent.mouseEnter(segmentPaths[0], { clientX: 100, clientY: 80 });
        const tooltip = getByText('Segment 1').parentElement;
        expect(tooltip.style.borderRadius).toBe('var(--popup-radius)');
        expect(tooltip.style.top).toContain('var(--popup-offset)');
        fireEvent.mouseLeave(container.querySelector('svg'));

        rerender(React.createElement(DonutChartSVG, { value: '73%', paths, centerTextSize: 'metric-md' }));
        expect(getByText('73%').classList.contains('metric-md')).toBe(true);
        rerender(React.createElement(DonutChartSVG, { value: '73%', paths, centerTextSize: 'metric-sm' }));
        expect(getByText('73%').classList.contains('metric-sm')).toBe(true);

        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        rerender(React.createElement(DonutChartSVG, { value: '73%', paths, centerTextSize: 'h4' }));
        expect(getByText('73%').classList.contains('metric-md')).toBe(false);

        const cell = render(React.createElement(DonutChartSVGCell, { value: '80%', centerTextSize: 'h1' }));
        expect(cell.getByText('80%').classList.contains('metric-lg')).toBe(false);
        expect(cell.getByText('80%').classList.contains('metric-sm')).toBe(true);
        errSpy.mockRestore();
    });
});

describe('GaugeChart', () => {
    it('rounds its track with numeric CHART_TRACK_RADIUS (no pane.borderRadius), shows only min and max end ticks without radial gridlines, and escapes label HTML', () => {
        capturedOptions.length = 0;
        expect(typeof CHART_TRACK_RADIUS).toBe('number');
        expect(CHART_TRACK_RADIUS).toBeGreaterThan(0);

        render(React.createElement(GaugeChart, { value: 82, min: 0, max: 100, label: 'Attendance' }));
        const options = capturedOptions.at(-1);

        expect(JSON.stringify(options)).not.toContain('1200');
        expect(options.chart.animation).not.toBe(false);
        expect(options.yAxis.stops).toEqual([
            [0, BRAND],
            [1, BRAND],
        ]);
        expect(options.pane.borderRadius).toBeUndefined();
        expect(typeof options.pane.background.borderRadius).toBe('number');
        expect(options.pane.background.borderRadius).toBe(CHART_TRACK_RADIUS);
        expect(typeof options.plotOptions.solidgauge.borderRadius).toBe('number');
        expect(options.plotOptions.solidgauge.borderRadius).toBe(CHART_TRACK_RADIUS);

        expect(options.yAxis.tickPositions).toEqual([0, 100]);
        expect(options.yAxis.gridLineWidth).toBe(0);

        const format = options.plotOptions.solidgauge.dataLabels.format;
        expect(format).not.toMatch(/24px|12px|bold|<b\b/i);
        expect(format).toContain('metric-md');

        render(React.createElement(GaugeChart, { value: 50, label: '<img src=x onerror=alert(1)> & "quote"' }));
        const escapedFormat = capturedOptions.at(-1).plotOptions.solidgauge.dataLabels.format;
        expect(escapedFormat).not.toContain('<img');
        expect(escapedFormat).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quote&quot;');

        render(React.createElement(GaugeChart, { value: 92, label: 'On track', color: STATUS.success }));
        expect(capturedOptions.at(-1).yAxis.stops).toEqual([
            [0, STATUS.success],
            [1, STATUS.success],
        ]);
    });
});

describe('PieChart', () => {
    it('restores allowPointSelect with theme selected tokens (never --chart-brand), formats values without <b> and sorts most to least with sort={false} opt-out', () => {
        capturedOptions.length = 0;
        const data = [
            { name: 'Roosevelt', y: 25 },
            { name: 'Lincoln', y: 55 },
            { name: 'North', y: 20 },
        ];
        render(React.createElement(PieChart, { data }));
        const options = capturedOptions.at(-1);

        expect(options.plotOptions.pie.allowPointSelect).toBe(true);
        expect(options.plotOptions.pie.states).toBeUndefined();
        expect(options.series[0].states).toBeUndefined();
        const selectState = options.plotOptions.series?.states?.select;
        expect(selectState?.color).toBe('var(--ds-background-selected)');
        expect(selectState?.borderColor).toBe('var(--ds-border-selected)');
        expect(selectState?.borderWidth).toBe(chartTheme.plotOptions.series.states.select.borderWidth);
        expect(selectState?.color).not.toBe(BRAND);

        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).not.toMatch(/<b\b/i);
        expect(options.plotOptions.pie.dataLabels.format).toContain(CHART_VALUE_CLASS);
        expect(options.plotOptions.pie.dataLabels.format).not.toMatch(/<b\b/i);

        expect(options.series[0].data.map((d) => d.name)).toEqual(['Lincoln', 'Roosevelt', 'North']);
        expect(options.series[0].data.map((d) => d.color)).toEqual([CATEGORICAL[0], CATEGORICAL[1], CATEGORICAL[2]]);

        render(React.createElement(PieChart, { data, sort: false }));
        expect(capturedOptions.at(-1).series[0].data.map((d) => d.name)).toEqual(['Roosevelt', 'Lincoln', 'North']);
    });
});

describe('ParliamentChart', () => {
    it('keeps input seat order by default (sort = false), sorts most to least when sort={true} and formats numbers with plus-chart-value', () => {
        capturedOptions.length = 0;
        const data = [
            { name: 'Panel B', value: 8 },
            { name: 'Panel A', value: 18 },
            { name: 'Panel C', value: 4 },
        ];
        render(React.createElement(ParliamentChart, { data }));
        const options = capturedOptions.at(-1);
        expect(options.series[0].data.map((row) => row[0])).toEqual(['Panel B', 'Panel A', 'Panel C']);
        expect(options.legend.labelFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);

        render(React.createElement(ParliamentChart, { data, sort: true }));
        expect(capturedOptions.at(-1).series[0].data.map((row) => row[0])).toEqual(['Panel A', 'Panel B', 'Panel C']);
    });
});

describe('PyramidChart', () => {
    it('keeps input stage order by default (sort = false), sorts most to least when sort={true} and formats labels without <b> or weight 400', () => {
        capturedOptions.length = 0;
        const data = [
            { name: 'Enrolled', value: 600 },
            { name: 'Referred', value: 1000 },
            { name: 'Completed', value: 250 },
        ];
        render(React.createElement(PyramidChart, { data }));
        const options = capturedOptions.at(-1);
        expect(options.series[0].data.map((d) => d.name)).toEqual(['Enrolled', 'Referred', 'Completed']);

        const dl = options.plotOptions.pyramid?.dataLabels ?? options.plotOptions.series?.dataLabels;
        expect(dl.format).toContain(CHART_VALUE_CLASS);
        expect(dl.format).not.toMatch(/<b\b/i);
        expect(dl.style?.fontWeight).not.toBe('var(--type-weight-regular)');

        render(React.createElement(PyramidChart, { data, sort: true }));
        expect(capturedOptions.at(-1).series[0].data.map((d) => d.name)).toEqual(['Referred', 'Enrolled', 'Completed']);
    });
});

describe('SunburstChart', () => {
    it('sorts sibling branches and leaves from most to least by default, respects sort={false} and drops <b> from tooltip', () => {
        capturedOptions.length = 0;
        const data = [
            { id: 'all', parent: '', name: 'All' },
            { id: 'small', parent: 'all', name: 'Small branch' },
            { id: 'big', parent: 'all', name: 'Big branch' },
            { id: 's1', parent: 'small', name: 'S1', value: 20 },
            { id: 'b1', parent: 'big', name: 'B1', value: 30 },
            { id: 'b2', parent: 'big', name: 'B2', value: 60 },
        ];
        render(React.createElement(SunburstChart, { data }));
        const options = capturedOptions.at(-1);
        expect(options.series[0].data.map((d) => d.id)).toEqual(['all', 'big', 'b2', 'b1', 'small', 's1']);
        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).not.toMatch(/<b\b/i);

        render(React.createElement(SunburstChart, { data, sort: false }));
        expect(capturedOptions.at(-1).series[0].data.map((d) => d.id)).toEqual(['all', 'small', 'big', 's1', 'b1', 'b2']);
    });
});

describe('TreemapChart', () => {
    it('sorts tiles most to least by default, respects sort={false}, puts darkest sequential stop on the biggest value and drops <b>', () => {
        capturedOptions.length = 0;
        const data = [
            { name: 'Science', value: 40 },
            { name: 'Math', value: 90 },
            { name: 'Writing', value: 60 },
        ];
        render(React.createElement(TreemapChart, { data }));
        const options = capturedOptions.at(-1);
        expect(options.series[0].data.map((d) => d.name)).toEqual(['Math', 'Writing', 'Science']);
        expect(options.series[0].data.map((d) => d.color)).toEqual([CATEGORICAL[0], CATEGORICAL[1], CATEGORICAL[2]]);
        expect(options.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(options.tooltip.pointFormat).not.toMatch(/<b\b/i);

        render(React.createElement(TreemapChart, { data, colorByPoint: false, hue: 'blue' }));
        const seqOptions = capturedOptions.at(-1);
        const ramp = sequentialRamp('blue');
        expect(seqOptions.colorAxis.stops[0][0]).toBe(0);
        expect(seqOptions.colorAxis.stops.at(-1)[0]).toBe(1);
        expect(seqOptions.colorAxis.stops).toHaveLength(ramp.length);
        expect(seqOptions.series[0].data[0]).toMatchObject({ name: 'Math', colorValue: 90 });

        render(React.createElement(TreemapChart, { data, sort: false }));
        expect(capturedOptions.at(-1).series[0].data.map((d) => d.name)).toEqual(['Science', 'Math', 'Writing']);
    });
});
