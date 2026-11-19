import React, { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components';
import BarChart from '@/dataviz/comparison/BarChart/BarChart';
import LineChart from '@/dataviz/temporal/LineChart/LineChart';
import PieChart from '@/dataviz/part-to-whole/PieChart/PieChart';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import {
    dataLabelFormat,
    tooltipHeaderFormat,
    tooltipPointFormat,
} from '@/dataviz/chartFormat';
import { CATEGORICAL, hoveredColor } from '@/dataviz/palette';
import Highcharts from '@/dataviz/highchartsModules';
import {
    ChartMotionArea,
    chartEntrance,
    chartStateTransition,
} from '@/dataviz/chartMotion';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { resolveColor } from '@/dataviz/colorMode';

/**
 * Specimens for Data visualizations/Foundations — the chart foundations
 * besides color: spacing, radius, elevation, stroke, type, states, motion.
 * All come off the same component tokens as the rest of the design system.
 */
export default {
    title: 'Data visualizations/Foundations',
    tags: ['!dev', '!autodocs'],
};

/** Columns rounding only the value end, at `--chart-bar-radius`. */
export const BarRadius = () => (
    <div style={{ maxWidth: 'var(--card-min-width-lg)' }}>
        <BarChart
            sort={false}
            categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
            series={[{ name: 'Sessions', data: [12, 19, 8, 24, 16] }]}
            showLegend={false}
        />
    </div>
);

/** The tooltip's surface, shadow, radius and padding — the Popup template's tokens on a live chart tooltip. */
function TooltipSurfaceSpecimen() {
    const slotRef = useRef(null);
    useEffect(() => {
        const slot = slotRef.current;
        if (!slot) return undefined;
        const chart = findChart(slot);
        if (chart?.series?.[0]?.points?.[3]) {
            chart.tooltip.refresh(chart.series[0].points[3]);
        }
        return undefined;
    }, []);

    return (
        <div style={stackStyle}>
            <span style={labelStyle}>Tooltip styled with Popup surface, shadow, radius and padding tokens (open at rest; hover any bar to move it).</span>
            <div ref={slotRef} data-specimen="tooltip-chart" style={{ ...cardStyle, maxWidth: 'var(--card-min-width-lg)' }}>
                <BarChart
                    sort={false}
                    height={220}
                    categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
                    series={[{ name: 'Sessions', data: [12, 19, 8, 24, 16] }]}
                    showLegend={false}
                />
            </div>
        </div>
    );
}

export const TooltipSurface = {
    render: () => <TooltipSurfaceSpecimen />,
    play: async ({ canvasElement }) => {
        const slot = canvasElement.querySelector('[data-specimen="tooltip-chart"]');
        await waitFor(() => expect(slot.querySelector('.highcharts-container')).not.toBeNull());
        const doc = canvasElement.ownerDocument;
        await waitFor(() => expect(doc.querySelector('.highcharts-tooltip-container .plus-chart-value')).not.toBeNull());
        const tooltip = doc.querySelector('.highcharts-tooltip-container');
        expect(tooltip).toHaveTextContent('24');
        expect(getComputedStyle(tooltip).backgroundColor).toBe(resolveColor('--ds-surface-overlay', canvasElement));
        // The padding is inside the box Highcharts positions, so the window-edge clamp
        // covers the whole surface and an open tooltip never widens a narrow page.
        const box = tooltip.querySelector('svg').getBoundingClientRect();
        expect(tooltip.getBoundingClientRect().width, 'the surface is as wide as the box').toBeCloseTo(box.width, 0);
    },
};

const TERM_DATASETS = {
    current: {
        label: 'Fall term',
        bars: [18, 24, 15, 29],
        line: [68, 72, 76, 81],
        pie: [
            { name: 'Algebra', y: 45 },
            { name: 'Geometry', y: 35 },
            { name: 'Writing', y: 20 },
        ],
    },
    previous: {
        label: 'Spring term',
        bars: [14, 19, 22, 25],
        line: [62, 65, 70, 74],
        pie: [
            { name: 'Algebra', y: 38 },
            { name: 'Geometry', y: 40 },
            { name: 'Writing', y: 22 },
        ],
    },
};

const stackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--stack-xl)',
};

const barStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--pad-x-sm)',
};

