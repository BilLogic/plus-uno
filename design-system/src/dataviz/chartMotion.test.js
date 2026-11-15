import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { measureSpring, springStep } from '@/tokens/spring.js';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { staggerDelays } from '@/lib/listMotion';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import Highcharts from './highchartsModules';
import chartTheme, { CHART_ANIMATION_DURATION_MS } from './chartTheme';
import {
    CHART_UPDATE_ARGS,
    ChartMotionArea,
    chartAnimationOptions,
    chartEntrance,
    chartStateTransition,
    useChartMotion,
} from './chartMotion';

const h = React.createElement;

const configFor = (entry) => {
    const { stiffness, damping, mass = 1 } = entry;
    return {
        stiffness,
        ratio: damping / (2 * Math.sqrt(stiffness * mass)),
        mass,
    };
};

describe('chartMotion', () => {
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

    it('maps state transitions (hover, inactive) to appearance.fast', () => {
        const cfg = configFor(SPRINGS['appearance.fast'].productive);
        const { settle } = measureSpring(cfg);
        const step = springStep(cfg);
        const anim = chartStateTransition();

        expect(anim.duration).toBe(Math.round(settle * 1000));
        expect(anim.easing(0)).toBe(0);
        expect(anim.easing(1)).toBe(1);
        for (const pos of [0.2, 0.5, 0.8]) {
            expect(anim.easing(pos)).toBeCloseTo(step(pos * settle), 6);
        }
    });

    it('builds theme chart and series animations from chartMotion with no eased curve name or ms literal', () => {
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

        const themeSource = readFileSync(join(__dirname, 'chartTheme.js'), 'utf8');
        expect(themeSource).not.toMatch(/easeOut|easeIn|easeInOut|cubic-bezier|swing|linear\(/);
        expect(themeSource).not.toMatch(/--ds-motion-[\w-]+,\s*\d+/);
        expect(themeSource).not.toMatch(/duration\s*:\s*\d+/);
    });

    it('staggers charts in one ChartMotionArea by 20 ms within the 500 ms cap, and defers 0 outside a provider', () => {
        const Probe = ({ onRead }) => {
            const motion = useChartMotion();
            onRead(motion);
            return null;
        };

        let standalone;
        render(h(Probe, { onRead: (m) => { standalone = m; } }));
        expect(standalone.defer).toBe(0);

        const areaReads = [];
        render(
            h(
                MotionPreferenceContext.Provider,
                { value: false },
                h(
                    ChartMotionArea,
                    null,
                    h(Probe, { onRead: (m) => areaReads.push(m) }),
                    h(Probe, { onRead: (m) => areaReads.push(m) }),
                    h(Probe, { onRead: (m) => areaReads.push(m) }),
                ),
            ),
        );
        expect(areaReads.map((r) => r.defer)).toEqual(staggerDelays(3));
        expect(areaReads.map((r) => r.defer)).toEqual([0, 20, 40]);

        const cappedReads = [];
        render(
            h(
                ChartMotionArea,
                { count: 40 },
                ...Array.from({ length: 40 }, (_, i) =>
                    h(Probe, { key: i, onRead: (m) => cappedReads.push(m) }),
                ),
            ),
        );
        expect(cappedReads.map((r) => r.defer)).toEqual(staggerDelays(40));
        expect(cappedReads.at(-1).defer).toBeLessThanOrEqual(500);
    });

    it('disables animation after the first render so redraws, resizes and updates do not replay', () => {
        expect(CHART_UPDATE_ARGS).toEqual([true, true, false]);

        const host = document.createElement('div');
        document.body.appendChild(host);
        try {
            const chart = Highcharts.chart(host, {
                ...chartTheme,
                chart: { ...chartTheme.chart, type: 'column' },
                xAxis: { categories: ['A', 'B'] },
                series: [{ name: 'S', data: [10, 20] }],
            });

            // After initial load, chart-level and series-level animations are turned off.
            expect(chart.options.chart.animation).toBe(false);
            expect(chart.series[0].options.animation).toBe(false);

            // Updating with options that spread chartTheme.chart (which has entrance animation)
            // still keeps animation false on the live chart so nothing replays.
            chart.update({
                chart: { ...chartTheme.chart },
                series: [{ name: 'S', data: [30, 40] }],
            });
            expect(chart.options.chart.animation).toBe(false);
            expect(chart.renderer.globalAnimation).toBe(false);

            const optionsAfterFirst = chartAnimationOptions({ entered: true });
            expect(optionsAfterFirst.chart.animation).toBe(false);
            expect(optionsAfterFirst.plotOptions.series.animation).toBe(false);

            chart.destroy();
        } finally {
            host.remove();
        }
    });
});
