import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components';
import BarChart from '@/dataviz/comparison/BarChart/BarChart';
import LineChart from '@/dataviz/temporal/LineChart/LineChart';
import PieChart from '@/dataviz/part-to-whole/PieChart/PieChart';
import Highcharts from '@/dataviz/highchartsModules';
import {
    ChartMotionArea,
    chartEntrance,
    chartStateTransition,
} from '@/dataviz/chartMotion';
import { MotionPreferenceContext } from '@/lib/motionPreference';

/**
 * Specimens for Data visualizations/Foundations — the chart foundations
 * besides color: spacing, radius, elevation, stroke, type, motion. All come
 * off the same component tokens as the rest of the design system.
 */
export default {
    title: 'Data visualizations/Foundations',
    tags: ['!dev', '!autodocs'],
};

/** Columns rounding only the value end, at `--chart-bar-radius`. */
export const BarRadius = () => (
    <div style={{ maxWidth: 480 }}>
        <BarChart
            categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
            series={[{ name: 'Sessions', data: [12, 19, 8, 24, 16] }]}
            showLegend={false}
        />
    </div>
);

/** The tooltip's surface, shadow, radius and padding — the Popup pattern's tokens, not Highcharts' own `shadow`/`borderRadius`. */
export const TooltipSurface = () => (
    <div style={{ padding: 'var(--card-pad-compact)', background: 'var(--ds-surface-sunken)', display: 'inline-block' }}>
        <div
            style={{
                background: 'var(--ds-surface-overlay)',
                borderRadius: 'var(--popup-radius)',
                boxShadow: 'var(--ds-shadow-overlay)',
                padding: 'var(--popup-pad)',
                color: 'var(--ds-text)',
                fontFamily: 'var(--type-family-body)',
                fontSize: 'var(--type-size-0875)',
            }}
        >
            Thursday: <b>24 sessions</b>
        </div>
    </div>
);

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
    gap: 'var(--section-stack-md)',
};

const barStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--pad-x-sm)',
};

const labelStyle = {
    color: 'var(--ds-text-subtle)',
    fontFamily: 'var(--type-family-body)',
    fontSize: 'var(--type-size-0875)',
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--section-stack-md)',
};

const cardStyle = {
    background: 'var(--ds-surface-raised)',
    borderRadius: 'var(--card-radius)',
    border: '1px solid var(--ds-border)',
};

const findChart = (containerEl) =>
    Highcharts.charts.find((c) => c && c.renderTo && containerEl.contains(c.renderTo));

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
                <ChartMotionArea data-motion-specimen="productive">
                    <div style={gridStyle}>
                        <div data-chart-slot="0" style={cardStyle}>
                            <BarChart
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
                <ChartMotionArea data-motion-specimen="reduced">
                    <div data-chart-slot="reduced" style={cardStyle}>
                        <BarChart
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
        const reducedExpected = chartEntrance({ reduced: true });
        const stateExpected = chartStateTransition();

        const productiveSlots = [0, 1, 2].map((i) =>
            findChart(canvasElement.querySelector(`[data-chart-slot="${i}"]`)),
        );
        for (const [index, chart] of productiveSlots.entries()) {
            expect(chart, `productive chart ${index}`).toBeDefined();
            expect(chart.__plusInitialEntrance.duration).toBe(productiveExpected.duration);
            expect(typeof chart.__plusInitialEntrance.easing).toBe('function');
            expect(chart.__plusInitialEntrance.easing(1)).toBe(1);
            expect(chart.__plusInitialEntrance.defer ?? 0).toBe(index * 20);
            expect(chart.__plusInitialStateTransition.duration).toBe(stateExpected.duration);
            expect(chart.options.chart.animation).toBe(false);
            expect(chart.series[0].options.animation).toBe(false);
        }

        const reducedChart = findChart(canvasElement.querySelector('[data-chart-slot="reduced"]'));
        expect(reducedChart).toBeDefined();
        expect(reducedChart.__plusInitialEntrance.duration).toBe(reducedExpected.duration);
        expect(reducedChart.__plusInitialEntrance.easing(1)).toBe(1);
        expect(reducedChart.options.chart.animation).toBe(false);

        await userEvent.click(canvas.getByRole('button', { name: /switch term data/i }));
        await waitFor(() => {
            expect(canvas.getByText(/showing: spring term/i)).toBeInTheDocument();
        });

        for (const chart of [...productiveSlots, reducedChart]) {
            expect(chart.options.chart.animation).toBe(false);
            expect(chart.renderer.globalAnimation).toBe(false);
            expect(chart.series[0].options.animation).toBe(false);
        }
        expect(productiveSlots[0].series[0].points.map((p) => p.y)).toEqual(
            TERM_DATASETS.previous.bars,
        );
    },
};