const labelStyle = {
    color: 'var(--ds-text-subtle)',
    font: 'var(--body-default)',
    fontWeight: 'var(--type-weight-medium)',
    fontVariantNumeric: 'tabular-nums',
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' /* token gap: 220px */,
    gap: 'var(--stack-xl) var(--inline-xl)',
};

const cardStyle = {
    background: 'var(--ds-surface-raised)',
    borderRadius: 'var(--card-radius)',
    border: 'var(--border-width-default) solid var(--ds-border)',
};

const findChart = (containerEl) =>
    Highcharts.charts.find((c) => c && c.renderTo && containerEl.contains(c.renderTo));

const TYPE_OPTIONS = {
    ...chartTheme,
    chart: {
        ...chartTheme.chart,
        type: 'column',
        height: 260,
    },
    title: {
        ...chartTheme.title,
        text: 'Weekly tutoring sessions',
    },
    subtitle: {
        ...chartTheme.subtitle,
        text: 'Completed vs scheduled across 4 cohorts',
    },
    caption: {
        ...chartTheme.caption,
        text: 'Figures align on tabular numerals across axes, data labels and legends.',
    },
    xAxis: {
        ...chartTheme.xAxis,
        categories: ['Cohort 1', 'Cohort 2', 'Cohort 3', 'Cohort 4'],
        title: {
            ...chartTheme.xAxis.title,
            text: 'Cohort',
        },
    },
    yAxis: {
        ...chartTheme.yAxis,
        title: {
            ...chartTheme.yAxis.title,
            text: 'Sessions',
        },
    },
    plotOptions: {
        ...chartTheme.plotOptions,
        column: {
            ...chartTheme.plotOptions.column,
            dataLabels: {
                enabled: true,
                format: dataLabelFormat('{point.y:,.0f}'),
            },
        },
    },
    tooltip: {
        ...chartTheme.tooltip,
        headerFormat: tooltipHeaderFormat(),
        pointFormat: tooltipPointFormat({ value: '{point.y:,.0f}' }),
    },
    series: [
        {
            name: 'Completed (1,110)',
            color: CATEGORICAL[0],
            data: [118, 245, 312, 435],
        },
        {
            name: 'Scheduled (1,240)',
            color: CATEGORICAL[1],
            data: [130, 260, 340, 510],
        },
    ],
};

/**
 * Noto Sans (`--type-family-body`) across every text slot, weights 500 and 600
 * only, tabular figures (`tabular-nums`) on every number slot, and tooltip
 * text in `--ds-text` with the series color confined to the leading swatch.
 */
