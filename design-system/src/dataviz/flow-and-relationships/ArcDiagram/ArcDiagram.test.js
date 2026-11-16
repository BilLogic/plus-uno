import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHART_NODE_RADIUS, CHART_SPACING_COMPACT } from '@/dataviz/chartTheme';
import { BRAND, CATEGORICAL, CHROME, toneByRank } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: React.forwardRef((props, ref) => {
        capturedOptions.push(props.options);
        React.useImperativeHandle(ref, () => ({ container: { current: null }, chart: null }));
        return React.createElement('div', { 'data-testid': 'mock-plus-chart' });
    }),
}));

import ArcDiagram from './ArcDiagram';
import DependencyWheel from '../DependencyWheel/DependencyWheel';
import FunnelChart from '../FunnelChart/FunnelChart';
import NetworkGraph from '../NetworkGraph/NetworkGraph';
import OrganizationChart from '../OrganizationChart/OrganizationChart';
import SankeyDiagram from '../SankeyDiagram/SankeyDiagram';
import TreegraphChart from '../TreegraphChart/TreegraphChart';
import WordCloud from '../WordCloud/WordCloud';

const REMOVED_ANIMATION_PROPS = ['animate', 'animationDelay', 'animationDuration', 'enableAnimation'];

describe('Flow and relationship charts on the shared foundation (#2585)', () => {
    beforeEach(() => {
        capturedOptions.length = 0;
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

    it('DependencyWheel takes label distance from CHART_SPACING_COMPACT, drops tooltip-style override on dataLabels, and formats tooltips without <b>', () => {
        render(
            React.createElement(DependencyWheel, {
                data: [
                    ['Reading', 'Comprehension', 5],
                    ['Reading', 'Vocabulary', 4],
                ],
            }),
        );

        const options = capturedOptions.at(-1);
        expect(options.chart.type).toBe('dependencywheel');
        expect(options.series[0].dataLabels.distance).toBe(CHART_SPACING_COMPACT);
        expect(options.series[0].dataLabels.style).toBeUndefined();
        expect(options.series[0].dataLabels.color).toBeUndefined();
        expect(options.tooltip.nodeFormat).toContain('class="plus-chart-value"');
        expect(options.tooltip.pointFormat).toContain('class="plus-chart-value"');
        expect(options.tooltip.nodeFormat).not.toContain('<b>');
        expect(options.tooltip.pointFormat).not.toContain('<b>');
    });

    it('FunnelChart keeps stage order by default (sort={false}), sorts most to least when sort={true}, supports toneByRank, and formats labels and tooltips without <b>', () => {
        const stages = [
            { name: 'Started', y: 400 },
            { name: 'Re-engaged', y: 650 },
            { name: 'Completed', y: 250 },
        ];
        render(React.createElement(FunnelChart, { data: stages }));

        const defaultOptions = capturedOptions.at(-1);
        expect(defaultOptions.series[0].data.map((d) => d.name)).toEqual([
            'Started',
            'Re-engaged',
            'Completed',
        ]);
        expect(defaultOptions.series[0].data.map((d) => d.color)).toEqual([
            CATEGORICAL[0],
            CATEGORICAL[1],
            CATEGORICAL[2],
        ]);
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

    it('NetworkGraph uses BRAND for its single series and drops tooltip-style override on dataLabels', () => {
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
        expect(options.plotOptions.networkgraph.link.color).toBe(CHROME.link);
        expect(options.series[0].color).toBe(BRAND);
        expect(options.series[0].dataLabels.style).toBeUndefined();
        expect(options.tooltip.pointFormat).toBe('{point.name}');
    });

    it('OrganizationChart uses CHROME.textInverse on level 0, CHROME.link on links, and formats tooltips without <b>', () => {
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
        expect(options.series[0].levels[0].dataLabels.color).toBe(CHROME.textInverse);
        expect(options.series[0].link.color).toBe(CHROME.link);
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

    it('TreegraphChart uses the role radius CHART_NODE_RADIUS (--radius-lg, 8) rather than a control radius and drops redundant data-label style', () => {
        expect(CHART_NODE_RADIUS).toBe(8);

        render(
            React.createElement(TreegraphChart, {
                data: [
                    { id: 'math', name: 'Math' },
                    { id: 'fractions', parent: 'math', name: 'Fractions' },
                ],
            }),
        );

        const options = capturedOptions.at(-1);
        expect(options.chart.type).toBe('treegraph');
        expect(options.series[0].borderRadius).toBe(CHART_NODE_RADIUS);
        expect(options.series[0].dataLabels.style).toBeUndefined();
        expect(options.tooltip.pointFormat).toBe('{point.name}');
    });

    it('WordCloud sorts words from most to least by weight by default, preserves order when sort={false}, and formats tooltips without <b>', () => {
        const words = [
            { name: 'Clear', weight: 12 },
            { name: 'Helpful', weight: 30 },
            { name: 'Fun', weight: 7 },
        ];
        render(React.createElement(WordCloud, { data: words }));

        const sortedOptions = capturedOptions.at(-1);
        expect(sortedOptions.chart.type).toBe('wordcloud');
        expect(sortedOptions.series[0].data.map((d) => d.name)).toEqual(['Helpful', 'Clear', 'Fun']);
        expect(sortedOptions.tooltip.pointFormat).toContain('class="plus-chart-value"');
        expect(sortedOptions.tooltip.pointFormat).not.toContain('<b>');

        render(React.createElement(WordCloud, { data: words, sort: false }));
        const unsortedOptions = capturedOptions.at(-1);
        expect(unsortedOptions.series[0].data.map((d) => d.name)).toEqual(['Clear', 'Helpful', 'Fun']);
    });
});
