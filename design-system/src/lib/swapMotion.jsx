import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate } from 'motion/react';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { measureSpringToken } from './listMotion';
import { useMotionReduced } from './motionPreference';
import '@/styles/_pattern-motion.scss';

/**
 * Clean fades (Choreography & Transitions § Swap content in place):
 * Incoming content begins when outgoing content is ~90% out (the t90 of `appearance.fast`),
 * leaving one clean gap so text-like views never cross-fade into mud.
 */
export const CLEAN_FADE_GAP_MS = measureSpringToken('appearance.fast').t90Ms;

/**
 * Timing plan for swapping content inside a stable container:
 * outgoing fades on `appearance.fast` at 0 ms; incoming fades on `appearance.fast`
 * starting at `CLEAN_FADE_GAP_MS`. Zero spatial movement in both normal and reduced modes.
 */
export function planSwapInPlace({ reduced = false } = {}) {
    void reduced;
    return {
        outToken: 'appearance.fast',
        outStartsAtMs: 0,
        inToken: 'appearance.fast',
        inStartsAtMs: CLEAN_FADE_GAP_MS,
        spatial: false,
    };
}

const canAnimateDom = (el) => Boolean(
    el
    && typeof window !== 'undefined'
    && typeof el.getBoundingClientRect === 'function'
    && (el.offsetHeight > 0 || el.getClientRects?.().length > 0)
);

/**
 * SwapInPlace: fades outgoing content out on `appearance.fast`, holds incoming content hidden
 * across `CLEAN_FADE_GAP_MS` so the two never overprint, then fades incoming content in on
 * `appearance.fast`. Renders at rest on initial mount.
 */
export function SwapInPlace({
    swapKey,
    children,
    reducedMotion,
    as: Tag = 'div',
    className = '',
    style,
    onSwapComplete,
    ...props
}) {
    const osReduced = useMotionReduced();
    const reduced = reducedMotion ?? osReduced;
    const hostRef = useRef(null);
    const outRef = useRef(null);
    const inRef = useRef(null);
    const prevKeyRef = useRef(swapKey);
    const prevChildrenRef = useRef(children);

    const [swapState, setSwapState] = useState({ phase: 'settled', outgoing: null, token: 0 });

    if (swapKey !== prevKeyRef.current) {
        const outgoingSnapshot = prevChildrenRef.current;
        prevKeyRef.current = swapKey;
        setSwapState((prev) => ({
            phase: 'out',
            outgoing: outgoingSnapshot,
            token: prev.token + 1,
        }));
    }
    prevChildrenRef.current = children;

    useLayoutEffect(() => {
        if (swapState.phase === 'settled') {
            if (inRef.current) inRef.current.style.opacity = '';
            return undefined;
        }

        const host = hostRef.current;
        const incoming = inRef.current;
        const outgoing = outRef.current;

        if (!canAnimateDom(host) || !incoming) {
            incoming && (incoming.style.opacity = '');
            setSwapState({ phase: 'settled', outgoing: null, token: swapState.token });
            onSwapComplete?.();
            return undefined;
        }

        let cancelled = false;
        const controls = [];
        const plan = planSwapInPlace({ reduced });

        incoming.style.opacity = '0';
        if (outgoing) {
            const outCtrl = animate(outgoing, { opacity: [1, 0] }, SPRINGS[plan.outToken].productive);
            controls.push(outCtrl);
        }

        const gapTimer = setTimeout(() => {
            if (cancelled) return;
            setSwapState((prev) => (prev.token === swapState.token ? { ...prev, phase: 'in' } : prev));
            const inCtrl = animate(incoming, { opacity: [0, 1] }, SPRINGS[plan.inToken].productive);
            controls.push(inCtrl);
            Promise.allSettled(controls.map((c) => c.finished)).then(() => {
                if (cancelled) return;
                incoming.style.opacity = '';
                setSwapState((prev) => (prev.token === swapState.token ? { phase: 'settled', outgoing: null, token: prev.token } : prev));
                onSwapComplete?.();
            });
        }, plan.inStartsAtMs);

        return () => {
            cancelled = true;
            clearTimeout(gapTimer);
            controls.forEach((ctrl) => ctrl?.stop?.());
        };
    }, [swapState.token]);

    useEffect(() => () => {
        if (inRef.current) inRef.current.style.opacity = '';
    }, []);

    return (
        <Tag
            ref={hostRef}
            data-swap-stage=""
            data-swap-phase={swapState.phase}
            data-reduced={reduced ? 'true' : 'false'}
            className={className || undefined}
            style={style}
            {...props}
        >
            {swapState.outgoing != null && (
                <div
                    ref={outRef}
                    data-swap-outgoing=""
                    aria-hidden="true"
                    inert
                >
                    {swapState.outgoing}
                </div>
            )}
            <div ref={inRef} data-swap-incoming="">
                {children}
            </div>
        </Tag>
    );
}

SwapInPlace.propTypes = {
    swapKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
    children: PropTypes.node,
    reducedMotion: PropTypes.bool,
    as: PropTypes.elementType,
    className: PropTypes.string,
    style: PropTypes.object,
    onSwapComplete: PropTypes.func,
};
