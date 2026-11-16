import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { measureSpring, springStep } from '@/tokens/spring.js';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { staggerDelays } from '@/lib/listMotion';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import Highcharts from './highchartsModules';
import chartTheme, { CHART_ANIMATION_DURATION_MS } from './chartTheme';
import PlusChart from './PlusChart';
import * as chartMotionModule from './chartMotion';
import {
    ChartMotionArea,
    chartEntrance,
    chartStateTransition,
} from './chartMotion';

const capturedProps = [];
const capturedContainers = [];

vi.mock('highcharts-react-official', () => ({
    default: React.forwardRef((props, ref) => {
        const divRef = React.useRef(null);
        capturedProps.push(props);
        React.useImperativeHandle(ref, () => ({
            get chart() {
                return { container: divRef.current };
            },
            container: divRef,
        }));
        return React.createElement('div', {
            'data-testid': 'mock-highcharts-react',
            ...props.containerProps,
            ref: (el) => {
                divRef.current = el;
                if (el && !capturedContainers.includes(el)) {
                    capturedContainers.push(el);
                }
            },
        });
    }),
}));

const h = React.createElement;

const configFor = (entry) => {
    const { stiffness, damping, mass = 1 } = entry;
    return {
        stiffness,
        ratio: damping / (2 * Math.sqrt(stiffness * mass)),
        mass,
    };
};

