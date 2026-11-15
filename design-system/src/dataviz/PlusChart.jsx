import React, { forwardRef, useContext, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from '@/dataviz/highchartsModules';
import chartTheme, { CHART_ANIMATION_DURATION_MS, CHART_VALUE_CLASS, hoveredColor } from '@/dataviz/chartTheme';
import { ChartMotionContext, chartEntrance, chartStateTransition } from '@/dataviz/chartMotion';
import { useMotionReduced } from '@/lib/motionPreference';

const UPDATE_ARGS = [true, true, false];
const BODY = 'var(--type-family-body)';
const MEDIUM = 'var(--type-weight-medium)';
const SEMIBOLD = 'var(--type-weight-semibold)';
const TABULAR = 'tabular-nums';

const normalizeWeight = (weight, fallback = MEDIUM) => {
    if (!weight) return fallback;
    const str = String(weight).trim().toLowerCase();
    if (str === 'bold' || str === '700' || str === '900' || str.includes('semibold')) {
        return SEMIBOLD;
    }
    return MEDIUM;
};

const normalizeTextStyle = (style, baseStyle, defaultWeight = MEDIUM) => ({
    ...baseStyle,
    ...style,
    fontFamily: BODY,
    fontWeight: normalizeWeight(style?.fontWeight ?? baseStyle?.fontWeight, defaultWeight),
});

const normalizeFormatString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/<b>([\s\S]*?)<\/b>/gi, `<span class="${CHART_VALUE_CLASS}">$1</span>`)
        .replace(/font-weight\s*:\s*(?:bold|700)/gi, `font-weight:${SEMIBOLD};font-variant-numeric:${TABULAR}`);
};

const normalizeDataLabels = (dl, baseDataLabels = chartTheme.plotOptions.series.dataLabels) => {
    if (!dl || typeof dl !== 'object') return dl;
    if (Array.isArray(dl)) return dl.map((item) => normalizeDataLabels(item, baseDataLabels));
    const next = {
        ...dl,
        style: {
            ...normalizeTextStyle(dl.style, baseDataLabels.style, MEDIUM),
            fontVariantNumeric: TABULAR,
            textOutline: 'none',
        },
    };
    // In Highcharts, a defined `format` string overrides `formatter`.
    // Only set or normalize `format` when the caller did not supply `formatter`.
    if (typeof next.formatter === 'function' && dl.format === undefined) {
        delete next.format;
    } else if (typeof next.format === 'string') {
        next.format = normalizeFormatString(next.format);
    }
    if (typeof next.nodeFormat === 'string') next.nodeFormat = normalizeFormatString(next.nodeFormat);
    if (typeof next.pointFormat === 'string') next.pointFormat = normalizeFormatString(next.pointFormat);
    return next;
};

