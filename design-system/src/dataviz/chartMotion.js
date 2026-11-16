/**
 * Chart motion on PLUS springs (ADR-041).
 *
 * Highcharts animates SVG attributes in JS rather than through CSS transitions,
 * so it cannot read `--ds-motion-*` `linear()` strings from the stylesheet.
 * This module turns the semantic springs (`measureSpringToken` in `listMotion`)
 * into Highcharts animation objects `{ duration, easing, defer }`, and
 * provides `ChartMotionArea` so charts in one area share the load-reveal
 * stagger (`staggerDelays`: 20 ms apart, 500 ms cap) in mount order.
 */
import React, { createContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { measureSpringToken, staggerDelays } from '@/lib/listMotion';

/**
 * Converts a semantic spring token and mode into a Highcharts animation object
 * `{ duration, easing, defer }`.
 *
 * The easing evaluates the spring's analytic step response across `[0, settle]`
 * and pins `0` at `pos <= 0` and `1` at `pos >= 1` so Highcharts lands on the
 * exact final geometry at the end of the tween.
 */
function springToAnimation(token, mode, defer) {
    const { settleMs: duration, settle, step } = measureSpringToken(token, mode);
    const easing = (pos) => {
        if (pos <= 0) return 0;
        if (pos >= 1) return 1;
        return step(pos * settle);
    };
    return defer !== undefined ? { duration, easing, defer } : { duration, easing };
}

/**
 * Highcharts animation object for a chart's entrance (`spatial.default`), or
 * the `appearance.fast` opacity fade when reduced motion is active
 * (`SPRINGS['spatial.default'].reduced`).
 */
export function chartEntrance({ reduced = false, expressive = false, defer = 0 } = {}) {
    const mode = reduced ? 'reduced' : expressive ? 'expressive' : 'productive';
    return springToAnimation('spatial.default', mode, defer);
}

/**
 * Runs an opacity 0 -> 1 fade on `element` driven by the `appearance.fast`
 * reduced-motion spring (`chartEntrance({ reduced: true, defer })`), using the
 * spring easing directly with no CSS eased curve or millisecond literal.
 *
 * @param {HTMLElement | null | undefined} element
 * @param {{ defer?: number }} [options]
 * @returns {() => void} cleanup function
 */
export function fadeChartElement(element, { defer = 0 } = {}) {
    if (!element || !element.style) return () => {};
    const { duration, easing, defer: delay = 0 } = chartEntrance({ reduced: true, defer });
    element.style.opacity = '0';

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function' || duration <= 0) {
        element.style.opacity = '1';
        return () => {};
    }

    const now = () =>
        typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
    const startAt = now() + delay;
    let rafId = null;
    let cancelled = false;

    const tick = (timestamp) => {
        if (cancelled) return;
        const t = typeof timestamp === 'number' ? timestamp : now();
        const elapsed = t - startAt;
        if (elapsed <= 0) {
            element.style.opacity = '0';
            rafId = window.requestAnimationFrame(tick);
            return;
        }
        const pos = Math.min(1, elapsed / duration);
        element.style.opacity = String(easing(pos));
        if (pos < 1) {
            rafId = window.requestAnimationFrame(tick);
        } else {
            element.style.opacity = '';
        }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
        cancelled = true;
        if (rafId !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(rafId);
        }
        element.style.opacity = '';
    };
}

/**
 * Highcharts animation object for hover and inactive series state changes
 * (`appearance.fast`).
 */
export function chartStateTransition() {
    return springToAnimation('appearance.fast', 'productive');
}

/**
 * Context holding the per-area stagger registry so charts mounted in one area
 * enter as one orchestrated moment (20 ms apart, 500 ms cap).
 */
export const ChartMotionContext = createContext(null);

/**
 * Wraps an area of charts (such as a dashboard section or a docs specimen) so
 * each mounted `PlusChart` inside it receives its `defer` from `staggerDelays`
 * computed against the final mounted chart count. Outside an area, a chart
 * defers 0 ms.
 */
export function ChartMotionArea({ children, count, expressive = false }) {
    const slotsRef = useRef(null);
    if (!slotsRef.current) {
        slotsRef.current = new Map();
    }
    const [resolvedTotal, setResolvedTotal] = useState(() => (typeof count === 'number' && count > 0 ? count : 0));

    useLayoutEffect(() => {
        const finalTotal = Math.max(count ?? 0, slotsRef.current.size);
        if (finalTotal !== resolvedTotal) {
            setResolvedTotal(finalTotal);
        }
    });

    const registry = useMemo(
        () => ({
            claim(slotKey) {
                const slots = slotsRef.current;
                if (!slots.has(slotKey)) {
                    slots.set(slotKey, slots.size);
                }
                const index = slots.get(slotKey);
                const total = Math.max(count ?? 0, resolvedTotal, slots.size, index + 1);
                const delays = staggerDelays(total);
                return delays[index] ?? 0;
            },
            resolved: typeof count === 'number' && count > 0 ? true : resolvedTotal > 0 && resolvedTotal >= slotsRef.current.size,
            expressive,
        }),
        [count, expressive, resolvedTotal],
    );

    return React.createElement(
        ChartMotionContext.Provider,
        { value: registry },
        children,
    );
}

ChartMotionArea.propTypes = {
    children: PropTypes.node,
    count: PropTypes.number,
    expressive: PropTypes.bool,
};
