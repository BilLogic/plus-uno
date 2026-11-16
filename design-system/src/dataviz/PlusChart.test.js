import React, { createRef } from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Highcharts from './highchartsModules';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import PlusChart from './PlusChart';
import { ChartMotionArea, chartEntrance } from './chartMotion';
import GaugeChart from './part-to-whole/GaugeChart/GaugeChart';
import HeatmapChart from './distribution/HeatmapChart/HeatmapChart';

/**
 * These tests draw a real Highcharts chart, so they read the animation the
 * chart received after Highcharts merged its options, not the options
 * PlusChart handed over.
 */

const h = React.createElement;
const durationOf = (animation) => Highcharts.animObject(animation).duration;
const lastChart = () => Highcharts.charts.filter(Boolean).at(-1);

const withMotion = (reduced, child) =>
    h(MotionPreferenceContext.Provider, { value: reduced }, child);

const lineOptions = {
    chart: { type: 'line' },
    series: [{ name: 'Score', data: [10, 20, 30] }],
};

describe('PlusChart on a real Highcharts chart', () => {
    it('enters on the spring, then a resize, legend toggle or setData does not replay it', () => {
        const ref = createRef();
        render(withMotion(false, h(PlusChart, { ref, options: lineOptions })));
        const { chart } = ref.current;

        chart.setSize(320, 240);
        expect(durationOf(chart.renderer.globalAnimation)).toBe(0);

        chart.series[0].setVisible(false);
        expect(durationOf(chart.renderer.globalAnimation)).toBe(0);
        chart.series[0].setVisible(true);

        chart.series[0].setData([5, 15, 25]);
        expect(durationOf(chart.renderer.globalAnimation)).toBe(0);

        expect(durationOf(chart.options.chart.animation)).toBe(0);
        expect(durationOf(chart.series[0].options.animation)).toBe(0);
        expect(durationOf(chart.options.plotOptions.series.animation)).toBe(0);
    });

    it('still calls a callback the caller passes', () => {
        const callback = vi.fn();
        render(withMotion(false, h(PlusChart, { options: lineOptions, callback })));
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBe(lastChart());
    });
});

describe('chart-specific animation goes through the motion model', () => {
    const cases = [
        ['GaugeChart', () => h(GaugeChart, { value: 60, label: 'Attendance' })],
        [
            'HeatmapChart',
            () => h(HeatmapChart, {
                xCategories: ['Mon', 'Tue'],
                yCategories: ['AM', 'PM'],
                data: [[0, 0, 1], [0, 1, 2], [1, 0, 3], [1, 1, 4]],
            }),
        ],
    ];

    /** Records each series' animation as Highcharts merged it at init, before the entrance is turned off. */
    const recordSeriesAnimations = () => {
        const seen = [];
        const remove = Highcharts.addEvent(Highcharts.Series, 'afterInit', function onInit() {
            seen.push(this.options.animation);
        });
        return { seen, remove };
    };

    for (const [name, make] of cases) {
        it(`${name} enters on the shared spring under normal motion`, () => {
            const { seen, remove } = recordSeriesAnimations();
            render(withMotion(false, make()));
            remove();
            expect(seen.map(durationOf)).toEqual([chartEntrance().duration]);
        });

        it(`${name} draws at its final value under reduced motion (the container fades instead)`, () => {
            const { seen, remove } = recordSeriesAnimations();
            render(withMotion(true, make()));
            remove();
            expect(seen.map(durationOf)).toEqual([0]);
            expect(lastChart().renderTo.style.opacity).toBe('0');
        });
    }
});

describe('ChartMotionArea slots', () => {
    it('frees a chart slot on unmount, so a chart that remounts gets its original delay back', () => {
        const Area = ({ showFirst }) =>
            h(
                ChartMotionArea,
                null,
                showFirst ? h(PlusChart, { key: 'a', options: lineOptions }) : null,
                h(PlusChart, { key: 'b', options: lineOptions }),
            );

        const { rerender } = render(withMotion(false, h(Area, { showFirst: true })));
        const [first, second] = Highcharts.charts.filter(Boolean);
        expect(first.userOptions.plotOptions.series.animation.defer).toBe(0);
        expect(second.userOptions.plotOptions.series.animation.defer).toBe(20);

        act(() => rerender(withMotion(false, h(Area, { showFirst: false }))));
        act(() => rerender(withMotion(false, h(Area, { showFirst: true }))));

        const remounted = lastChart();
        expect(remounted.userOptions.plotOptions.series.animation.defer).toBe(0);
    });
});