/**
 * Single Highcharts wrapper seam for every PLUS chart.
 *
 * - **Type and numbers:** enforces `--type-family-body` (Noto Sans), weights
 *   500 and 600 only, `tabular-nums` on number slots, and `textOutline: 'none'`
 *   across every text slot.
 * - **States:** merges the shared hover (`-hovered` chart token, brightness
 *   fallback otherwise), inactive (`--ds-opacity-disabled`) and select
 *   (`--ds-background-selected` + 1px `--ds-border-selected`) states.
 * - **First render:** merges the spring entrance (`spatial.default`, or
 *   `appearance.fast` fade under reduced motion) into `chart.animation` and
 *   `plotOptions.series.animation`, and `appearance.fast` into
 *   `plotOptions.series.states.{hover,inactive,select}.animation`.
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
        const baseSeriesPlot = chartTheme.plotOptions.series;
        const baseStates = baseSeriesPlot.states;

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
                rawSeriesAnim !== baseSeriesPlot.animation;

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
            ...chartTheme.plotOptions,
            ...options.plotOptions,
            ...(options.plotOptions?.wordcloud
                ? {
                      wordcloud: {
                          ...chartTheme.plotOptions.wordcloud,
                          ...options.plotOptions.wordcloud,
                          style: normalizeTextStyle(
                              options.plotOptions.wordcloud.style,
                              chartTheme.plotOptions.wordcloud.style,
                              SEMIBOLD,
                          ),
                      },
                  }
                : {}),
            ...(options.plotOptions?.treegraph
                ? {
                      treegraph: {
                          ...chartTheme.plotOptions.treegraph,
                          ...options.plotOptions.treegraph,
                          collapseButton: {
                              ...chartTheme.plotOptions.treegraph.collapseButton,
                              ...options.plotOptions.treegraph.collapseButton,
                              style: normalizeTextStyle(
                                  options.plotOptions.treegraph.collapseButton?.style,
                                  chartTheme.plotOptions.treegraph.collapseButton.style,
                                  SEMIBOLD,
                              ),
                          },
                      },
                  }
                : {}),
            ...(entered && chartType && typePlot?.animation !== undefined
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
                animation: entranceAnim,
                dataLabels: normalizeDataLabels({
                    ...baseSeriesPlot.dataLabels,
                    ...seriesPlot.dataLabels,
                }),
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

        for (const [key, val] of Object.entries(nextPlotOptions)) {
            if (key === 'series' || !val || typeof val !== 'object') continue;
            if (val.dataLabels) {
                nextPlotOptions[key] = {
                    ...val,
                    dataLabels: normalizeDataLabels(val.dataLabels),
                };
            }
        }

        const nextSeries = Array.isArray(options.series)
            ? options.series.map((s) => {
                  if (!s || typeof s !== 'object') return s;
                  const needsAnimReset = entered && s.animation !== undefined;
                  const needsDL = Boolean(s.dataLabels);
                  const needsLevels = Array.isArray(s.levels) && s.levels.some((l) => l?.dataLabels);
                  const hoverColor = hoveredColor(s.color);
                  const hasPointOverrides =
                      Array.isArray(s.data) &&
                      s.data.some(
                          (pt) =>
                              pt &&
                              typeof pt === 'object' &&
                              !Array.isArray(pt) &&
                              (hoveredColor(pt.color) || pt.dataLabels),
                      );
                  if (!needsAnimReset && !needsDL && !needsLevels && !hoverColor && !hasPointOverrides) {
                      return s;
                  }
                  const nextData = hasPointOverrides
                      ? s.data.map((pt) => {
                            if (!pt || typeof pt !== 'object' || Array.isArray(pt)) return pt;
                            const ptHover = hoveredColor(pt.color);
                            if (!ptHover && !pt.dataLabels) return pt;
                            return {
                                ...pt,
                                ...(pt.dataLabels ? { dataLabels: normalizeDataLabels(pt.dataLabels) } : {}),
                                ...(ptHover
                                    ? {
                                          states: {
                                              ...pt.states,
                                              hover: {
                                                  ...pt.states?.hover,
                                                  color: pt.states?.hover?.color ?? ptHover,
                                                  brightness: 0,
                                              },
                                          },
                                      }
                                    : {}),
                            };
                        })
                      : s.data;
                  return {
                      ...s,
                      ...(needsAnimReset ? { animation: false } : {}),
                      ...(needsDL ? { dataLabels: normalizeDataLabels(s.dataLabels) } : {}),
                      ...(needsLevels
                          ? {
                                levels: s.levels.map((lvl) =>
                                    lvl?.dataLabels
                                        ? { ...lvl, dataLabels: normalizeDataLabels(lvl.dataLabels) }
                                        : lvl,
                                ),
                            }
                          : {}),
                      ...(hasPointOverrides ? { data: nextData } : {}),
                      ...(hoverColor
                          ? {
                                states: {
                                    ...s.states,
                                    hover: {
                                        ...s.states?.hover,
                                        color: s.states?.hover?.color ?? hoverColor,
                                        brightness: 0,
                                    },
                                },
                            }
                          : {}),
                  };
              })
            : options.series;

        const normalizeAxisSlot = (axisOpt, baseAxis) => {
            if (!axisOpt || Array.isArray(axisOpt)) return axisOpt;
            const needsTitleStyle =
                axisOpt.title && typeof axisOpt.title === 'object' && axisOpt.title !== baseAxis.title;
            const needsLabelsStyle =
                axisOpt.labels && typeof axisOpt.labels === 'object' && axisOpt.labels !== baseAxis.labels;
            if (!needsTitleStyle && !needsLabelsStyle) return axisOpt;
            return {
                ...axisOpt,
                ...(needsLabelsStyle
                    ? {
                          labels: {
                              ...baseAxis.labels,
                              ...axisOpt.labels,
                              style: {
                                  ...normalizeTextStyle(
                                      axisOpt.labels.style,
                                      baseAxis.labels.style,
                                      MEDIUM,
                                  ),
                                  fontVariantNumeric: TABULAR,
                              },
                          },
                      }
                    : {}),
                ...(needsTitleStyle
                    ? {
                          title: {
                              ...baseAxis.title,
                              ...axisOpt.title,
                              style: normalizeTextStyle(
                                  axisOpt.title.style,
                                  baseAxis.title.style,
                                  SEMIBOLD,
                              ),
                          },
                      }
                    : {}),
            };
        };

        return {
            ...options,
            chart: {
                ...options.chart,
                animation: entranceAnim,
                style: normalizeTextStyle(options.chart?.style, chartTheme.chart.style, MEDIUM),
            },
            ...(options.title
                ? {
                      title: {
                          ...chartTheme.title,
                          ...options.title,
                          style: normalizeTextStyle(
                              options.title.style,
                              chartTheme.title.style,
                              SEMIBOLD,
                          ),
                      },
                  }
                : {}),
            ...(options.subtitle
                ? {
                      subtitle: {
                          ...chartTheme.subtitle,
                          ...options.subtitle,
                          style: normalizeTextStyle(
                              options.subtitle.style,
                              chartTheme.subtitle.style,
                              MEDIUM,
                          ),
                      },
                  }
                : {}),
            ...(options.caption
                ? {
                      caption: {
                          ...chartTheme.caption,
                          ...options.caption,
                          style: normalizeTextStyle(
                              options.caption.style,
                              chartTheme.caption.style,
                              MEDIUM,
                          ),
                      },
                  }
                : {}),
            ...(options.xAxis ? { xAxis: normalizeAxisSlot(options.xAxis, chartTheme.xAxis) } : {}),
            ...(options.yAxis ? { yAxis: normalizeAxisSlot(options.yAxis, chartTheme.yAxis) } : {}),
            ...(options.legend
                ? {
                      legend: {
                          ...chartTheme.legend,
                          ...options.legend,
                          itemStyle: {
                              ...normalizeTextStyle(
                                  options.legend.itemStyle,
                                  chartTheme.legend.itemStyle,
                                  MEDIUM,
                              ),
                              fontVariantNumeric: TABULAR,
                          },
                      },
                  }
                : {}),
            ...(options.noData
                ? {
                      noData: {
                          ...chartTheme.noData,
                          ...options.noData,
                          style: normalizeTextStyle(
                              options.noData.style,
                              chartTheme.noData.style,
                              MEDIUM,
                          ),
                      },
                  }
                : {}),
            ...(options.tooltip
                ? {
                      tooltip: {
                          ...options.tooltip,
                          ...(typeof options.tooltip.headerFormat === 'string'
                              ? { headerFormat: normalizeFormatString(options.tooltip.headerFormat) }
                              : {}),
                          ...(typeof options.tooltip.pointFormat === 'string'
                              ? { pointFormat: normalizeFormatString(options.tooltip.pointFormat) }
                              : {}),
                          ...(typeof options.tooltip.nodeFormat === 'string'
                              ? { nodeFormat: normalizeFormatString(options.tooltip.nodeFormat) }
                              : {}),
                          style: {
                              ...normalizeTextStyle(
                                  options.tooltip.style,
                                  chartTheme.tooltip.style,
                                  MEDIUM,
                              ),
                              fontVariantNumeric: TABULAR,
                          },
                      },
                  }
                : {}),
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