describe('chartMotion and PlusChart', () => {
    beforeEach(() => {
        capturedProps.length = 0;
        capturedContainers.length = 0;
    });

    it('maps spatial.default productive to a Highcharts spring animation whose easing matches springStep and ends at 1', () => {
        const cfg = configFor(SPRINGS['spatial.default'].productive);
        const { settle } = measureSpring(cfg);
        const step = springStep(cfg);
        const anim = chartEntrance();

        expect(anim.duration).toBe(Math.round(settle * 1000));
        expect(typeof anim.easing).toBe('function');
        expect(anim.easing(0)).toBe(0);
        expect(anim.easing(1)).toBe(1);

        for (const pos of [0.1, 0.25, 0.5, 0.75, 0.9]) {
            expect(anim.easing(pos)).toBeCloseTo(step(pos * settle), 6);
        }
    });

    it('uses the expressive spatial.default spring when expressive is set', () => {
        const cfg = configFor(SPRINGS['spatial.default'].expressive);
        const { settle } = measureSpring(cfg);
        const step = springStep(cfg);
        const anim = chartEntrance({ expressive: true });

        expect(anim.duration).toBe(Math.round(settle * 1000));
        expect(anim.easing(0)).toBe(0);
        expect(anim.easing(1)).toBe(1);
        for (const pos of [0.2, 0.5, 0.8]) {
            expect(anim.easing(pos)).toBeCloseTo(step(pos * settle), 6);
        }
        // Expressive spatial.default (ratio 0.8) overshoots past 1 before settling.
        const samples = Array.from({ length: 19 }, (_, i) => anim.easing((i + 1) / 20));
        expect(Math.max(...samples)).toBeGreaterThan(1);
    });

    it('collapses entrance to the appearance.fast fade under reduced motion, even inside an expressive container', () => {
        const cfg = configFor(SPRINGS['appearance.fast'].productive);
        const { settle } = measureSpring(cfg);
        const step = springStep(cfg);
        const reducedAnim = chartEntrance({ reduced: true });
        const reducedExpressive = chartEntrance({ reduced: true, expressive: true });
        const stateAnim = chartStateTransition();

        expect(reducedAnim.duration).toBe(Math.round(settle * 1000));
        expect(reducedAnim.duration).toBe(stateAnim.duration);
        expect(reducedExpressive.duration).toBe(stateAnim.duration);

        for (const pos of [0.1, 0.3, 0.6, 0.9]) {
            expect(reducedAnim.easing(pos)).toBeCloseTo(step(pos * settle), 6);
            expect(reducedExpressive.easing(pos)).toBeCloseTo(step(pos * settle), 6);
        }
        expect(reducedAnim.easing(1)).toBe(1);
    });

    it('maps state transitions (hover, inactive) to appearance.fast with no dead reduced param', () => {
        const cfg = configFor(SPRINGS['appearance.fast'].productive);
        const { settle } = measureSpring(cfg);
        const step = springStep(cfg);
        const anim = chartStateTransition();

        expect(chartStateTransition.length).toBe(0);
        expect(anim.duration).toBe(Math.round(settle * 1000));
        expect(anim.easing(0)).toBe(0);
        expect(anim.easing(1)).toBe(1);
        for (const pos of [0.2, 0.5, 0.8]) {
            expect(anim.easing(pos)).toBeCloseTo(step(pos * settle), 6);
        }
    });

    it('builds theme chart and series animations from chartMotion with no eased curve name or ms literal, and removes dead exports', () => {
        const entrance = chartEntrance();
        const state = chartStateTransition();

        expect(chartTheme.chart.animation.duration).toBe(entrance.duration);
        expect(typeof chartTheme.chart.animation.easing).toBe('function');
        expect(chartTheme.plotOptions.series.animation.duration).toBe(entrance.duration);
        expect(typeof chartTheme.plotOptions.series.animation.easing).toBe('function');
        expect(chartTheme.plotOptions.series.states.hover.animation.duration).toBe(state.duration);
        expect(typeof chartTheme.plotOptions.series.states.hover.animation.easing).toBe('function');
        expect(chartTheme.plotOptions.series.states.inactive.animation.duration).toBe(state.duration);
        expect(typeof chartTheme.plotOptions.series.states.inactive.animation.easing).toBe('function');
        expect(CHART_ANIMATION_DURATION_MS).toBe(entrance.duration);

        expect(chartMotionModule.useChartMotion).toBeUndefined();
        expect(chartMotionModule.chartAnimationOptions).toBeUndefined();
        expect(chartMotionModule.CHART_UPDATE_ARGS).toBeUndefined();
        expect(chartMotionModule.installChartMotionLifecycle).toBeUndefined();

        const themeSource = readFileSync(join(__dirname, 'chartTheme.js'), 'utf8');
        expect(themeSource).not.toMatch(/easeOut|easeIn|easeInOut|cubic-bezier|swing|linear\(/);
        expect(themeSource).not.toMatch(/--ds-motion-[\w-]+,\s*\d+/);
        expect(themeSource).not.toMatch(/duration\s*:\s*\d+/);
    });

    it('PlusChart carries the spring entrance and appearance.fast state animations on first render, matching springStep at sampled points', () => {
        const cfg = configFor(SPRINGS['spatial.default'].productive);
        const { settle } = measureSpring(cfg);
        const step = springStep(cfg);
        const stateCfg = configFor(SPRINGS['appearance.fast'].productive);
        const stateMeasured = measureSpring(stateCfg);
        const stateStep = springStep(stateCfg);

        render(
            h(
                MotionPreferenceContext.Provider,
                { value: false },
                h(PlusChart, {
                    options: {
                        chart: { type: 'line' },
                        series: [{ name: 'Score', data: [10, 20, 30] }],
                    },
                }),
            ),
        );

        expect(capturedProps).toHaveLength(1);
        const { highcharts, options } = capturedProps[0];
        expect(highcharts).toBe(Highcharts);

        const chartAnim = options.chart.animation;
        const seriesAnim = options.plotOptions.series.animation;
        const hoverAnim = options.plotOptions.series.states.hover.animation;
        const inactiveAnim = options.plotOptions.series.states.inactive.animation;

        expect(chartAnim.duration).toBe(Math.round(settle * 1000));
        expect(seriesAnim.duration).toBe(Math.round(settle * 1000));
        expect(chartAnim.defer).toBe(0);
        expect(seriesAnim.defer).toBe(0);

        for (const pos of [0.1, 0.25, 0.5, 0.75, 0.9]) {
            expect(chartAnim.easing(pos)).toBeCloseTo(step(pos * settle), 6);
            expect(seriesAnim.easing(pos)).toBeCloseTo(step(pos * settle), 6);
            expect(hoverAnim.easing(pos)).toBeCloseTo(stateStep(pos * stateMeasured.settle), 6);
            expect(inactiveAnim.easing(pos)).toBeCloseTo(stateStep(pos * stateMeasured.settle), 6);
        }
        expect(hoverAnim.duration).toBe(Math.round(stateMeasured.settle * 1000));
        expect(inactiveAnim.duration).toBe(Math.round(stateMeasured.settle * 1000));
    });

    it('PlusChart sets animation: false and passes updateArgs [true, true, false] on every rerender with new data', () => {
        const { rerender } = render(
            h(PlusChart, {
                options: {
                    chart: { type: 'column' },
                    series: [{ name: 'Sessions', data: [10, 20] }],
                },
            }),
        );

        expect(capturedProps[0].options.chart.animation).not.toBe(false);
        expect(capturedProps[0].options.plotOptions.series.animation).not.toBe(false);

        rerender(
            h(PlusChart, {
                options: {
                    chart: { type: 'column' },
                    series: [{ name: 'Sessions', data: [30, 40] }],
                },
            }),
        );

        const second = capturedProps.at(-1);
        expect(second.options.chart.animation).toBe(false);
        expect(second.options.plotOptions.series.animation).toBe(false);
        expect(second.updateArgs).toEqual([true, true, false]);
    });

    it('pins reduced motion both ways: reduced disables series grow and fades container opacity 0->1 on appearance.fast; not reduced uses spatial.default grow', () => {
        const reducedExpected = chartEntrance({ reduced: true });
        const productiveExpected = chartEntrance({ reduced: false });

        const rafCallbacks = [];
        let nowMs = 1000;
        const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
        const rafSpy = vi
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((cb) => {
                rafCallbacks.push(cb);
                return rafCallbacks.length;
            });
        const cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

        try {
            render(
                h(
                    MotionPreferenceContext.Provider,
                    { value: true },
                    h(PlusChart, {
                        expressive: true,
                        options: {
                            chart: { type: 'line' },
                            series: [{ name: 'Score', data: [1, 2, 3] }],
                        },
                    }),
                ),
            );

            const { options, containerProps } = capturedProps[0];
            // Under reduced motion, marks draw at final geometry (series.animation: false)
            expect(options.plotOptions.series.animation).toBe(false);
            expect(options.chart.animation.duration).toBe(reducedExpected.duration);
            expect(containerProps?.style?.opacity).toBe(0);

            const containerEl = capturedContainers[0];
            expect(containerEl).toBeDefined();
            expect(containerEl.style.opacity).toBe('0');

            // Step halfway through the appearance.fast spring
            nowMs = 1000 + reducedExpected.duration * 0.5;
            const firstTick = rafCallbacks.shift();
            expect(typeof firstTick).toBe('function');
            firstTick(nowMs);
            expect(Number(containerEl.style.opacity)).toBeCloseTo(reducedExpected.easing(0.5), 5);

            // Step to completion (pos = 1)
            nowMs = 1000 + reducedExpected.duration;
            const secondTick = rafCallbacks.shift();
            expect(typeof secondTick).toBe('function');
            secondTick(nowMs);
            expect(containerEl.style.opacity).toBe('');

            // Not reduced -> spatial.default series grow, no opacity fade
            capturedProps.length = 0;
            capturedContainers.length = 0;
            rafCallbacks.length = 0;

            render(
                h(
                    MotionPreferenceContext.Provider,
                    { value: false },
                    h(PlusChart, {
                        options: {
                            chart: { type: 'line' },
                            series: [{ name: 'Score', data: [1, 2, 3] }],
                        },
                    }),
                ),
            );

            const notReduced = capturedProps[0];
            expect(notReduced.options.plotOptions.series.animation.duration).toBe(
                productiveExpected.duration,
            );
            expect(notReduced.containerProps).toBeUndefined();
            expect(rafCallbacks).toHaveLength(0);
        } finally {
            nowSpy.mockRestore();
            rafSpy.mockRestore();
            cafSpy.mockRestore();
        }
    });

    it('PlusChart keeps an explicit animation: false opt-out (such as Sparkline)', () => {
        render(
            h(
                ChartMotionArea,
                null,
                h(PlusChart, {
                    options: {
                        chart: { type: 'line' },
                        plotOptions: { series: { animation: false } },
                        series: [{ name: 'Spark', data: [1, 2, 3] }],
                    },
                }),
                h(PlusChart, {
                    options: {
                        chart: { type: 'line', animation: false },
                        series: [{ name: 'Explicit chart false', data: [4, 5, 6] }],
                    },
                }),
            ),
        );

        const lastTwo = capturedProps.slice(-2);
        expect(lastTwo[0].options.chart.animation).toBe(false);
        expect(lastTwo[0].options.plotOptions.series.animation).toBe(false);
        expect(lastTwo[1].options.chart.animation).toBe(false);
        expect(lastTwo[1].options.plotOptions.series.animation).toBe(false);
    });

    it('gives three charts in a ChartMotionArea evenly spaced defers matching staggerDelays(3), and six under the 500 ms cap matching staggerDelays(6)', () => {
        render(
            h(
                MotionPreferenceContext.Provider,
                { value: false },
                h(
                    ChartMotionArea,
                    null,
                    h(PlusChart, { options: { series: [{ data: [1] }] } }),
                    h(PlusChart, { options: { series: [{ data: [2] }] } }),
                    h(PlusChart, { options: { series: [{ data: [3] }] } }),
                ),
            ),
        );

        const threeCharts = capturedProps.slice(-3);
        expect(threeCharts.map((p) => p.options.chart.animation.defer)).toEqual(
            staggerDelays(3),
        );
        expect(threeCharts.map((p) => p.options.plotOptions.series.animation.defer)).toEqual(
            staggerDelays(3),
        );

        capturedProps.length = 0;
        render(
            h(
                MotionPreferenceContext.Provider,
                { value: false },
                h(
                    ChartMotionArea,
                    null,
                    ...Array.from({ length: 30 }, (_, i) =>
                        h(PlusChart, { key: i, options: { series: [{ data: [i] }] } }),
                    ),
                ),
            ),
        );

        const thirtyCharts = capturedProps.slice(-30);
        expect(thirtyCharts.map((p) => p.options.chart.animation.defer)).toEqual(
            staggerDelays(30),
        );
        expect(thirtyCharts.at(-1).options.chart.animation.defer).toBeLessThanOrEqual(500);

        capturedProps.length = 0;
        render(
            h(
                MotionPreferenceContext.Provider,
                { value: false },
                h(
                    ChartMotionArea,
                    null,
                    ...Array.from({ length: 6 }, (_, i) =>
                        h(PlusChart, { key: i, options: { series: [{ data: [i] }] } }),
                    ),
                ),
            ),
        );

        const sixCharts = capturedProps.slice(-6);
        expect(sixCharts.map((p) => p.options.chart.animation.defer)).toEqual(
            staggerDelays(6),
        );

        capturedProps.length = 0;
        const expressiveExpected = chartEntrance({ expressive: true });
        render(
            h(
                MotionPreferenceContext.Provider,
                { value: false },
                h(
                    ChartMotionArea,
                    { expressive: true },
                    h(PlusChart, { options: { series: [{ data: [1, 2] }] } }),
                ),
            ),
        );
        expect(capturedProps.at(-1).options.chart.animation.duration).toBe(
            expressiveExpected.duration,
        );
    });
});
