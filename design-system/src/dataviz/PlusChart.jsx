import React, { forwardRef, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from '@/dataviz/highchartsModules';
import chartTheme, { CHART_ANIMATION_DURATION_MS } from '@/dataviz/chartTheme';
import { ChartMotionContext, chartEntrance, chartStateTransition } from '@/dataviz/chartMotion';
import { useMotionReduced } from '@/lib/motionPreference';

const UPDATE_ARGS = [true, true, false];

/**
 * Turns the entrance off on a drawn chart. Highcharts reads
 * `chart.animation` for every later redraw (a resize, a legend toggle,
 * `setData`), so leaving the entrance there replays it. The series options
 * are set in place rather than through `chart.update({ plotOptions })`, which
 * rebuilds every series and would cut the running entrance short.
 */
function freezeEntrance(chart) {
    chart.update({ chart: { animation: false } }, false);
    chart.options.plotOptions.series = {
        ...chart.options.plotOptions.series,
        animation: false,
    };
    chart.series.forEach((series) => {
        series.options.animation = false;
    });
}

/**
 * Single Highcharts wrapper seam for every PLUS chart.
 *
 * - **First render:** merges the spring entrance (`spatial.default`, or
 *   `appearance.fast` fade under reduced motion) into `chart.animation` and
 *   `plotOptions.series.animation`, and `appearance.fast` into
 *   `plotOptions.series.states.{hover,inactive}.animation`.
 * - **Chart-type overrides:** a `plotOptions.<type>.animation` object (such
 *   as the gauge's) is replaced by the same entrance, so every chart type
 *   enters on the motion model.
 * - **After the first draw:** turns `chart.animation` and the series
 *   animation off on the chart instance, so a container resize, a legend
 *   toggle or `setData` never replays the entrance.
 * - **Every later render:** sets those entrance animations to `false` and
 *   passes `updateArgs={[true, true, false]}` so data updates never replay.
 * - **Opt-out:** preserves an explicit `animation: false` (such as Sparkline,
 *   or Bar/Donut when `animate` is false).
 *
 * Expressive entrances come from the surrounding `ChartMotionArea expressive`.
 */
const PlusChart = forwardRef(function PlusChart(
    { options, callback, ...rest },
    ref,
) {
    const reduced = useMotionReduced();
    const area = useContext(ChartMotionContext);
    const slotKeyRef = useRef({});
    const enteredRef = useRef(false);

    const isExpressive = Boolean(area?.expressive);
    const defer = area ? area.claim(slotKeyRef.current) : 0;
    const entered = enteredRef.current;

    useEffect(() => {
        enteredRef.current = true;
    }, []);

    // Frees the slot on unmount only; the area's registry object changes
    // when its count or expressive prop does, and that is not an unmount.
    const areaRef = useRef(area);
    areaRef.current = area;
    useEffect(() => {
        const slotKey = slotKeyRef.current;
        return () => areaRef.current?.release(slotKey);
    }, []);

    const handleChart = useCallback(
        (chart) => {
            freezeEntrance(chart);
            callback?.(chart);
        },
        [callback],
    );

    const mergedOptions = useMemo(() => {
        if (!options) return options;

        const chartType = options.chart?.type;
        const seriesPlot = options.plotOptions?.series ?? {};
        const typePlot = chartType ? options.plotOptions?.[chartType] : undefined;

        const optedOut =
            options.chart?.animation === false ||
            seriesPlot.animation === false ||
            typePlot?.animation === false ||
            (Array.isArray(options.series) &&
                options.series.length > 0 &&
                options.series.every((s) => s && typeof s === 'object' && s.animation === false));

        const stateAnim = chartStateTransition();

        let entranceAnim = false;
        if (!entered && !optedOut) {
            const baseEntrance = chartEntrance({
                reduced,
                expressive: isExpressive,
                defer,
            });
            const rawSeriesAnim = seriesPlot.animation;
            const hasCustomSeriesAnim =
                rawSeriesAnim &&
                typeof rawSeriesAnim === 'object' &&
                rawSeriesAnim !== chartTheme.plotOptions.series.animation;

            entranceAnim = hasCustomSeriesAnim
                ? {
                      ...rawSeriesAnim,
                      ...baseEntrance,
                      duration:
                          !reduced &&
                          typeof rawSeriesAnim.duration === 'number' &&
                          rawSeriesAnim.duration !== CHART_ANIMATION_DURATION_MS
                              ? rawSeriesAnim.duration
                              : baseEntrance.duration,
                      defer:
                          typeof rawSeriesAnim.defer === 'number' && rawSeriesAnim.defer > 0
                              ? rawSeriesAnim.defer
                              : baseEntrance.defer,
                  }
                : baseEntrance;
        }

        const nextPlotOptions = {
            ...options.plotOptions,
            ...(chartType && typePlot?.animation !== undefined
                ? {
                      [chartType]: {
                          ...typePlot,
                          animation: entranceAnim,
                      },
                  }
                : {}),
            series: {
                ...seriesPlot,
                animation: entranceAnim,
                states: {
                    ...seriesPlot.states,
                    hover: {
                        ...seriesPlot.states?.hover,
                        animation: stateAnim,
                    },
                    inactive: {
                        ...seriesPlot.states?.inactive,
                        animation: stateAnim,
                    },
                },
            },
        };

        const nextSeries =
            entered && Array.isArray(options.series)
                ? options.series.map((s) =>
                      s && typeof s === 'object' && s.animation !== undefined
                          ? { ...s, animation: false }
                          : s,
                  )
                : options.series;

        return {
            ...options,
            chart: {
                ...options.chart,
                animation: entranceAnim,
            },
            plotOptions: nextPlotOptions,
            ...(nextSeries !== undefined ? { series: nextSeries } : {}),
        };
    }, [defer, entered, isExpressive, options, reduced]);

    return (
        <HighchartsReact
            ref={ref}
            highcharts={Highcharts}
            options={mergedOptions}
            updateArgs={UPDATE_ARGS}
            callback={handleChart}
            {...rest}
        />
    );
});

PlusChart.propTypes = {
    options: PropTypes.object.isRequired,
    /** Called with the Highcharts chart once its first draw completes. */
    callback: PropTypes.func,
};

export default PlusChart;
