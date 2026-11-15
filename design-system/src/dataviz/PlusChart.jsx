import React, { forwardRef, useContext, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from '@/dataviz/highchartsModules';
import chartTheme, { CHART_ANIMATION_DURATION_MS } from '@/dataviz/chartTheme';
import { ChartMotionContext, chartEntrance, chartStateTransition } from '@/dataviz/chartMotion';
import { useMotionReduced } from '@/lib/motionPreference';

const UPDATE_ARGS = [true, true, false];

/**
 * Single Highcharts wrapper seam for every PLUS chart.
 *
 * - **First render:** merges the spring entrance (`spatial.default`, or
 *   `appearance.fast` fade under reduced motion) into `chart.animation` and
 *   `plotOptions.series.animation`, and `appearance.fast` into
 *   `plotOptions.series.states.{hover,inactive}.animation`.
 * - **Every later render:** sets those entrance animations to `false` and
 *   passes `updateArgs={[true, true, false]}` so data updates and resizes
 *   never replay.
 * - **Opt-out:** preserves an explicit `animation: false` (such as Sparkline,
 *   or Bar/Donut when `animate` is false).
 */
const PlusChart = forwardRef(function PlusChart(
    { options, expressive = false, ...rest },
    ref,
) {
    const reduced = useMotionReduced();
    const area = useContext(ChartMotionContext);
    const slotKeyRef = useRef({});
    const enteredRef = useRef(false);

    const isExpressive = Boolean(expressive || area?.expressive);
    const defer = area ? area.claim(slotKeyRef.current) : 0;
    const entered = enteredRef.current;

    useEffect(() => {
        enteredRef.current = true;
    }, []);

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
            ...(entered && chartType && typePlot?.animation !== undefined
                ? {
                      [chartType]: {
                          ...typePlot,
                          animation: false,
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
            {...rest}
        />
    );
});

PlusChart.propTypes = {
    options: PropTypes.object.isRequired,
    expressive: PropTypes.bool,
};

export default PlusChart;
