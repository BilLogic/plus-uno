/**
 * Chart motion on PLUS springs (ADR-041).
 *
 * Highcharts animates SVG attributes in JS rather than through CSS transitions,
 * so it cannot read `--ds-motion-*` `linear()` strings from the stylesheet.
 * This module turns the generated spring table (`SPRINGS`) and the analytic
 * step response (`springStep`, `measureSpring`) into Highcharts animation
 * objects `{ duration, easing, defer }`:
 *
 * - **Entrance** (a mark growing to its value) runs on `spatial.default`.
 *   An `[data-motion="expressive"]` ancestor switches to the expressive spring;
 *   reduced motion switches to the `appearance.fast` fade.
 * - **State changes** (hover, inactive fade) run on `appearance.fast`.
 * - **One orchestrated moment per area:** charts inside a `ChartMotionArea`
 *   share the load-reveal stagger (`staggerDelays`: 20 ms apart, 500 ms cap)
 *   in mount order; outside a provider a chart defers 0 ms.
 * - **No replay:** after the first render completes, `chart.animation` and each
 *   series' `animation` turn off (`false`), and `HighchartsReact` updates use
 *   `CHART_UPDATE_ARGS` (`[true, true, false]`) so data updates, redraws and
 *   container resizes stay still.
 */
import React, { createContext, useContext, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import { measureSpring, springStep } from '@/tokens/spring.js';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { staggerDelays } from '@/lib/listMotion';
import { MotionPreferenceContext, useMotionReduced } from '@/lib/motionPreference';

/**
 * Converts a `SPRINGS` table entry (`{ stiffness, damping, mass }`) into a
 * Highcharts animation object `{ duration, easing }`.
 *
 * The easing evaluates the spring's analytic step response across `[0, settle]`
 * and pins `0` at `pos <= 0` and `1` at `pos >= 1` so Highcharts lands on the
 * exact final geometry at the end of the tween.
 */
function springToAnimation(entry, defer) {
    const { stiffness, damping, mass = 1 } = entry;
    const ratio = damping / (2 * Math.sqrt(stiffness * mass));
    const config = { stiffness, ratio, mass };
    const { settle } = measureSpring(config);
    const step = springStep(config);
    const duration = Math.round(settle * 1000);
    const easing = (pos) => {
        if (pos <= 0) return 0;
        if (pos >= 1) return 1;
        return step(pos * settle);
    };
    return defer !== undefined ? { duration, easing, defer } : { duration, easing };
}

/**
 * Highcharts animation object for a chart mark's entrance (`spatial.default`).
 * Reduced motion wins over expressive (ADR-041) and collapses to the
 * `appearance.fast` fade.
 */
export function chartEntrance({ reduced = false, expressive = false, defer } = {}) {
    const mode = reduced ? 'reduced' : expressive ? 'expressive' : 'productive';
    return springToAnimation(SPRINGS['spatial.default'][mode], defer);
}

/**
 * Highcharts animation object for hover and inactive series state changes
 * (`appearance.fast`).
 */
export function chartStateTransition({ reduced = false } = {}) {
    void reduced;
    return springToAnimation(SPRINGS['appearance.fast'].productive);
}

/**
 * `HighchartsReact` `updateArgs` tuple (`[redraw, oneToOne, animation]`):
 * updates after the initial mount redraw in place without re-running the
 * entrance animation.
 */
export const CHART_UPDATE_ARGS = [true, true, false];

/**
 * Builds the `chart` and `plotOptions.series` animation slice for a chart's
 * options at option-build time. When `entered` is true (after first render),
 * entrance animations turn off (`false`) while hover/inactive state animations
 * stay active.
 */
export function chartAnimationOptions({
    reduced = false,
    expressive = false,
    defer,
    entered = false,
} = {}) {
    const entrance = entered
        ? false
        : chartEntrance({
              reduced,
              expressive,
              ...(defer ? { defer } : {}),
          });
    const state = chartStateTransition({ reduced });
    return {
        chart: {
            animation: entrance,
        },
        plotOptions: {
            series: {
                animation: entrance,
                states: {
                    hover: { animation: state },
                    inactive: { animation: state },
                },
            },
        },
    };
}

/**
 * Context holding the per-area stagger registry so charts in one area enter as
 * one orchestrated moment (20 ms apart, 500 ms cap).
 */
export const ChartMotionContext = createContext(null);

/**
 * Wraps an area of charts (such as a dashboard section or a docs specimen) so
 * the charts inside it share the 20 ms load-reveal stagger (`staggerDelays`)
 * in mount order and pick up the active motion preference.
 */
export function ChartMotionArea({
    children,
    count,
    expressive = false,
    reduced,
    as: Tag = 'div',
    style,
    ...rest
}) {
    const contextReduced = useMotionReduced();
    const isReduced = reduced ?? contextReduced;
    const slotsRef = useRef(null);
    if (!slotsRef.current) {
        slotsRef.current = new Map();
    }

    const registry = useMemo(
        () => ({
            claim(slotKey) {
                const slots = slotsRef.current;
                if (!slots.has(slotKey)) {
                    slots.set(slotKey, slots.size);
                }
                const index = slots.get(slotKey);
                const total = Math.max(count ?? 0, slots.size, index + 1);
                const delays = staggerDelays(total);
                return delays[index] ?? 0;
            },
            reduced: isReduced,
            expressive,
            count,
        }),
        [count, expressive, isReduced],
    );

    return React.createElement(
        ChartMotionContext.Provider,
        { value: registry },
        React.createElement(
            Tag,
            {
                'data-chart-motion-area': '',
                'data-motion-reduced': isReduced ? 'true' : 'false',
                ...(count !== undefined ? { 'data-chart-count': String(count) } : {}),
                ...(expressive ? { 'data-motion': 'expressive' } : {}),
                style: { display: 'contents', ...style },
                ...rest,
            },
            children,
        ),
    );
}

ChartMotionArea.propTypes = {
    children: PropTypes.node,
    count: PropTypes.number,
    expressive: PropTypes.bool,
    reduced: PropTypes.bool,
    as: PropTypes.elementType,
    style: PropTypes.object,
};

/**
 * Hook for a chart component to read the live motion preference, its stagger
 * `defer` within the nearest `ChartMotionArea` (or `0` outside one), and its
 * Highcharts animation options.
 */
export function useChartMotion({ expressive = false } = {}) {
    const contextReduced = useMotionReduced();
    const area = useContext(ChartMotionContext);
    const slotKeyRef = useRef({});
    const renderedRef = useRef(false);

    const reduced = area ? area.reduced : contextReduced;
    const isExpressive = area ? area.expressive || expressive : expressive;
    const defer = area ? area.claim(slotKeyRef.current) : 0;
    const entered = renderedRef.current;

    return useMemo(() => {
        const options = chartAnimationOptions({
            reduced,
            expressive: isExpressive,
            defer,
            entered,
        });
        return {
            reduced,
            expressive: isExpressive,
            defer,
            entered,
            entrance: options.chart.animation,
            stateTransition: chartStateTransition({ reduced }),
            options,
            updateArgs: CHART_UPDATE_ARGS,
            markEntered: () => {
                renderedRef.current = true;
            },
        };
    }, [defer, entered, isExpressive, reduced]);
}

/**
 * Reads `MotionPreferenceContext` from a mounted React DOM node's fiber tree if
 * the chart was rendered inside `<MotionPreferenceContext.Provider>` without an
 * intermediate `[data-motion-reduced]` attribute.
 */
function readFiberMotionReduced(node) {
    let el = node;
    while (el) {
        const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
        if (key) {
            let fiber = el[key];
            while (fiber) {
                const type = fiber.type;
                if (
                    type === MotionPreferenceContext ||
                    type === MotionPreferenceContext.Provider ||
                    type?._context === MotionPreferenceContext
                ) {
                    const val = fiber.memoizedProps?.value;
                    if (typeof val === 'boolean') return val;
                }
                fiber = fiber.return;
            }
            break;
        }
        el = el.parentElement;
    }
    return undefined;
}

function detectReducedMotion(renderTo) {
    const attrHost = renderTo?.closest?.('[data-motion-reduced]');
    if (attrHost) {
        return attrHost.getAttribute('data-motion-reduced') === 'true';
    }
    const fiberVal = readFiberMotionReduced(renderTo);
    if (typeof fiberVal === 'boolean') {
        return fiberVal;
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
}

function detectExpressiveMotion(renderTo) {
    return Boolean(renderTo?.closest?.('[data-motion="expressive"]'));
}

const areaMountRegistry = new WeakMap();

function claimAreaDefer(renderTo) {
    const areaEl = renderTo?.closest?.('[data-chart-motion-area]');
    if (!areaEl) return 0;
    let record = areaMountRegistry.get(areaEl);
    if (!record) {
        record = { nodes: [] };
        areaMountRegistry.set(areaEl, record);
    }
    // Prune disconnected nodes so remounting a story starts fresh.
    record.nodes = record.nodes.filter((n) => n.isConnected && areaEl.contains(n));
    let index = record.nodes.indexOf(renderTo);
    if (index === -1) {
        index = record.nodes.length;
        record.nodes.push(renderTo);
    }
    const explicitCount = Number(areaEl.getAttribute('data-chart-count'));
    const total = Math.max(
        Number.isFinite(explicitCount) && explicitCount > 0 ? explicitCount : 0,
        record.nodes.length,
        index + 1,
    );
    const delays = staggerDelays(total);
    return delays[index] ?? 0;
}

function disableChartReplay(chart) {
    chart.__plusEntered = true;
    if (chart.options?.chart) {
        chart.options.chart.animation = false;
    }
    if (chart.userOptions?.chart) {
        chart.userOptions.chart.animation = false;
    }
    if (chart.options?.plotOptions?.series) {
        chart.options.plotOptions.series.animation = false;
    }
    if (chart.renderer) {
        chart.renderer.globalAnimation = false;
    }
    if (Array.isArray(chart.series)) {
        for (const s of chart.series) {
            if (s?.options) {
                s.options.animation = false;
            }
        }
    }
}

let lifecycleInstalled = false;

/**
 * Installs the Highcharts lifecycle hooks once on the shared Highcharts
 * instance so every chart automatically:
 * 1. Picks up the live reduced/expressive spring and area stagger on first render,
 * 2. Keeps `appearance.fast` state transitions on hover and inactive states,
 * 3. Turns off chart and series entrance animations after first render so
 *    subsequent data updates, redraws and container resizes never replay.
 */
export function installChartMotionLifecycle(H = Highcharts) {
    if (lifecycleInstalled || !H?.addEvent || !H?.Chart) return;
    lifecycleInstalled = true;

    H.addEvent(H.Chart, 'beforeRender', function () {
        const chart = this;
        if (chart.__plusEntered) return;

        const renderTo = chart.renderTo;
        const reduced = detectReducedMotion(renderTo);
        const expressive = detectExpressiveMotion(renderTo);
        const defer = claimAreaDefer(renderTo);
        const inMotionArea = Boolean(renderTo?.closest?.('[data-chart-motion-area]'));
        const entrance = chartEntrance({
            reduced,
            expressive,
            ...(defer > 0 ? { defer } : {}),
        });
        const stateAnim = chartStateTransition({ reduced });
        chart.__plusInitialEntrance = entrance;
        chart.__plusInitialStateTransition = stateAnim;

        if (chart.options?.chart && chart.options.chart.animation !== false) {
            chart.options.chart.animation = entrance;
        }
        if (chart.options?.plotOptions) {
            const seriesPlot = chart.options.plotOptions.series || {};
            const states = seriesPlot.states || {};
            chart.options.plotOptions.series = {
                ...seriesPlot,
                ...(seriesPlot.animation !== false ? { animation: entrance } : {}),
                states: {
                    ...states,
                    hover: { ...states.hover, animation: stateAnim },
                    inactive: { ...states.inactive, animation: stateAnim },
                },
            };
        }

        if (Array.isArray(chart.series)) {
            for (const s of chart.series) {
                if (!s?.options) continue;
                s.options.states = {
                    ...s.options.states,
                    hover: { ...s.options.states?.hover, animation: stateAnim },
                    inactive: { ...s.options.states?.inactive, animation: stateAnim },
                };
                // Sparklines opt out of entrance animation (`animation: false` with hidden axes).
                // Inside a `ChartMotionArea`, charts enter together even if a legacy prop defaulted `animate` to false.
                const isSparkline =
                    chart.options?.xAxis?.[0]?.visible === false &&
                    chart.options?.yAxis?.[0]?.visible === false;
                if (s.options.animation !== false || (inMotionArea && !isSparkline)) {
                    const userDefer =
                        typeof s.userOptions?.animation === 'object'
                            ? s.userOptions.animation.defer
                            : undefined;
                    s.options.animation = {
                        ...entrance,
                        ...(userDefer !== undefined ? { defer: userDefer } : {}),
                    };
                }
            }
        }
    });

    H.addEvent(H.Chart, 'load', function () {
        disableChartReplay(this);
    });

    H.addEvent(H.Chart, 'update', function (e) {
        const chart = this;
        if (!chart.__plusEntered) return;
        const opts = e?.options;
        if (opts) {
            opts.chart = { ...opts.chart, animation: false };
            if (opts.plotOptions?.series) {
                opts.plotOptions.series = { ...opts.plotOptions.series, animation: false };
            }
            if (Array.isArray(opts.series)) {
                opts.series = opts.series.map((s) =>
                    s && typeof s === 'object' ? { ...s, animation: false } : s,
                );
            }
        }
        disableChartReplay(chart);
    });

    H.addEvent(H.Chart, 'beforeRedraw', function () {
        if (this.__plusEntered) {
            disableChartReplay(this);
        }
    });
}

installChartMotionLifecycle();