export const TypeAndNumbers = {
    render: () => (
        <div data-specimen="type-chart" style={cardStyle}>
            <PlusChart
                options={TYPE_OPTIONS}
                callback={(chart) => {
                    if (chart?.series?.[0]?.points?.[3]) {
                        chart.tooltip.refresh(chart.series[0].points[3]);
                    }
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const slot = canvasElement.querySelector('[data-specimen="type-chart"]');
        await waitFor(() => {
            expect(slot.querySelector('.highcharts-container')).not.toBeNull();
        });

        const doc = canvasElement.ownerDocument;
        await waitFor(() => {
            expect(doc.querySelector('.highcharts-tooltip-container .plus-chart-value')).not.toBeNull();
        });

        const container = slot.querySelector('.highcharts-container');
        const title = container.querySelector('.highcharts-title');
        const subtitle = container.querySelector('.highcharts-subtitle');
        const caption = container.querySelector('.highcharts-caption');
        const axisLabel = container.querySelector('.highcharts-axis-labels text');
        const dataLabelValue = container.querySelector('.highcharts-data-label .plus-chart-value');
        const legendItem = container.querySelector('.highcharts-legend-item text');
        const tooltipEl = doc.querySelector('.highcharts-tooltip-container .highcharts-tooltip');
        const tooltipValue = doc.querySelector('.highcharts-tooltip-container .plus-chart-value');

        expect(getComputedStyle(title).fontFamily).toContain('Noto Sans');
        expect(getComputedStyle(title).fontWeight).toBe('600');
        expect(getComputedStyle(subtitle).fontWeight).toBe('500');
        expect(getComputedStyle(caption).fontWeight).toBe('500');
        expect(getComputedStyle(tooltipEl).color).toBe(resolveColor('--ds-text', canvasElement));

        for (const numEl of [axisLabel, dataLabelValue, legendItem, tooltipValue]) {
            expect(numEl).not.toBeNull();
            const cs = getComputedStyle(numEl);
            expect(cs.fontFamily).toContain('Noto Sans');
            expect(cs.fontVariantNumeric).toBe('tabular-nums');
        }
        expect(getComputedStyle(dataLabelValue).fontWeight).toBe('600');
        expect(getComputedStyle(tooltipValue).fontWeight).toBe('600');
    },
};

function StatesSpecimen() {
    const [selectedIndex, setSelectedIndex] = useState(1);

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'column',
            height: 220,
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: ['Mon', 'Tue', 'Wed', 'Thu'],
        },
        plotOptions: {
            ...chartTheme.plotOptions,
            column: {
                ...chartTheme.plotOptions.column,
                allowPointSelect: true,
            },
        },
        series: [
            {
                name: 'Algebra',
                color: CATEGORICAL[0],
                data: [18, 26, 21, 30].map((y, idx) => ({
                    y,
                    selected: idx === selectedIndex,
                })),
            },
            {
                name: 'Geometry',
                color: CATEGORICAL[1],
                data: [14, 19, 17, 23],
            },
        ],
    };

    return (
        <div style={stackStyle}>
            <div style={barStyle}>
                <span style={labelStyle}>
                    Hover a bar for its hovered token; selected bar wears selected background and border.
                </span>
                <Button
                    appearance="subtle"
                    spacing="compact"
                    onClick={() => setSelectedIndex((prev) => (prev + 1) % 4)}
                >
                    Cycle selected bar
                </Button>
            </div>
            <div data-specimen="states-chart" style={cardStyle}>
                <PlusChart options={options} />
            </div>
        </div>
    );
}

/**
 * Hover shifts a mark to its `-hovered` chart token while inactive series fade
 * to `--ds-opacity-chart-inactive`; selected marks take `--ds-background-selected`
 * and a 1px `--ds-border-selected` outline, never `--chart-brand`.
 */
export const States = {
    render: () => <StatesSpecimen />,
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('[data-specimen="states-chart"] .highcharts-container')).not.toBeNull();
        });

        const slot = canvasElement.querySelector('[data-specimen="states-chart"]');
        const chart = findChart(slot);
        expect(chart).toBeDefined();

        // Hover state uses the series' -hovered chart token, and inactive series uses --ds-opacity-chart-inactive (0.3).
        expect(chart.series[0].options.states.hover.color).toBe(hoveredColor(CATEGORICAL[0]));
        expect(chart.series[1].options.states.hover.color).toBe(hoveredColor(CATEGORICAL[1]));
        expect(chart.options.plotOptions.series.states.inactive.opacity).toBe(0.3);

        const hoveredFill = resolveColor('--chart-categorical-1-hovered', canvasElement);
        const selectedFill = resolveColor('--ds-background-selected', canvasElement);
        const brandFill = resolveColor('--chart-brand', canvasElement);
        const selectedBorder = resolveColor('--ds-border-selected', canvasElement);

        const firstPoint = chart.series[0].points[0];
        firstPoint.setState('hover');
        await waitFor(() => {
            expect(getComputedStyle(firstPoint.graphic.element).fill).toBe(hoveredFill);
        });
        firstPoint.setState('');

        // Selected point uses --ds-background-selected fill and --ds-border-selected stroke, never --chart-brand.
        const selectedPoint = chart.series[0].points[1];
        expect(selectedPoint.selected).toBe(true);
        const selectedStyle = getComputedStyle(selectedPoint.graphic.element);
        expect(selectedStyle.fill).toBe(selectedFill);
        expect(selectedStyle.fill).not.toBe(brandFill);
        expect(selectedStyle.stroke).toBe(selectedBorder);
    },
};

