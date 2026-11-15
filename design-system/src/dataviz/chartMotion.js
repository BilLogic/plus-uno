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
import React, { createContext, useMemo, useRef } from 'react';
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
 * Highcharts animation object for a chart mark's entrance (`spatial.default`).
 * Reduced motion wins over expressive (ADR-041) and collapses to the
 * `appearance.fast` fade (`SPRINGS['spatial.default'].reduced`).
 */
export function chartEntrance({ reduced = false, expressive = false, defer = 0 } = {}) {
    const mode = reduced ? 'reduced' : expressive ? 'expressive' : 'productive';
    return springToAnimation('spatial.default', mode, defer);
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
 * in mount order. A chart that unmounts frees its slot, so a chart mounting
 * later takes the lowest free slot and its delay. `expressive` gives the
 * area's charts the expressive entrance spring. Outside an area, a chart
 * defers 0 ms.
 */
export function ChartMotionArea({ children, count, expressive = false }) {
    const slotsRef = useRef(null);
    if (!slotsRef.current) {
        slotsRef.current = new Map();
    }

    const registry = useMemo(
        () => ({
            claim(slotKey) {
                const slots = slotsRef.current;
                if (!slots.has(slotKey)) {
                    const taken = new Set(slots.values());
                    let free = 0;
                    while (taken.has(free)) free += 1;
                    slots.set(slotKey, free);
                }
                const index = slots.get(slotKey);
                const total = Math.max(count ?? 0, slots.size, index + 1);
                const delays = staggerDelays(total);
                return delays[index] ?? 0;
            },
            release(slotKey) {
                slotsRef.current.delete(slotKey);
            },
            expressive,
        }),
        [count, expressive],
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
