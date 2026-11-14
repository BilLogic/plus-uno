import React, { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate } from 'motion/react';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { staggerDelays } from './listMotion';
import { useMotionReduced } from './motionPreference';
import '@/styles/_pattern-motion.scss';

/** Wait threshold before showing a loading placeholder for a fast in-flight fetch (Transitions § Load content). */
export const LOAD_QUIET_WAIT_MS = 200;

/**
 * Timing plan for loading -> content reveal:
 * - Skeleton shimmers on `linear` while loading (stopped under reduced motion).
 * - On arrival, content fades in over the Skeleton in load order on `appearance.default`
 *   (`appearance.fast` under reduced motion), staggered 20 ms apart (capped at 500 ms),
 *   while the Skeleton fades out underneath on `appearance.fast` (true crossfade).
 */
export function planLoadReveal(slotCount = 1, { reduced = false } = {}) {
    const count = Math.max(1, Number(slotCount) || 1);
    return {
        quietWaitMs: LOAD_QUIET_WAIT_MS,
        shimmer: !reduced,
        skeletonOutToken: 'appearance.fast',
        skeletonOutStartsAtMs: 0,
        contentInToken: reduced ? 'appearance.fast' : 'appearance.default',
        slotDelaysMs: staggerDelays(count),
        crossfade: true,
    };
}

const canAnimateDom = (el) => Boolean(
    el
    && typeof window !== 'undefined'
    && typeof el.getBoundingClientRect === 'function'
    && (el.offsetHeight > 0 || el.getClientRects?.().length > 0)
);

/** Optional wrapper to group elements into ordered load-reveal slots (headings -> data -> actions -> charts). */
export function LoadRevealSlot({ children, className = '', style, ...props }) {
    return (
        <div data-load-slot="" className={className || undefined} style={style} {...props}>
            {children}
        </div>
    );
}

LoadRevealSlot.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
};

const flattenSlots = (children) => Children.toArray(children).flatMap((child) => (
    isValidElement(child) && child.type === React.Fragment ? flattenSlots(child.props.children) : [child]
));

/**
 * LoadThenReveal: holds layout with a Skeleton while loading (after optional `quietMs` threshold),
 * then cross-fades real content in over the fading Skeleton in staggered load order.
 */
export function LoadThenReveal({
    loading = false,
    skeleton,
    quietMs = 0,
    reducedMotion,
    as: Tag = 'div',
    className = '',
    style,
    onRevealComplete,
    children,
    ...props
}) {
    const osReduced = useMotionReduced();
    const reduced = reducedMotion ?? osReduced;
    const hostRef = useRef(null);
    const skeletonExitRef = useRef(null);
    const contentRef = useRef(null);

    // If mounted already loading, show skeleton right away unless quietMs > 0 is asked on a later transition.
    const [phase, setPhase] = useState(() => (loading ? 'loading' : 'settled'));
    const [revealRun, setRevealRun] = useState(0);
    const prevLoadingRef = useRef(loading);

    useEffect(() => {
        if (loading === prevLoadingRef.current) return undefined;
        prevLoadingRef.current = loading;

        if (loading) {
            if (quietMs > 0) {
                setPhase('quiet');
                const timer = setTimeout(() => {
                    setPhase((current) => (current === 'quiet' ? 'loading' : current));
                }, quietMs);
                return () => clearTimeout(timer);
            }
            setPhase('loading');
            return undefined;
        }

        // Loading finished: if we never showed the skeleton (finished within quiet wait), stay settled with no flash.
        setPhase((current) => {
            if (current === 'loading') {
                setRevealRun((n) => n + 1);
                return 'revealing';
            }
            return 'settled';
        });
        return undefined;
    }, [loading, quietMs]);

    useLayoutEffect(() => {
        if (phase !== 'revealing') return undefined;
        const host = hostRef.current;
        const content = contentRef.current;
        const exitingSkeleton = skeletonExitRef.current;

        if (!canAnimateDom(host) || !content) {
            setPhase('settled');
            onRevealComplete?.();
            return undefined;
        }

        let cancelled = false;
        const controls = [];

        const explicitSlots = Array.from(content.querySelectorAll('[data-load-slot]'));
        const targets = explicitSlots.length > 0
            ? explicitSlots
            : Array.from(content.children);
        const slotNodes = targets.length > 0 ? targets : [content];
        const plan = planLoadReveal(slotNodes.length, { reduced });

        if (exitingSkeleton) {
            const skOut = animate(
                exitingSkeleton,
                { opacity: [1, 0] },
                SPRINGS[plan.skeletonOutToken].productive,
            );
            controls.push(skOut);
        }

        slotNodes.forEach((node, index) => {
            node.style.opacity = '0';
            const delaySec = (plan.slotDelaysMs[index] ?? 0) / 1000;
            const ctrl = animate(
                node,
                { opacity: [0, 1] },
                { ...SPRINGS[plan.contentInToken].productive, delay: delaySec },
            );
            controls.push(ctrl);
        });

        Promise.allSettled(controls.map((c) => c.finished)).then(() => {
            if (cancelled) return;
            slotNodes.forEach((node) => { node.style.opacity = ''; });
            setPhase('settled');
            onRevealComplete?.();
        });

        return () => {
            cancelled = true;
            controls.forEach((ctrl) => ctrl?.stop?.());
            slotNodes.forEach((node) => { node.style.opacity = ''; });
        };
    }, [phase, revealRun, reduced, onRevealComplete]);

    const renderSkeleton = () => (typeof skeleton === 'function' ? skeleton({ reduced }) : skeleton);

    const items = flattenSlots(children);
    const hasExplicitSlots = items.some((item) => isValidElement(item) && item.type === LoadRevealSlot);

    return (
        <Tag
            ref={hostRef}
            data-load-reveal=""
            data-load-phase={phase}
            data-reduced={reduced ? 'true' : 'false'}
            aria-busy={loading ? 'true' : undefined}
            className={className || undefined}
            style={style}
            {...props}
        >
            {phase === 'loading' && (
                <div data-load-skeleton="">
                    {renderSkeleton()}
                </div>
            )}
            {phase === 'revealing' && skeleton != null && (
                <div
                    ref={skeletonExitRef}
                    data-load-skeleton-exiting=""
                    aria-hidden="true"
                    inert
                >
                    {renderSkeleton()}
                </div>
            )}
            {phase !== 'loading' && (
                <div ref={contentRef} data-load-content="">
                    {hasExplicitSlots
                        ? children
                        : items.map((child, index) => (
                            <div key={isValidElement(child) && child.key != null ? child.key : index} data-load-slot="">
                                {child}
                            </div>
                        ))}
                </div>
            )}
        </Tag>
    );
}

LoadThenReveal.propTypes = {
    loading: PropTypes.bool,
    skeleton: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    quietMs: PropTypes.number,
    reducedMotion: PropTypes.bool,
    as: PropTypes.elementType,
    className: PropTypes.string,
    style: PropTypes.object,
    onRevealComplete: PropTypes.func,
    children: PropTypes.node,
};
