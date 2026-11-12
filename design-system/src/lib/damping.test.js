import { describe, it, expect, vi } from 'vitest';
import { dampedStretch, dampedPosition, springBackValue, springBack, settleMsOf } from './damping';
import { SPRINGS } from '../tokens/ladder/springs.generated.js';

const opts = { limit: 640, stiffness: 0.5, maxStretch: 48 };

describe('dampedStretch', () => {
    it('is zero at and below the limit', () => {
        expect(dampedStretch(0, opts)).toBe(0);
        expect(dampedStretch(639, opts)).toBe(0);
        expect(dampedStretch(640, opts)).toBe(0);
        expect(dampedStretch(-50, opts)).toBe(0);
    });

    it('is positive above the limit', () => {
        expect(dampedStretch(641, opts)).toBeGreaterThan(0);
    });

    it('is monotonic above the limit', () => {
        let prev = 0;
        for (let p = 641; p <= 5000; p += 7) {
            const s = dampedStretch(p, opts);
            expect(s).toBeGreaterThanOrEqual(prev);
            prev = s;
        }
    });

    it('is strictly increasing in the working range', () => {
        expect(dampedStretch(700, opts)).toBeGreaterThan(dampedStretch(660, opts));
    });

    it('never exceeds the maximum stretch', () => {
        for (const p of [641, 700, 1000, 10000, 1e9]) {
            expect(dampedStretch(p, opts)).toBeLessThanOrEqual(opts.maxStretch);
        }
    });

    it('starts at the stiffness slope: less than the raw overshoot', () => {
        const s = dampedStretch(650, opts);
        expect(s).toBeLessThan(10);
        expect(s).toBeCloseTo(5, 0);
    });

    it('a stiffer setting stretches further for the same overshoot', () => {
        const soft = dampedStretch(700, { ...opts, stiffness: 0.2 });
        const stiff = dampedStretch(700, { ...opts, stiffness: 0.8 });
        expect(stiff).toBeGreaterThan(soft);
    });

    it('a larger maximum stretch allows a larger result', () => {
        expect(dampedStretch(5000, { ...opts, maxStretch: 100 })).toBeGreaterThan(dampedStretch(5000, opts));
    });

    it('a zero maximum stretch is a hard wall', () => {
        expect(dampedStretch(5000, { ...opts, maxStretch: 0 })).toBe(0);
    });
});

describe('dampedPosition', () => {
    it('follows the pointer 1:1 up to the limit', () => {
        expect(dampedPosition(500, opts)).toBe(500);
        expect(dampedPosition(640, opts)).toBe(640);
    });
    it('resists past the limit and stays bounded', () => {
        expect(dampedPosition(700, opts)).toBeGreaterThan(640);
        expect(dampedPosition(700, opts)).toBeLessThan(700);
        expect(dampedPosition(1e9, opts)).toBeLessThanOrEqual(640 + 48);
    });
});

describe('springBackValue', () => {
    it('starts at the stretch and settles to zero', () => {
        expect(springBackValue(30, 0)).toBe(30);
        expect(springBackValue(30, 2000)).toBe(0);
    });
    it('never goes negative and decreases over time', () => {
        let prev = 30;
        for (let t = 0; t <= 400; t += 10) {
            const v = springBackValue(30, t, { settleMs: 300 });
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(prev);
            prev = v;
        }
    });
});

describe('springBack', () => {
    const fakeRaf = () => {
        let t = 0;
        const queue = [];
        return {
            now: () => t,
            raf: (cb) => {
                queue.push(cb);
                return queue.length;
            },
            cancel: vi.fn(),
            step: (ms) => {
                t += ms;
                const cb = queue.shift();
                if (cb) cb(t);
            },
            pending: () => queue.length,
        };
    };

    it('jumps straight to rest under reduced motion', () => {
        const onUpdate = vi.fn();
        const onDone = vi.fn();
        const env = fakeRaf();
        springBack(30, { reducedMotion: true, onUpdate, onDone, raf: env.raf, now: env.now });
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenCalledWith(0);
        expect(onDone).toHaveBeenCalledTimes(1);
        expect(env.pending()).toBe(0);
    });

    it('animates down to zero otherwise, then finishes', () => {
        const values = [];
        const onDone = vi.fn();
        const env = fakeRaf();
        springBack(30, { settleMs: 300, onUpdate: (v) => values.push(v), onDone, raf: env.raf, now: env.now });
        for (let i = 0; i < 40 && env.pending(); i += 1) env.step(16);
        expect(values[0]).toBeLessThan(30);
        expect(values[values.length - 1]).toBe(0);
        expect(onDone).toHaveBeenCalledTimes(1);
        expect(Math.max(...values)).toBeLessThanOrEqual(30);
    });

    it('finishes at once when there is nothing to spring back', () => {
        const onUpdate = vi.fn();
        const onDone = vi.fn();
        const env = fakeRaf();
        springBack(0, { onUpdate, onDone, raf: env.raf, now: env.now });
        expect(onDone).toHaveBeenCalledTimes(1);
        expect(env.pending()).toBe(0);
    });

    it('returns a cancel that stops further frames', () => {
        const onUpdate = vi.fn();
        const onDone = vi.fn();
        const env = fakeRaf();
        const cancel = springBack(30, { onUpdate, onDone, raf: env.raf, now: env.now, caf: env.cancel });
        cancel();
        env.step(16);
        expect(onUpdate).not.toHaveBeenCalled();
        expect(onDone).not.toHaveBeenCalled();
    });
});

describe('settleMsOf', () => {
    it('reads a critically damped spring token: settle = 8 / omega', () => {
        // omega = sqrt(k / m) = 40 rad/s, so 8 / 0.04 per ms = 200 ms.
        expect(settleMsOf({ stiffness: 1600, damping: 80, mass: 1 })).toBeCloseTo(200, 5);
    });

    it('resolves every appearance spring token', () => {
        for (const name of ['appearance.fast', 'appearance.default', 'appearance.slow']) {
            expect(settleMsOf(SPRINGS[name].productive)).toBeGreaterThan(0);
        }
    });

    it('a stiffer spring settles sooner', () => {
        expect(settleMsOf(SPRINGS['appearance.fast'].productive)).toBeLessThan(settleMsOf(SPRINGS['appearance.slow'].productive));
    });

    it('refuses a spring that is not critically damped, which springBack cannot follow', () => {
        expect(() => settleMsOf(SPRINGS['spatial.fast'].expressive)).toThrow(/critically damped/);
    });
});
