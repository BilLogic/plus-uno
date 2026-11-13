import { useLayoutEffect, useRef, useState } from 'react';

/** Keep an owned overlay mounted until every exit finishes, including its children.
 * A reopen cancels the pending removal; no guessed timer can cut a spring short.
 */
export function useOverlayPresence(open, ref) {
    const [present, setPresent] = useState(open);
    if (open && !present) setPresent(true);
    useLayoutEffect(() => {
        if (open || !present || !ref.current) return undefined;
        let current = true;
        const animations = (ref.current.getAnimations?.({ subtree: true }) ?? [])
            .filter((animation) => animation.effect.getComputedTiming().iterations !== Infinity);
        Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            if (current) setPresent(false);
        });
        return () => { current = false; };
    }, [open, present, ref]);
    return open || present;
}

/** Modal scale originates at the control that opened it, captured before focus moves. */
export function useOverlayOrigin(open, ref) {
    const trigger = useRef(null);
    if (open && !trigger.current) trigger.current = document.activeElement;
    useLayoutEffect(() => {
        if (!open) { trigger.current = null; return; }
        const surface = ref.current;
        const anchor = trigger.current;
        if (!surface || !anchor || anchor === document.body || surface.contains(anchor)) return;
        const a = anchor.getBoundingClientRect();
        const b = surface.getBoundingClientRect();
        surface.style.setProperty('--plus-overlay-origin', `${a.left + a.width / 2 - b.left}px ${a.top + a.height / 2 - b.top}px`);
    }, [open, ref]);
}
