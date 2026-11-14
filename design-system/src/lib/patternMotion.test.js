import { describe, expect, it } from 'vitest';
import {
    EXIT_FADE_MS,
    ROOM_READY_MS,
    STAGGER,
    planEnterWithRoom,
    planExitBeforeReflow,
    planListTransition,
    shouldSwapWholeList,
    staggerDelays,
    staggerGap,
} from './listMotion';
import { CLEAN_FADE_GAP_MS, planSwapInPlace } from './swapMotion';
import { LOAD_QUIET_WAIT_MS, planLoadReveal } from './loadRevealMotion';
import { MAX_VISIBLE_FLAGS, planFlagBurst, reduceFlagQueue } from './flagStackMotion';

describe('stagger timing rules (listMotion)', () => {
    it('spaces small sets 20 ms apart so five items span 80 ms', () => {
        expect(STAGGER).toEqual({ gap: 20, cap: 500 });
        expect(staggerGap(5)).toBe(20);
        const five = staggerDelays(5);
        expect(five).toEqual([0, 20, 40, 60, 80]);
        expect(five[4] - five[0]).toBe(80);
    });

    it('caps large sets at 500 ms divided by item count so the set arrives within half a second', () => {
        const forty = staggerDelays(40);
        expect(forty).toHaveLength(40);
        expect(staggerGap(40)).toBe(12.5);
        expect(Math.max(...forty)).toBeLessThanOrEqual(STAGGER.cap);
        expect(forty[39]).toBeGreaterThan(forty[0]);
    });

    it('handles empty and single-item sets without NaN or negative delays', () => {
        expect(staggerDelays(0)).toEqual([]);
        expect(staggerDelays(1)).toEqual([0]);
        expect(staggerDelays(4, 0)).toEqual([0, 0, 0, 0]);
    });
});

describe('exit before reflow and room-first enter (listMotion)', () => {
    it('finishes fading the leaving item on appearance.fast before starting spatial.fast reflow', () => {
        const normal = planExitBeforeReflow({ reduced: false });
        expect(EXIT_FADE_MS).toBeGreaterThan(60);
        expect(EXIT_FADE_MS).toBeLessThan(180);
        expect(normal).toEqual({
            fadeToken: 'appearance.fast',
            fadeStartsAtMs: 0,
            fadeMs: EXIT_FADE_MS,
            collapseToken: 'spatial.fast',
            reflowStartsAtMs: EXIT_FADE_MS,
        });
        expect(normal.reflowStartsAtMs).toBeGreaterThanOrEqual(normal.fadeMs);
    });

    it('drops spatial collapse under reduced motion while preserving the fade out', () => {
        const reduced = planExitBeforeReflow({ reduced: true });
        expect(reduced).toEqual({
            fadeToken: 'appearance.fast',
            fadeStartsAtMs: 0,
            fadeMs: EXIT_FADE_MS,
            collapseToken: null,
            reflowStartsAtMs: EXIT_FADE_MS,
        });
    });

    it('waits for room on spatial.fast before fading new item content in, or fades at 0 under reduced motion', () => {
        const normal = planEnterWithRoom({ reduced: false });
        expect(ROOM_READY_MS).toBeGreaterThan(40);
        expect(normal.spatialToken).toBe('spatial.fast');
        expect(normal.appearanceToken).toBe('appearance.fast');
        expect(normal.contentStartsAtMs).toBe(ROOM_READY_MS);

        const reduced = planEnterWithRoom({ reduced: true });
        expect(reduced.spatialToken).toBeNull();
        expect(reduced.appearanceToken).toBe('appearance.fast');
        expect(reduced.contentStartsAtMs).toBe(0);
    });
});

describe('list transition classification and reorder stagger order (listMotion)', () => {
    it('staggers moved items in destination top-to-bottom order on reorder', () => {
        const prev = ['ava', 'marcus', 'sofia', 'jordan'];
        const next = ['ava', 'jordan', 'ava-stays', 'sofia'];
        expect(planListTransition(prev, ['sofia', 'ava', 'jordan', 'marcus'])).toEqual({
            kind: 'reorder',
            movedKeys: ['sofia', 'ava', 'jordan', 'marcus'],
            delaysByKey: {
                sofia: 0,
                ava: 20,
                jordan: 40,
                marcus: 60,
            },
            spatialToken: 'spatial.default',
            reducedToken: 'appearance.fast',
        });

        // Unmoved items keep delay 0 and do not consume stagger slots of moved items.
        const partial = planListTransition(['ava', 'marcus', 'sofia'], ['ava', 'sofia', 'marcus']);
        expect(partial.kind).toBe('reorder');
        expect(partial.movedKeys).toEqual(['sofia', 'marcus']);
        expect(partial.delaysByKey).toEqual({ sofia: 0, marcus: 20 });
        expect(next).toBeDefined();
    });

    it('classifies additions and removals and flags whole-list swaps at one third or more', () => {
        const addOne = planListTransition(['a', 'b', 'c', 'd'], ['a', 'x', 'b', 'c', 'd']);
        expect(addOne.kind).toBe('presence');
        expect(addOne.addedKeys).toEqual(['x']);
        expect(addOne.removedKeys).toEqual([]);

        const removeOne = planListTransition(['a', 'b', 'c', 'd'], ['a', 'c', 'd']);
        expect(removeOne.kind).toBe('presence');
        expect(removeOne.removedKeys).toEqual(['b']);

        expect(shouldSwapWholeList(['a', 'b', 'c', 'd', 'e', 'f'], ['a', 'b', 'c', 'd', 'e'])).toBe(false);
        expect(shouldSwapWholeList(['a', 'b', 'c', 'd', 'e', 'f'], ['a', 'b', 'x', 'y', 'z', 'w'])).toBe(true);
    });
});

