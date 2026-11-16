import React, { forwardRef, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from '@/dataviz/highchartsModules';
import chartTheme, { CHART_ANIMATION_DURATION_MS } from '@/dataviz/chartTheme';
import { ChartMotionContext, chartEntrance, chartStateTransition, fadeChartElement } from '@/dataviz/chartMotion';
import { hoveredColor } from '@/dataviz/palette';
import { useMotionReduced } from '@/lib/motionPreference';

const UPDATE_ARGS = [true, true, false];

const withHoverState = (states, hoverColor) => ({
    ...states,
    hover: {
        ...states?.hover,
        color: states?.hover?.color ?? hoverColor,
        brightness: 0,
    },
});

const resolvePointStates = (pt, paletteColors) => {
    if (!pt || typeof pt !== 'object' || Array.isArray(pt)) return pt;
    const assignedColor =
        pt.color ??
        (typeof pt.colorIndex === 'number' && paletteColors.length > 0
            ? paletteColors[pt.colorIndex % paletteColors.length]
            : undefined);
    const ptHover = hoveredColor(assignedColor);
    if (!ptHover) return pt;
    return {
        ...pt,
        states: withHoverState(pt.states, ptHover),
    };
};

/**
 * Single Highcharts wrapper seam for every PLUS chart.
 *
 * - **States:** merges the shared hover, inactive (`--ds-opacity-disabled`) and
 *   select (`--ds-background-selected` + `--chart-grid-width`
 *   `--ds-border-selected`) states, and resolves each series or point's
 *   `-hovered` token from its assigned color (including palette index
 *   `colors[i]`).
 * - **First render:** merges the spring entrance (`spatial.default`) into
 *   `chart.animation` and `plotOptions.series.animation`, and
 *   `appearance.fast` into
 *   `plotOptions.series.states.{hover,inactive,select}.animation`. Under
 *   reduced motion, `series.animation` is `false` (marks draw at their final
 *   value) and the chart container fades opacity `0 -> 1` on the
 *   `appearance.fast` reduced spring.
 * - **Every later render:** sets entrance animations to `false` and passes
 *   `updateArgs={[true, true, false]}` so data updates and resizes never
 *   replay.
 * - **Opt-out:** preserves an explicit `animation: false` (such as Sparkline,
 *   or Bar/Donut when `animate` is false).
 */
const PlusChart = forwardRef(function PlusChart(
    { options, expressive = false, containerProps, ...rest },
    ref,
) {
    const reduced = useMotionReduced();
    const area = useContext(ChartMotionContext);
    const slotKeyRef = useRef({});
    const enteredRef = useRef(false);
    const hcRef = useRef(null);

    useImperativeHandle(ref, () => hcRef.current);

    const isExpressive = Boolean(expressive || area?.expressive);
    const defer = area ? area.claim(slotKeyRef.current) : 0;
    const areaResolved = area ? area.resolved : true;
    const entered = enteredRef.current;

    const optedOut = useMemo(() => {
        if (!options) return true;
        const chartType = options.chart?.type;
        const seriesPlot = options.plotOptions?.series ?? {};
        const typePlot = chartType ? options.plotOptions?.[chartType] : undefined;
        return (
            options.chart?.animation === false ||
            seriesPlot.animation === false ||
            typePlot?.animation === false ||
            (Array.isArray(options.series) &&
                options.series.length > 0 &&
                options.series.every((s) => s && typeof s === 'object' && s.animation === false))
        );
    }, [options]);

    useLayoutEffect(() => {
        if (!reduced || entered || optedOut || !areaResolved) return undefined;
        const containerEl = hcRef.current?.container?.current ?? hcRef.current?.chart?.container;
        return fadeChartElement(containerEl, { defer });
    }, [areaResolved, defer, entered, optedOut, reduced]);

    useEffect(() => {
        if (areaResolved) {
            enteredRef.current = true;
        }
    }, [areaResolved]);

    const mergedOptions = useMemo(() => {
        if (!options) return options;

        const chartType = options.chart?.type;
        const seriesPlot = options.plotOptions?.series ?? {};
        const typePlot = chartType ? options.plotOptions?.[chartType] : undefined;

        const stateAnim = chartStateTransition();
        const baseSeriesPlot = chartTheme.plotOptions.series;
        const baseStates = baseSeriesPlot.states;

        let chartEntranceAnim = false;
        let seriesEntranceAnim = false;
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
                rawSeriesAnim !== baseSeriesPlot.animation;

            const resolvedEntrance = hasCustomSeriesAnim
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

            chartEntranceAnim = resolvedEntrance;
            // Under reduced motion, marks draw immediately at their final geometry
            // (`series.animation: false`) while the chart container fades opacity 0 -> 1.
            seriesEntranceAnim = reduced ? false : resolvedEntrance;
        }

        const nextPlotOptions = {
            ...chartTheme.plotOptions,
            ...options.plotOptions,
            ...( (entered || reduced) && chartType && typePlot?.animation !== undefined
                ? {
                      [chartType]: {
                          ...typePlot,
                          animation: false,
                      },
                  }
                : {}),
            series: {
                ...baseSeriesPlot,
                ...seriesPlot,
                animation: seriesEntranceAnim,
                states: {
                    ...baseStates,
                    ...seriesPlot.states,
                    hover: {
                        ...baseStates.hover,
                        ...seriesPlot.states?.hover,
                        animation: stateAnim,
                    },
                    inactive: {
                        ...baseStates.inactive,
                        ...seriesPlot.states?.inactive,
                        animation: stateAnim,
                    },
                    select: {
                        ...baseStates.select,
                        ...seriesPlot.states?.select,
                        animation: stateAnim,
                    },
                },
            },
        };

        const paletteColors =
            Array.isArray(options.colors) && options.colors.length > 0
                ? options.colors
                : chartTheme.colors;

        const nextSeries = Array.isArray(options.series)
            ? options.series.map((s, seriesIndex) => {
                  if (!s || typeof s !== 'object') return s;
                  const needsAnimReset = (entered || reduced) && s.animation !== undefined;
                  const assignedSeriesColor =
                      s.color ??
                      (paletteColors.length > 0
                          ? paletteColors[seriesIndex % paletteColors.length]
                          : undefined);
                  const hoverColor = hoveredColor(assignedSeriesColor);
                  const nextData = Array.isArray(s.data)
                      ? s.data.map((pt) => resolvePointStates(pt, paletteColors))
                      : s.data;
                  const dataChanged =
                      Array.isArray(s.data) && nextData.some((pt, idx) => pt !== s.data[idx]);

                  if (!needsAnimReset && !hoverColor && !dataChanged) {
                      return s;
                  }
                  return {
                      ...s,
                      ...(needsAnimReset ? { animation: false } : {}),
                      ...(dataChanged ? { data: nextData } : {}),
                      ...(hoverColor ? { states: withHoverState(s.states, hoverColor) } : {}),
                  };
              })
            : options.series;

        return {
            ...options,
            chart: {
                ...options.chart,
                animation: chartEntranceAnim,
            },
            plotOptions: nextPlotOptions,
            ...(nextSeries !== undefined ? { series: nextSeries } : {}),
        };
    }, [defer, entered, isExpressive, optedOut, options, reduced]);

    const mergedContainerProps = useMemo(() => {
        if (!reduced || entered || optedOut) return containerProps;
        return {
            ...containerProps,
            style: {
                opacity: 0,
                ...containerProps?.style,
            },
        };
    }, [containerProps, entered, optedOut, reduced]);

    return (
        <HighchartsReact
            ref={hcRef}
            highcharts={Highcharts}
            options={mergedOptions}
            updateArgs={UPDATE_ARGS}
            containerProps={mergedContainerProps}
            {...rest}
        />
    );
});

PlusChart.propTypes = {
    options: PropTypes.object.isRequired,
    expressive: PropTypes.bool,
    containerProps: PropTypes.object,
};

export default PlusChart;
