/**
 * Damping (rubber-band) unit. Pure math plus a spring-back helper, no DOM.
 *
 * Built for the Panel's splitter: the drag follows the pointer up to a limit,
 * then resists and stops stretching at a maximum, and springs back on release.
 * Reusable wherever a drag has an edge.
 *
 * Settings:
 *   limit       position where resistance starts
 *   stiffness   initial slope past the limit (0..1): how much of the first
 *               pixels of overshoot still gets through
 *   maxStretch  the most the drag can ever go past the limit
 */

export const DAMPING_DEFAULTS = Object.freeze({ stiffness: 0.5, maxStretch: 48 });

/** Distance past the limit the drag shows. Zero at or below it, bounded by maxStretch. */
export function dampedStretch(position, { limit, stiffness = DAMPING_DEFAULTS.stiffness, maxStretch = DAMPING_DEFAULTS.maxStretch }) {
    const overshoot = position - limit;
    if (!(overshoot > 0) || !(maxStretch > 0) || !(stiffness > 0)) return 0;
    return maxStretch * (1 - Math.exp((-stiffness * overshoot) / maxStretch));
}

/** The position to draw: 1:1 up to the limit, damped beyond it. */
export function dampedPosition(position, settings) {
    return position <= settings.limit ? position : settings.limit + dampedStretch(position, settings);
}

const DEFAULT_SETTLE_MS = 300;

/** Stretch left `elapsedMs` after release: a critically damped spring, exactly 0 once settled. */
export function springBackValue(stretch, elapsedMs, { settleMs = DEFAULT_SETTLE_MS } = {}) {
    if (elapsedMs <= 0) return stretch;
    if (elapsedMs >= settleMs) return 0;
    const omega = 8 / settleMs;
    const x = elapsedMs * omega;
    return stretch * (1 + x) * Math.exp(-x);
}

/**
 * The `settleMs` that makes `springBack` follow a spring token's config
 * (`tokens/ladder/springs.generated.js`, ADR-041). `springBackValue` is a
 * critically damped response with omega = 8 / settleMs, so a token fits it
 * when its damping is critical: settleMs = 8 / sqrt(k / m), in ms. The
 * appearance family is critically damped; a bouncy spring throws.
 */
export function settleMsOf({ stiffness, damping, mass = 1 }) {
    const ratio = damping / (2 * Math.sqrt(stiffness * mass));
    if (Math.abs(ratio - 1) > 0.01) throw new Error(`settleMsOf takes a critically damped spring; this one has a damping ratio of ${ratio.toFixed(2)}`);
    return 8000 / Math.sqrt(stiffness / mass);
}

/**
 * Animate the stretch back to 0. Under reduced motion it lands on 0 in one call.
 * Returns a cancel function. `raf`, `caf` and `now` are injectable for tests.
 */
export function springBack(
    stretch,
    {
        reducedMotion = false,
        settleMs = DEFAULT_SETTLE_MS,
        onUpdate = () => {},
        onDone = () => {},
        raf = (cb) => requestAnimationFrame(cb),
        caf = (id) => cancelAnimationFrame(id),
        now = () => performance.now(),
    } = {},
) {
    if (!(stretch > 0)) {
        onDone();
        return () => {};
    }
    if (reducedMotion) {
        onUpdate(0);
        onDone();
        return () => {};
    }
    let cancelled = false;
    let id;
    const start = now();
    const frame = (time) => {
        if (cancelled) return;
        const elapsed = (typeof time === 'number' ? time : now()) - start;
        const value = springBackValue(stretch, elapsed, { settleMs });
        onUpdate(value);
        if (value === 0) onDone();
        else id = raf(frame);
    };
    id = raf(frame);
    return () => {
        cancelled = true;
        if (id !== undefined) caf(id);
    };
}
