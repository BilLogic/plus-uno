import { afterEach, describe, expect, it, vi } from 'vitest';
import { settleAnimations } from './overlay-motion-plays';

afterEach(() => {
    vi.useRealTimers();
});

const fakeAnimation = ({ playState = 'running', iterations = 1, finished } = {}) => {
    let resolveFinished;
    const promise = finished ?? new Promise((resolve) => {
        resolveFinished = resolve;
    });
    const animation = {
        playState,
        effect: { getComputedTiming: () => ({ iterations }) },
        finished: promise,
        finishNow: () => {
            animation.playState = 'finished';
            resolveFinished?.();
        },
    };
    return animation;
};

describe('settleAnimations', () => {
    it('waits for running finite animations and follow-up animations spawned while waiting', async () => {
        vi.useFakeTimers();
        const first = fakeAnimation();
        const second = fakeAnimation();
        const active = [first];
        const element = { getAnimations: () => active };

        const start = Date.now();
        let settled = false;
        const run = settleAnimations(element, 1000).then(() => {
            settled = true;
        });

        await Promise.resolve();
        expect(settled).toBe(false);

        // Spawn a follow-up animation (e.g. PresenceSlot's delayed fade) before the first ends.
        active.push(second);
        first.finishNow();
        await vi.advanceTimersByTimeAsync(0);
        expect(settled).toBe(false);

        second.finishNow();
        await run;
        expect(settled).toBe(true);
        expect(Date.now() - start).toBeLessThan(1000);
    });

    it('ignores infinite-iteration and paused animations', async () => {
        const looping = fakeAnimation({ iterations: Infinity });
        const paused = fakeAnimation({ playState: 'paused' });
        const element = { getAnimations: () => [looping, paused] };

        await expect(settleAnimations(element, 50)).resolves.toBeUndefined();
    });

    it('caps the wait so a stuck or looping animation cannot hang', async () => {
        vi.useFakeTimers();
        const stuck = fakeAnimation();
        const element = { getAnimations: () => [stuck] };

        let settled = false;
        const run = settleAnimations(element, 150).then(() => {
            settled = true;
        });

        await vi.advanceTimersByTimeAsync(100);
        expect(settled).toBe(false);

        await vi.advanceTimersByTimeAsync(50);
        await run;
        expect(settled).toBe(true);
    });
});
