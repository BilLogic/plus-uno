import React, { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from '@/dataviz/highchartsModules';
import chartTheme, { CHART_ANIMATION_DURATION_MS } from '@/dataviz/chartTheme';
import { ChartMotionContext, chartEntrance, chartStateTransition, fadeChartElement } from '@/dataviz/chartMotion';
import { hoveredColor } from '@/dataviz/palette';
import { useMotionReduced } from '@/lib/motionPreference';

const UPDATE_ARGS = [true, true, false];

/** Series types Highcharts colors per point or by value, never by series. */
const VALUE_COLORED_TYPES = new Set(['heatmap', 'tilemap', 'treemap', 'sunburst', 'solidgauge', 'gauge']);

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
 * - **Chart-type overrides:** a `plotOptions.<type>.animation` object (such
 *   as the gauge's) is replaced by the same entrance, so every chart type
 *   enters on the motion model.
 * - **After the first draw:** turns `chart.animation` and the series
 *   animation off on the chart instance, so a container resize, a legend
 *   toggle or `setData` never replays the entrance.
 * - **Opt-out:** preserves an explicit `animation: false` (such as Sparkline,
 *   or Bar/Donut when `animate` is false).
 *
 * Expressive entrances come from the surrounding `ChartMotionArea expressive`.
 */
const PlusChart = forwardRef(function PlusChart(
    { options, containerProps, callback, ...rest },
    ref,
) {
    const reduced = useMotionReduced();
    const area = useContext(ChartMotionContext);
    const slotKeyRef = useRef({});
    const enteredRef = useRef(false);
    const hcRef = useRef(null);

    useImperativeHandle(ref, () => hcRef.current);

    const isExpressive = Boolean(area?.expressive);
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

    // The reduced-motion fade runs once, on the first resolved render; a later
    // re-render never cuts it short. Its cleanup runs only on unmount.
    const fadeRef = useRef(null);
    useLayoutEffect(() => {
        if (fadeRef.current || enteredRef.current || !reduced || optedOut || !areaResolved) return;
        const containerEl = hcRef.current?.container?.current ?? hcRef.current?.chart?.container;
        if (containerEl) fadeRef.current = fadeChartElement(containerEl, { defer });
    }, [areaResolved, defer, optedOut, reduced]);
    useEffect(() => () => fadeRef.current?.(), []);

    useEffect(() => {
        if (areaResolved) {
            enteredRef.current = true;
        }
    }, [areaResolved]);

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

        // Charts that set their own `plotOptions` replace the theme's whole
        // object, so the theme's series and type defaults (data-label type,
        // states) are laid under the chart's options here.
        const nextPlotOptions = {
            ...chartTheme.plotOptions,
            ...options.plotOptions,
            ...(chartType && typePlot?.animation !== undefined
                ? {
                      [chartType]: {
                          ...typePlot,
                          animation: seriesEntranceAnim,
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

        // Highcharts hands palette slots only to series without their own
        // color, so count those to find each series' assigned hue. A series
        // colored by value (color axis) or by point takes no series hover
        // color: it would paint every cell or slice one hue.
        let paletteSlot = 0;
        const nextSeries = Array.isArray(options.series)
            ? options.series.map((s) => {
                  if (!s || typeof s !== 'object') return s;
                  const needsAnimReset = (entered || reduced) && s.animation !== undefined;
                  const type = s.type ?? chartType;
                  const ownColor = s.color;
                  const paletteColor =
                      ownColor === undefined && paletteColors.length > 0
                          ? paletteColors[paletteSlot++ % paletteColors.length]
                          : undefined;
                  const byValueOrPoint =
                      options.colorAxis !== undefined ||
                      VALUE_COLORED_TYPES.has(type) ||
                      (s.colorByPoint ?? options.plotOptions?.[type]?.colorByPoint ?? seriesPlot.colorByPoint) === true;
                  const hoverColor = byValueOrPoint ? null : hoveredColor(ownColor ?? paletteColor);
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

    // HighchartsReact applies an options change in its own layout effect,
    // which runs before this one. If that change still carried the entrance
    // (the area resolving its final count before paint), turn the entrance
    // off on the instance again so a later resize can't replay it.
    useLayoutEffect(() => {
        const chart = hcRef.current?.chart;
        if (typeof chart?.update === 'function' && mergedOptions?.chart?.animation) freezeEntrance(chart);
    }, [mergedOptions]);

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
            callback={handleChart}
            {...rest}
        />
    );
});

PlusChart.propTypes = {
    options: PropTypes.object.isRequired,
    containerProps: PropTypes.object,
    /** Called with the Highcharts chart once its first draw completes. */
    callback: PropTypes.func,
};

export default PlusChart;
