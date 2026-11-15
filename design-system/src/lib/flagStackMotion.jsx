import { createContext, useCallback, useContext, useId, useMemo, useReducer, useRef } from 'react';
import { STAGGER, staggerDelays } from './listMotion';

/** Default visible Flag cap before new arrivals wait in the queue. */
export const MAX_VISIBLE_FLAGS = 4;

const URGENT_APPEARANCES = new Set(['warning', 'error']);

const isUrgentFlag = (flag) => URGENT_APPEARANCES.has(flag?.appearance);

/**
 * Timing and sound plan for Flags arriving together in a burst:
 * arrivals stagger 20 ms apart (capped at 500 ms), the stack shifts on `spatial.default`
 * (`appearance.fast` fade in place under reduced motion), and Notify sounds once for the burst.
 */
export function planFlagBurst(count) {
    const safeCount = Math.max(0, Number(count) || 0);
    const delaysMs = staggerDelays(safeCount);
    return {
        delaysMs,
        playSoundFlags: delaysMs.map((_, index) => index === 0),
        stackToken: 'spatial.default',
        reducedStackToken: 'appearance.fast',
    };
}

const insertQueuedByPriority = (queued, flag) => {
    if (isUrgentFlag(flag)) {
        const firstRoutineIndex = queued.findIndex((item) => !isUrgentFlag(item));
        if (firstRoutineIndex === -1) return [...queued, flag];
        return [
            ...queued.slice(0, firstRoutineIndex),
            flag,
            ...queued.slice(firstRoutineIndex),
        ];
    }
    return [...queued, flag];
};

/**
 * Pure reducer for the Notifications Flag queue:
 * - Newest visible Flag sits at index 0 (top of the stack).
 * - Visible Flags are capped at `maxVisible`; overflow waits in `queued`.
 * - Urgent Flags (`warning`, `error`) queue ahead of routine ones so they surface next.
 * - Dismissing a visible Flag promotes the next queued Flag to the top of the stack.
 */
export function reduceFlagQueue(state = { visible: [], queued: [] }, action, { maxVisible = MAX_VISIBLE_FLAGS } = {}) {
    const cap = Math.max(1, Number(maxVisible) || MAX_VISIBLE_FLAGS);
    const visible = state.visible ?? [];
    const queued = state.queued ?? [];

    switch (action?.type) {
        case 'push': {
            const incoming = action.flag;
            if (!incoming || !incoming.id) return state;
            if (visible.some((f) => f.id === incoming.id) || queued.some((f) => f.id === incoming.id)) {
                return state;
            }
            if (visible.length < cap) {
                return {
                    visible: [incoming, ...visible],
                    queued,
                };
            }
            return {
                visible,
                queued: insertQueuedByPriority(queued, incoming),
            };
        }
        case 'pushBurst': {
            const flags = Array.isArray(action.flags) ? action.flags : [];
            if (flags.length === 0) return state;
            let nextState = state;
            flags.forEach((flag) => {
                nextState = reduceFlagQueue(
                    nextState,
                    { type: 'push', flag },
                    { maxVisible: cap },
                );
            });
            const arrivedIds = new Set(flags.map((f) => f.id));
            const visibleBurstCount = nextState.visible.filter((f) => arrivedIds.has(f.id)).length;
            const burst = planFlagBurst(visibleBurstCount);
            let burstIndex = 0;
            return {
                ...nextState,
                visible: nextState.visible.map((item) => {
                    if (!arrivedIds.has(item.id)) return item;
                    const delay = burst.delaysMs[burstIndex] ?? 0;
                    burstIndex += 1;
                    return { ...item, staggerDelayMs: delay };
                }),
            };
        }
        case 'dismiss': {
            const targetId = action.id;
            const remainingVisible = visible.filter((f) => f.id !== targetId);
            const remainingQueued = queued.filter((f) => f.id !== targetId);
            if (remainingVisible.length < cap && remainingQueued.length > 0) {
                const [promoted, ...restQueued] = remainingQueued;
                return {
                    visible: [promoted, ...remainingVisible],
                    queued: restQueued,
                };
            }
            return {
                visible: remainingVisible,
                queued: remainingQueued,
            };
        }
        case 'clear':
            return { visible: [], queued: [] };
        default:
            return state;
    }
}

/**
 * Stateful hook for driving a `FlagGroup` queue in product surfaces and stories.
 */
export function useFlagQueue(initialFlags = [], { maxVisible = MAX_VISIBLE_FLAGS } = {}) {
    const seqRef = useRef(0);
    const [state, dispatch] = useReducer(
        (current, action) => reduceFlagQueue(current, action, { maxVisible }),
        initialFlags,
        (seed) => {
            if (!Array.isArray(seed) || seed.length === 0) return { visible: [], queued: [] };
            return reduceFlagQueue({ visible: [], queued: [] }, { type: 'pushBurst', flags: seed }, { maxVisible });
        },
    );

    const ensureId = useCallback((flag) => {
        if (flag?.id) return flag;
        seqRef.current += 1;
        return { ...flag, id: `flag-queue-${seqRef.current}` };
    }, []);

    const push = useCallback((flag) => {
        const normalized = ensureId(flag);
        dispatch({ type: 'push', flag: normalized });
        return normalized.id;
    }, [ensureId]);

    const pushBurst = useCallback((flags) => {
        const normalized = (flags ?? []).map(ensureId);
        dispatch({ type: 'pushBurst', flags: normalized });
        return normalized.map((f) => f.id);
    }, [ensureId]);

    const dismiss = useCallback((id) => {
        dispatch({ type: 'dismiss', id });
    }, []);

    const clear = useCallback(() => {
        dispatch({ type: 'clear' });
    }, []);

    return {
        visible: state.visible,
        queued: state.queued,
        push,
        pushBurst,
        dismiss,
        clear,
    };
}

export const FlagStackContext = createContext(undefined);

/**
 * Shared stack coordinator created per `FlagGroup`:
 * coalesces simultaneous burst arrivals (staggering entrance by 20 ms and playing Notify once)
 * and shares the group's reduced-motion preference.
 */
export function useFlagGroupCoordinator(reducedMotion) {
    const groupId = useId();
    const burstBucketRef = useRef({ tick: null, count: 0 });

    const claimArrivalSlot = useCallback(() => {
        const bucket = burstBucketRef.current;
        if (bucket.tick === null) {
            bucket.count = 0;
            bucket.tick = Promise.resolve().then(() => {
                bucket.tick = null;
                bucket.count = 0;
            });
        }
        const index = bucket.count;
        bucket.count += 1;
        return {
            index,
            delayMs: Math.min(index * STAGGER.gap, STAGGER.cap),
            playSound: index === 0,
        };
    }, []);

    return useMemo(() => ({
        groupId,
        reducedMotion,
        claimArrivalSlot,
    }), [groupId, reducedMotion, claimArrivalSlot]);
}

export function useFlagStack() {
    return useContext(FlagStackContext);
}