describe('clean-fade swap in place (swapMotion)', () => {
    it('starts incoming content at the 90% time of appearance.fast rather than cross-fading at 0', () => {
        expect(CLEAN_FADE_GAP_MS).toBeGreaterThan(40);
        expect(CLEAN_FADE_GAP_MS).toBeLessThan(120);
        const plan = planSwapInPlace({ reduced: false });
        expect(plan).toEqual({
            outToken: 'appearance.fast',
            outStartsAtMs: 0,
            inToken: 'appearance.fast',
            inStartsAtMs: CLEAN_FADE_GAP_MS,
            spatial: false,
        });
        expect(planSwapInPlace({ reduced: true })).toEqual(plan);
    });
});

describe('load then reveal timing and order (loadRevealMotion)', () => {
    it('holds quiet under 200 ms and reveals content slots in staggered load order over fading skeleton', () => {
        expect(LOAD_QUIET_WAIT_MS).toBe(200);
        const normal = planLoadReveal(4, { reduced: false });
        expect(normal).toEqual({
            quietWaitMs: 200,
            shimmer: true,
            skeletonOutToken: 'appearance.fast',
            skeletonOutStartsAtMs: 0,
            contentInToken: 'appearance.default',
            slotDelaysMs: [0, 20, 40, 60],
            crossfade: true,
        });

        const reduced = planLoadReveal(4, { reduced: true });
        expect(reduced.shimmer).toBe(false);
        expect(reduced.contentInToken).toBe('appearance.fast');
        expect(reduced.slotDelaysMs).toEqual([0, 20, 40, 60]);
    });
});

describe('notifications stacking and Flags queue (flagStackMotion)', () => {
    it('places newest visible flags on top, caps visible stack, and promotes queued flags on dismiss', () => {
        expect(MAX_VISIBLE_FLAGS).toBeGreaterThanOrEqual(3);
        let state = { visible: [], queued: [] };
        state = reduceFlagQueue(state, { type: 'push', flag: { id: 'f1', title: 'One' } }, { maxVisible: 2 });
        state = reduceFlagQueue(state, { type: 'push', flag: { id: 'f2', title: 'Two' } }, { maxVisible: 2 });
        state = reduceFlagQueue(state, { type: 'push', flag: { id: 'f3', title: 'Three' } }, { maxVisible: 2 });

        // Newest of the first batch sits on top; third waits in queue while stack is full.
        expect(state.visible.map((f) => f.id)).toEqual(['f2', 'f1']);
        expect(state.queued.map((f) => f.id)).toEqual(['f3']);

        // Urgent queued flags promote ahead of routine queued flags when a visible flag leaves.
        state = reduceFlagQueue(state, { type: 'push', flag: { id: 'f4', title: 'Error', appearance: 'error' } }, { maxVisible: 2 });
        expect(state.queued.map((f) => f.id)).toEqual(['f4', 'f3']);

        state = reduceFlagQueue(state, { type: 'dismiss', id: 'f1' }, { maxVisible: 2 });
        expect(state.visible.map((f) => f.id)).toEqual(['f4', 'f2']);
        expect(state.queued.map((f) => f.id)).toEqual(['f3']);
    });

    it('staggers burst arrivals and plays arrival sound once for the burst', () => {
        const burst = planFlagBurst(3);
        expect(burst.delaysMs).toEqual([0, 20, 40]);
        expect(burst.playSoundFlags).toEqual([true, false, false]);
        expect(burst.stackToken).toBe('spatial.default');
        expect(burst.reducedStackToken).toBe('appearance.fast');

        const queuedBurst = reduceFlagQueue(
            { visible: [], queued: [] },
            {
                type: 'pushBurst',
                flags: [
                    { id: 'b1', title: 'First' },
                    { id: 'b2', title: 'Second' },
                ],
            },
            { maxVisible: 3 },
        );
        // b2 sits on top at delay 0 ms, b1 below at 20 ms, and neither has sound force-muted before mount.
        expect(queuedBurst.visible.map((f) => [f.id, f.staggerDelayMs, f.sound])).toEqual([
            ['b2', 0, undefined],
            ['b1', 20, undefined],
        ]);
    });
});