function MotionSpecimen() {
    const [term, setTerm] = useState('current');
    const active = TERM_DATASETS[term];

    return (
        <div style={stackStyle}>
            <div style={barStyle}>
                <span style={labelStyle}>Showing: {active.label}</span>
                <Button
                    appearance="subtle"
                    spacing="compact"
                    onClick={() => setTerm((prev) => (prev === 'current' ? 'previous' : 'current'))}
                >
                    Switch term data
                </Button>
            </div>

            <MotionPreferenceContext.Provider value={false}>
                <ChartMotionArea>
                    <div style={gridStyle}>
                        <div data-chart-slot="0" style={cardStyle}>
                            <BarChart
                                sort={false}
                                height={200}
                                categories={['W1', 'W2', 'W3', 'W4']}
                                series={[{ name: 'Sessions', data: active.bars }]}
                                showLegend={false}
                            />
                        </div>
                        <div data-chart-slot="1" style={cardStyle}>
                            <LineChart
                                height={200}
                                data={[
                                    {
                                        name: 'Mastery',
                                        data: active.line,
                                        categories: ['W1', 'W2', 'W3', 'W4'],
                                    },
                                ]}
                            />
                        </div>
                        <div data-chart-slot="2" style={cardStyle}>
                            <PieChart height={200} data={active.pie} showLegend={false} />
                        </div>
                    </div>
                </ChartMotionArea>
            </MotionPreferenceContext.Provider>

            <MotionPreferenceContext.Provider value={true}>
                <ChartMotionArea>
                    <div data-chart-slot="reduced" style={cardStyle}>
                        <BarChart
                            sort={false}
                            height={180}
                            categories={['W1', 'W2', 'W3', 'W4']}
                            series={[{ name: 'Reduced motion', data: active.bars }]}
                            showLegend={false}
                        />
                    </div>
                </ChartMotionArea>
            </MotionPreferenceContext.Provider>
        </div>
    );
}

/**
 * Charts in one area share a 20 ms stagger on `spatial.default`, collapse to
 * the `appearance.fast` fade under reduced motion, and stay still when data
 * updates after the first render.
 */
export const Motion = {
    render: () => <MotionSpecimen />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(4);
        });

        const productiveExpected = chartEntrance({ reduced: false });
        const stateExpected = chartStateTransition();

        const productiveSlots = [0, 1, 2].map((i) =>
            findChart(canvasElement.querySelector(`[data-chart-slot="${i}"]`)),
        );
        // The entrance is what PlusChart handed Highcharts; after the first draw
        // the chart instance itself carries animation: false, so nothing replays.
        for (const [index, chart] of productiveSlots.entries()) {
            expect(chart, `productive chart ${index}`).toBeDefined();
            const seriesEntrance = chart.userOptions.plotOptions.series.animation;
            const hoverState = chart.options.plotOptions.series.states.hover.animation;

            expect(seriesEntrance.duration).toBe(productiveExpected.duration);
            expect(typeof seriesEntrance.easing).toBe('function');
            expect(seriesEntrance.easing(1)).toBe(1);
            expect(seriesEntrance.defer).toBe(index * 20);
            expect(hoverState.duration).toBe(stateExpected.duration);
            expect(chart.options.chart.animation).toBe(false);
        }

        const reducedChart = findChart(canvasElement.querySelector('[data-chart-slot="reduced"]'));
        expect(reducedChart).toBeDefined();
        // Reduced motion: marks draw at their final value and the container
        // fades in on the appearance.fast spring (timing is unit-tested).
        expect(reducedChart.userOptions.plotOptions.series.animation).toBe(false);
        await waitFor(() => {
            expect(reducedChart.container.style.opacity).not.toBe('0');
        });

        // A container resize redraws with the chart's own animation, now off.
        productiveSlots[0].setSize(undefined, undefined);
        expect(productiveSlots[0].renderer.globalAnimation).toBe(false);

        await userEvent.click(canvas.getByRole('button', { name: /switch term data/i }));
        await waitFor(() => {
            expect(canvas.getByText(/showing: spring term/i)).toBeInTheDocument();
        });

        for (const chart of [...productiveSlots, reducedChart]) {
            expect(chart.options.chart.animation).toBe(false);
            expect(chart.options.plotOptions.series.animation).toBe(false);
            expect(chart.renderer.globalAnimation).toBe(false);
            expect(chart.series[0].options.animation).toBe(false);
        }
        expect(productiveSlots[0].series[0].points.map((p) => p.y)).toEqual(
            TERM_DATASETS.previous.bars,
        );
    },
};
