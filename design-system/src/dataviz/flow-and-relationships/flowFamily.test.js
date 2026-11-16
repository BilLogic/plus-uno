import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toneByRank } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: React.forwardRef((props, ref) => {
        capturedOptions.push(props.options);
        React.useImperativeHandle(ref, () => ({ container: { current: null }, chart: null }));
        return React.createElement('div', { 'data-testid': 'mock-plus-chart' });
    }),
}));

import ArcDiagram from './ArcDiagram/ArcDiagram';
import DependencyWheel from './DependencyWheel/DependencyWheel';
import FunnelChart from './FunnelChart/FunnelChart';
import NetworkGraph from './NetworkGraph/NetworkGraph';
import OrganizationChart from './OrganizationChart/OrganizationChart';
import SankeyDiagram from './SankeyDiagram/SankeyDiagram';
import TreegraphChart from './TreegraphChart/TreegraphChart';
import WordCloud from './WordCloud/WordCloud';

const REMOVED_ANIMATION_PROPS = ['animate', 'animationDelay', 'animationDuration', 'enableAnimation'];
const STUBBED_TOKENS = ['--radius-lg', '--radius-control-lg', '--pad-y-md', '--size-200'];

describe('Flow and relationship charts on the shared foundation', () => {
    beforeEach(() => {
        capturedOptions.length = 0;
    });

    afterEach(() => {
        for (const token of STUBBED_TOKENS) {
            document.documentElement.style.removeProperty(token);
        }
    });

    it('exposes no legacy animation props on any chart in the family', () => {
        const charts = [
            ArcDiagram,
            DependencyWheel,
            FunnelChart,
            NetworkGraph,
            OrganizationChart,
            SankeyDiagram,
            TreegraphChart,
            WordCloud,
        ];
        for (const Chart of charts) {
            for (const prop of REMOVED_ANIMATION_PROPS) {
                expect(Chart.propTypes?.[prop], `${Chart.name}.${prop}`).toBeUndefined();
            }
        }
    });

    it('reads Treegraph node radius/height and DependencyWheel label distance from CSS tokens rather than fallbacks or control tokens', async () => {
        document.documentElement.style.setProperty('--radius-lg', '11px');
        document.documentElement.style.setProperty('--radius-control-lg', '19px');
        document.documentElement.style.setProperty('--pad-y-md', '9px');
        document.documentElement.style.setProperty('--size-200', '34px');

        vi.resetModules();

        const themeMod = await import('@/dataviz/chartTheme');
        expect(themeMod.CHART_NODE_RADIUS).toBe(11);
        expect(themeMod.CHART_NODE_RADIUS).not.toBe(19);
        expect(themeMod.CHART_NODE_HEIGHT).toBe(34);
        expect(themeMod.CHART_SPACING_COMPACT).toBe(9);

        const { default: FreshTreegraphChart } = await import('./TreegraphChart/TreegraphChart');
        render(
            React.createElement(FreshTreegraphChart, {
                data: [
                    { id: 'math', name: 'Math' },
                    { id: 'fractions', parent: 'math', name: 'Fractions' },
                ],
            }),
        );
        const treegraphOptions = capturedOptions.at(-1);
        expect(treegraphOptions.chart.type).toBe('treegraph');
        expect(treegraphOptions.series[0].borderRadius).toBe(11);
        expect(treegraphOptions.series[0].marker.height).toBe(34);
        expect(treegraphOptions.series[0].dataLabels.style).toBeUndefined();
        expect(treegraphOptions.tooltip.pointFormat).toBe('{point.name}');

        const { default: FreshDependencyWheel } = await import('./DependencyWheel/DependencyWheel');
        render(
            React.createElement(FreshDependencyWheel, {
                data: [
                    ['Reading', 'Comprehension', 5],
                    ['Reading', 'Vocabulary', 4],
                ],
            }),
        );
        const wheelOptions = capturedOptions.at(-1);
        expect(wheelOptions.chart.type).toBe('dependencywheel');
        expect(wheelOptions.series[0].dataLabels.distance).toBe(9);
        expect(wheelOptions.series[0].dataLabels.style).toBeUndefined();
        expect(wheelOptions.series[0].dataLabels.color).toBeUndefined();
        expect(wheelOptions.tooltip.nodeFormat).toContain('class="plus-chart-value"');
        expect(wheelOptions.tooltip.pointFormat).toContain('class="plus-chart-value"');
        expect(wheelOptions.tooltip.nodeFormat).not.toContain('<b>');
        expect(wheelOptions.tooltip.pointFormat).not.toContain('<b>');
    });

    it('ArcDiagram drops redundant data-label style overrides and formats tooltips without <b>', () => {
        render(
            React.createElement(ArcDiagram, {
                data: [
                    ['CMU', 'Lincoln Middle', 10],
                    ['CMU', 'Roosevelt K-8', 15],
                ],
            }),
        );

        const options = capturedOptions.at(-1);
        expect(options.chart.type).toBe('arcdiagram');
        expect(options.series[0].dataLabels.style).toBeUndefined();
        expect(options.tooltip.nodeFormat).toContain('class="plus-chart-value"');
        expect(options.tooltip.pointFormat).toContain('class="plus-chart-value"');
        expect(options.tooltip.nodeFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).not.toContain('<b>');
    });

    it('FunnelChart defaults to single-series --chart-brand (colorByPoint: false), keeps stage order unless sort={true}, supports toneByRank, and formats without <b>', () => {
        const stages = [
            { name: 'Started', y: 400 },
            { name: 'Re-engaged', y: 650 },
            { name: 'Completed', y: 250 },
        ];
        render(React.createElement(FunnelChart, { data: stages }));

        const defaultOptions = capturedOptions.at(-1);
        expect(defaultOptions.series[0].color).toBe('var(--chart-brand)');
        expect(defaultOptions.series[0].colorByPoint).toBe(false);
        expect(defaultOptions.series[0].data.map((d) => d.name)).toEqual([
            'Started',
            'Re-engaged',
            'Completed',
        ]);
        expect(defaultOptions.series[0].data.every((d) => d.color === undefined)).toBe(true);
        expect(defaultOptions.plotOptions.funnel.dataLabels.style.fontWeight).toBe('var(--type-weight-medium)');
        expect(defaultOptions.plotOptions.funnel.dataLabels.format).toContain('class="plus-chart-value"');
        expect(defaultOptions.plotOptions.funnel.dataLabels.format).not.toContain('<b>');
        expect(defaultOptions.tooltip.pointFormat).toContain('class="plus-chart-value"');
        expect(defaultOptions.tooltip.pointFormat).not.toContain('<b>');

        render(React.createElement(FunnelChart, { data: stages, sort: true }));
        const sortedOptions = capturedOptions.at(-1);
        expect(sortedOptions.series[0].data.map((d) => d.name)).toEqual([
            'Re-engaged',
            'Started',
            'Completed',
        ]);

        const tonedStages = toneByRank(stages, 'blue');
        render(React.createElement(FunnelChart, { data: tonedStages }));
        const tonedOptions = capturedOptions.at(-1);
        expect(tonedOptions.series[0].data.map((d) => d.name)).toEqual([
            'Started',
            'Re-engaged',
            'Completed',
        ]);
        // Biggest value ('Re-engaged', 650) gets the darkest tone (--chart-blue-boldest).
        expect(tonedOptions.series[0].data[1].color).toBe('var(--chart-blue-boldest)');
        expect(tonedOptions.series[0].data[2].color).toBe('var(--ds-background-accent-blue-subtler)');
    });

    it('NetworkGraph uses --chart-brand for its single series and drops tooltip-style override on dataLabels', () => {
        render(
            React.createElement(NetworkGraph, {
                data: [
                    ['Fractions', 'Ratios'],
                    ['Ratios', 'Percentages'],
                ],
            }),
        );

        const options = capturedOptions.at(-1);
        expect(options.chart.type).toBe('networkgraph');
        expect(options.plotOptions.networkgraph.link.color).toBe('var(--ds-border-bold)');
        expect(options.series[0].color).toBe('var(--chart-brand)');
        expect(options.series[0].dataLabels.style).toBeUndefined();
        expect(options.tooltip.pointFormat).toBe('{point.name}');
    });

    it('OrganizationChart uses --ds-text-inverse on level 0, --ds-border-bold on links, and inherits outside: true from chartTheme.tooltip', () => {
        render(
            React.createElement(OrganizationChart, {
                data: [
                    ['Director', 'Lead Math'],
                    ['Lead Math', 'Tutor A'],
                ],
            }),
        );

        const options = capturedOptions.at(-1);
        expect(options.chart.type).toBe('organization');
        expect(options.series[0].levels[0].dataLabels.color).toBe('var(--ds-text-inverse)');
        expect(options.series[0].link.color).toBe('var(--ds-border-bold)');
        expect(options.tooltip.outside).toBe(true);
        expect(options.tooltip.nodeFormat).toBe('{point.name}');
        expect(options.tooltip.pointFormat).toBe('{point.fromNode.name} → {point.toNode.name}');
    });

    it('SankeyDiagram replaces <b> in nodeFormat and pointFormat with the shared format helper', () => {
        render(
            React.createElement(SankeyDiagram, {
                data: [
                    ['School referral', 'First session', 120],
                    ['First session', 'Math', 90],
                ],
            }),
        );

        const options = capturedOptions.at(-1);
        expect(options.chart.type).toBe('sankey');
        expect(options.tooltip.nodeFormat).toContain('class="plus-chart-value"');
        expect(options.tooltip.pointFormat).toContain('class="plus-chart-value"');
        expect(options.tooltip.nodeFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).not.toContain('<b>');
    });

    it('WordCloud defaults to single-series --chart-brand (colorByPoint: false), sorts words most to least by weight, and formats tooltips without <b>', () => {
        const words = [
            { name: 'Clear', weight: 12 },
            { name: 'Helpful', weight: 30 },
            { name: 'Fun', weight: 7 },
        ];
        render(React.createElement(WordCloud, { data: words }));

        const sortedOptions = capturedOptions.at(-1);
        expect(sortedOptions.chart.type).toBe('wordcloud');
        expect(sortedOptions.series[0].color).toBe('var(--chart-brand)');
        expect(sortedOptions.series[0].colorByPoint).toBe(false);
        expect(sortedOptions.series[0].data.map((d) => d.name)).toEqual(['Helpful', 'Clear', 'Fun']);
        expect(sortedOptions.tooltip.pointFormat).toContain('class="plus-chart-value"');
        expect(sortedOptions.tooltip.pointFormat).not.toContain('<b>');

        render(React.createElement(WordCloud, { data: words, sort: false }));
        const unsortedOptions = capturedOptions.at(-1);
        expect(unsortedOptions.series[0].data.map((d) => d.name)).toEqual(['Clear', 'Helpful', 'Fun']);
    });
});
