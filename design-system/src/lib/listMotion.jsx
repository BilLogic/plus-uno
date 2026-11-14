import React, { Children, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate } from 'motion/react';
import { measureSpring } from '@/tokens/spring.js';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { useMotionReduced } from './motionPreference';
import '@/styles/_pattern-motion.scss';

/** Stagger rule (Choreography): 20 ms apart, or 500 ms divided by item count when shorter. */
export const STAGGER = { gap: 20, cap: 500 };

/** Gap in ms between consecutive items for a set of `count` items. */
export function staggerGap(count) {
    if (!Number.isFinite(count) || count <= 1) return 0;
    return Math.min(STAGGER.gap, STAGGER.cap / count);
}

/** Start delay in ms for each item in a set of `count` items. */
export function staggerDelays(count, gap = staggerGap(count)) {
    if (!Number.isFinite(count) || count <= 0) return [];
    if (count === 1) return [0];
    return Array.from({ length: count }, (_, index) => index * gap);
}

/** Measure a semantic spring's 90% and settle times in ms from the generated spring table. */
export function measureSpringToken(token, mode = 'productive') {
    const entry = SPRINGS[token]?.[mode] ?? SPRINGS[token]?.productive;
    if (!entry) return { t90Ms: 0, settleMs: 0 };
    const { stiffness, damping, mass = 1 } = entry;
    const ratio = damping / (2 * Math.sqrt(stiffness * mass));
    const measured = measureSpring({ stiffness, ratio, mass });
    return {
        t90Ms: Math.round((measured.t90 ?? 0) * 1000),
        settleMs: Math.round((measured.settle ?? 0) * 1000),
    };
}

const APPEARANCE_FAST = measureSpringToken('appearance.fast');
const SPATIAL_FAST = measureSpringToken('spatial.fast');

/** Time for a leaving item to fade out on `appearance.fast` before neighbors reflow into its space. */
export const EXIT_FADE_MS = APPEARANCE_FAST.settleMs;

/** Time for a seam to open to ~90% on `spatial.fast` before entering content fades in. */
export const ROOM_READY_MS = SPATIAL_FAST.t90Ms;

/**
 * Exit before reflow: the leaving item fades out in place on `appearance.fast` first;
 * only once it is gone does the space collapse on `spatial.fast` (none under reduced motion).
 */
export function planExitBeforeReflow({ reduced = false } = {}) {
    return {
        fadeToken: 'appearance.fast',
        fadeStartsAtMs: 0,
        fadeMs: EXIT_FADE_MS,
        collapseToken: reduced ? null : 'spatial.fast',
        reflowStartsAtMs: EXIT_FADE_MS,
    };
}

/**
 * Room-first enter: height opens on `spatial.fast` from 0 while content waits for room,
 * then fades in on `appearance.fast`. Under reduced motion, height is immediate and content fades at 0.
 */
export function planEnterWithRoom({ reduced = false } = {}) {
    return {
        spatialToken: reduced ? null : 'spatial.fast',
        appearanceToken: 'appearance.fast',
        contentStartsAtMs: reduced ? 0 : ROOM_READY_MS,
    };
}

/**
 * Choreography "Many or one": when about a third or more of a multi-item list changes,
 * swap the whole list in place rather than animating individual additions and removals.
 */
export function shouldSwapWholeList(prevKeys, nextKeys, threshold = 1 / 3) {
    const prev = Array.isArray(prevKeys) ? prevKeys : [];
    const next = Array.isArray(nextKeys) ? nextKeys : [];
    const total = Math.max(prev.length, next.length);
    if (total < 4) return false;
    const prevSet = new Set(prev);
    const nextSet = new Set(next);
    let changed = 0;
    for (const key of prevSet) {
        if (!nextSet.has(key)) changed += 1;
    }
    for (const key of nextSet) {
        if (!prevSet.has(key)) changed += 1;
    }
    return changed / total >= threshold;
}

/**
 * Classify how a keyed list changed between renders:
 * - `'none'` when keys and order match
 * - `'reorder'` when the exact same keys appear in a new order (staggered in destination order)
 * - `'presence'` when items were added and/or removed
 */
export function planListTransition(prevKeys, nextKeys) {
    const prev = Array.isArray(prevKeys) ? prevKeys : [];
    const next = Array.isArray(nextKeys) ? nextKeys : [];
    if (prev.length === next.length && prev.every((key, index) => key === next[index])) {
        return { kind: 'none', movedKeys: [], addedKeys: [], removedKeys: [] };
    }
    const prevSet = new Set(prev);
    const nextSet = new Set(next);
    const addedKeys = next.filter((key) => !prevSet.has(key));
    const removedKeys = prev.filter((key) => !nextSet.has(key));

    if (addedKeys.length === 0 && removedKeys.length === 0 && prev.length === next.length && prevSet.size === nextSet.size) {
        const prevIndex = new Map(prev.map((key, index) => [key, index]));
        const movedKeys = next.filter((key, index) => prevIndex.get(key) !== index);
        const delays = staggerDelays(movedKeys.length);
        const delaysByKey = Object.fromEntries(movedKeys.map((key, index) => [key, delays[index]]));
        return {
            kind: 'reorder',
            movedKeys,
            delaysByKey,
            spatialToken: 'spatial.default',
            reducedToken: 'appearance.fast',
        };
    }

    return {
        kind: 'presence',
        addedKeys,
        removedKeys,
        exitPlan: planExitBeforeReflow(),
        enterPlan: planEnterWithRoom(),
    };
}

const canAnimateDom = (el) => Boolean(
    el
    && typeof window !== 'undefined'
    && typeof el.getBoundingClientRect === 'function'
    && (el.offsetHeight > 0 || el.getClientRects?.().length > 0)
);

/**
 * PresenceSlot: animates a single block's arrival (make room on `spatial.fast`, then fade in
 * on `appearance.fast`) and exit-before-reflow removal (fade out on `appearance.fast` while
 * holding height, then collapse height on `spatial.fast` so siblings below close up cleanly).
 * Renders at rest on initial mount unless `animateOnMount` is set.
 */
export function PresenceSlot({
    show,
    children,
    reducedMotion,
    animateOnMount = false,
    className = '',
    style,
    onExited,
    ...props
}) {
    const osReduced = useMotionReduced();
    const reduced = reducedMotion ?? osReduced;
    const mountedRef = useRef(false);
    const outerRef = useRef(null);
    const innerRef = useRef(null);
    const lastChildrenRef = useRef(children);
    if (show) lastChildrenRef.current = children;

    const [phase, setPhase] = useState(() => {
        if (!show) return 'unmounted';
        return animateOnMount ? 'entering' : 'settled';
    });

    const prevShowRef = useRef(show);
    if (show !== prevShowRef.current) {
        prevShowRef.current = show;
        if (show) {
            setPhase(mountedRef.current || animateOnMount ? 'entering' : 'settled');
        } else if (phase !== 'unmounted') {
            setPhase('exit-fade');
        }
    }

    useEffect(() => {
        mountedRef.current = true;
    }, []);

    useLayoutEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return undefined;

        let cancelled = false;
        const controlsList = [];
        let timer = null;

        const clearStyles = () => {
            outer.style.height = '';
            outer.style.overflow = '';
            inner.style.opacity = '';
        };

        if (phase === 'settled') {
            clearStyles();
            return undefined;
        }

        if (!canAnimateDom(outer)) {
            if (phase === 'entering') setPhase('settled');
            else if (phase === 'exit-fade' || phase === 'exit-reflow') {
                setPhase('unmounted');
                onExited?.();
            }
            return undefined;
        }

        if (phase === 'entering') {
            const enter = planEnterWithRoom({ reduced });
            if (reduced) {
                outer.style.height = '';
                outer.style.overflow = '';
                inner.style.opacity = '0';
                const fade = animate(inner, { opacity: [0, 1] }, SPRINGS[enter.appearanceToken].productive);
                controlsList.push(fade);
                Promise.resolve(fade.finished).then(() => {
                    if (cancelled) return;
                    clearStyles();
                    setPhase('settled');
                });
            } else {
                const targetHeight = inner.offsetHeight;
                outer.style.overflow = 'hidden';
                outer.style.height = '0px';
                inner.style.opacity = '0';
                const room = animate(outer, { height: ['0px', `${targetHeight}px`] }, SPRINGS[enter.spatialToken].productive);
                controlsList.push(room);
                timer = setTimeout(() => {
                    if (cancelled) return;
                    const fade = animate(inner, { opacity: [0, 1] }, SPRINGS[enter.appearanceToken].productive);
                    controlsList.push(fade);
                    Promise.allSettled([room.finished, fade.finished]).then(() => {
                        if (cancelled) return;
                        clearStyles();
                        setPhase('settled');
                    });
                }, enter.contentStartsAtMs);
            }
        } else if (phase === 'exit-fade') {
            const exitPlan = planExitBeforeReflow({ reduced });
            const heldHeight = outer.offsetHeight;
            outer.style.height = `${heldHeight}px`;
            outer.style.overflow = 'hidden';
            const fade = animate(inner, { opacity: [1, 0] }, SPRINGS[exitPlan.fadeToken].productive);
            controlsList.push(fade);
            Promise.resolve(fade.finished).then(() => {
                if (cancelled) return;
                inner.style.opacity = '0';
                if (reduced || !exitPlan.collapseToken) {
                    clearStyles();
                    setPhase('unmounted');
                    onExited?.();
                    return;
                }
                setPhase('exit-reflow');
            });
        } else if (phase === 'exit-reflow') {
            const startHeight = outer.offsetHeight;
            outer.style.overflow = 'hidden';
            inner.style.opacity = '0';
            const collapse = animate(outer, { height: [`${startHeight}px`, '0px'] }, SPRINGS['spatial.fast'].productive);
            controlsList.push(collapse);
            Promise.resolve(collapse.finished).then(() => {
                if (cancelled) return;
                clearStyles();
                setPhase('unmounted');
                onExited?.();
            });
        }

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            controlsList.forEach((ctrl) => ctrl?.stop?.());
        };
    }, [phase, reduced, onExited]);

    if (phase === 'unmounted') return null;

    const exiting = phase === 'exit-fade' || phase === 'exit-reflow';

    return (
        <div
            ref={outerRef}
            data-presence-slot=""
            data-presence-phase={phase}
            data-reduced={reduced ? 'true' : 'false'}
            aria-hidden={exiting ? 'true' : undefined}
            inert={exiting ? true : undefined}
            className={className || undefined}
            style={style}
            {...props}
        >
            <div ref={innerRef} data-presence-inner="">
                {show ? children : lastChildrenRef.current}
            </div>
        </div>
    );
}

PresenceSlot.propTypes = {
    show: PropTypes.bool.isRequired,
    children: PropTypes.node,
    reducedMotion: PropTypes.bool,
    animateOnMount: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    onExited: PropTypes.func,
};

const collectRawChildren = (nodes, out = []) => {
    if (nodes == null || typeof nodes === 'boolean') return out;
    if (Array.isArray(nodes)) {
        for (const item of nodes) collectRawChildren(item, out);
        return out;
    }
    if (isValidElement(nodes) && nodes.type === React.Fragment) {
        collectRawChildren(nodes.props.children, out);
        return out;
    }
    out.push(nodes);
    return out;
};

const normalizeKey = (rawKey) => String(rawKey).replace(/^\.\$/, '');

const hasExplicitKey = (child) => (
    isValidElement(child)
    && child.key != null
    && !/^\.\d+$/.test(String(child.key))
);

const isTrackableRow = (row) => (
    hasExplicitKey(row)
    && (row.type === 'tr' || row.type?.name === 'TableRow' || row.type?.displayName === 'TableRow')
);

const mergeRefs = (ownRef, externalRef) => (node) => {
    ownRef.current = node;
    if (typeof externalRef === 'function') externalRef(node);
    else if (externalRef && typeof externalRef === 'object') externalRef.current = node;
};

const wrapRowCellsForSeam = (rowElement, extraProps) => {
    if (!isValidElement(rowElement)) return rowElement;
    const cells = Children.map(rowElement.props.children, (cell) => {
        if (!isValidElement(cell) || (cell.type !== 'td' && cell.type !== 'th')) return cell;
        return cloneElement(
            cell,
            {},
            <div className="plus-pattern-table-seam" data-table-seam="">{cell.props.children}</div>,
        );
    });
    return cloneElement(rowElement, extraProps, cells);
};

/**
 * TableBodyMotion: coordinates keyed `<tbody>` rows for `PatternTable`:
 * - Add a row: opens cell seams on `spatial.fast` while content fades in on `appearance.fast` once room exists.
 * - Remove a row (exit before reflow): holds the leaving row at its index while fading out on `appearance.fast`,
 *   then collapses its seam height, padding and rule to 0 on `spatial.fast` so rows below close up cleanly.
 * - Reorder rows: glides moved rows from their previous `offsetTop` on `spatial.default`, staggered 20 ms apart
 *   in top-to-bottom destination order (`appearance.fast` fade in place under reduced motion).
 */
export function TableBodyMotion({ tbodyElement, reducedMotion }) {
    const osReduced = useMotionReduced();
    const reduced = reducedMotion ?? osReduced;
    const tbodyRef = useRef(null);
    const prevRowsRef = useRef(null);
    const prevTopsRef = useRef(new Map());
    const activeControlsRef = useRef(new Map());

    const [enteringKeys, setEnteringKeys] = useState(() => new Set());
    const [leavingEntries, setLeavingEntries] = useState([]);
    const pendingReorderRef = useRef(null);

    const rawChildren = collectRawChildren(tbodyElement.props.children);
    const trackable = rawChildren.length > 0 && rawChildren.every(isTrackableRow);
    const currentEntries = trackable
        ? rawChildren.map((element) => ({ key: normalizeKey(element.key), element }))
        : [];
    const currentKeys = currentEntries.map((entry) => entry.key);

    // Detect transitions synchronously on key-list change after initial mount.
    const prevSnapshot = prevRowsRef.current;
    if (trackable && prevSnapshot) {
        const prevKeys = prevSnapshot.map((entry) => entry.key);
        const plan = planListTransition(prevKeys, currentKeys);
        if (plan.kind !== 'none') {
            prevRowsRef.current = currentEntries;
            if (plan.kind === 'reorder') {
                pendingReorderRef.current = plan;
            } else if (plan.kind === 'presence' && !shouldSwapWholeList(prevKeys, currentKeys)) {
                if (plan.addedKeys.length > 0) {
                    setEnteringKeys((prev) => {
                        const next = new Set(prev);
                        plan.addedKeys.forEach((key) => next.add(key));
                        return next;
                    });
                }
                if (plan.removedKeys.length > 0) {
                    const removedSet = new Set(plan.removedKeys);
                    const removedItems = prevSnapshot
                        .map((entry, index) => ({ ...entry, index, phase: 'fade' }))
                        .filter((entry) => removedSet.has(entry.key));
                    if (removedItems.length > 0) {
                        setLeavingEntries((prev) => {
                            const existingKeys = new Set(prev.map((item) => item.key));
                            return [...prev, ...removedItems.filter((item) => !existingKeys.has(item.key))];
                        });
                    }
                }
            }
        } else {
            prevRowsRef.current = currentEntries;
        }
    } else if (trackable && !prevSnapshot) {
        prevRowsRef.current = currentEntries;
    } else if (!trackable) {
        prevRowsRef.current = null;
    }

    // Run reorder FLIP, entering seams, and exit-before-reflow leaving rows.
    useLayoutEffect(() => {
        const tbody = tbodyRef.current;
        if (!tbody || !trackable) return undefined;

        const canAnimate = canAnimateDom(tbody);

        // 1. Reorder FLIP
        if (pendingReorderRef.current) {
            const reorder = pendingReorderRef.current;
            pendingReorderRef.current = null;
            if (canAnimate) {
                for (const key of reorder.movedKeys) {
                    const tr = tbody.querySelector(`[data-row-key="${CSS.escape(key)}"]`);
                    if (!tr) continue;
                    activeControlsRef.current.get(`reorder:${key}`)?.stop?.();
                    const delaySec = (reorder.delaysByKey[key] ?? 0) / 1000;
                    if (reduced) {
                        tr.dataset.rowMotion = 'reorder-reduced';
                        tr.style.transform = '';
                        const ctrl = animate(
                            tr,
                            { opacity: [0, 1] },
                            { ...SPRINGS[reorder.reducedToken].productive, delay: delaySec },
                        );
                        activeControlsRef.current.set(`reorder:${key}`, ctrl);
                        Promise.resolve(ctrl.finished).then(() => {
                            tr.style.opacity = '';
                            delete tr.dataset.rowMotion;
                        });
                    } else {
                        const prevTop = prevTopsRef.current.get(key);
                        const deltaY = prevTop != null ? prevTop - tr.offsetTop : 0;
                        if (Math.abs(deltaY) > 0.5) {
                            tr.dataset.rowMotion = 'reorder';
                            const ctrl = animate(
                                tr,
                                { transform: [`translateY(${deltaY}px)`, 'translateY(0px)'] },
                                { ...SPRINGS[reorder.spatialToken].productive, delay: delaySec },
                            );
                            activeControlsRef.current.set(`reorder:${key}`, ctrl);
                            Promise.resolve(ctrl.finished).then(() => {
                                tr.style.transform = '';
                                delete tr.dataset.rowMotion;
                            });
                        }
                    }
                }
            }
        }

        // 2. Entering rows (make room on spatial.fast, fade content on appearance.fast)
        for (const key of enteringKeys) {
            const controlId = `enter:${key}`;
            if (activeControlsRef.current.has(controlId)) continue;
            const tr = tbody.querySelector(`[data-row-key="${CSS.escape(key)}"]`);
            if (!tr) continue;
            if (!canAnimate) {
                setEnteringKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
                continue;
            }

            const enterPlan = planEnterWithRoom({ reduced });
            const finishEnter = () => {
                activeControlsRef.current.delete(controlId);
                setEnteringKeys((prev) => {
                    if (!prev.has(key)) return prev;
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            };

            if (reduced) {
                tr.dataset.rowMotion = 'enter-reduced';
                const fade = animate(tr, { opacity: [0, 1] }, SPRINGS[enterPlan.appearanceToken].productive);
                activeControlsRef.current.set(controlId, { stop: () => fade.stop() });
                Promise.resolve(fade.finished).then(() => {
                    tr.style.opacity = '';
                    delete tr.dataset.rowMotion;
                    finishEnter();
                });
            } else {
                tr.dataset.rowMotion = 'enter';
                const cells = Array.from(tr.cells ?? tr.querySelectorAll(':scope > td, :scope > th'));
                const seams = cells.map((cell) => cell.querySelector('[data-table-seam], .plus-table-cell-inner')).filter(Boolean);
                const cellMetrics = cells.map((cell) => {
                    const cs = getComputedStyle(cell);
                    return {
                        cell,
                        padTop: cs.paddingTop,
                        padBottom: cs.paddingBottom,
                        borderBottom: cs.borderBottomWidth,
                    };
                });
                const seamHeights = seams.map((seam) => seam.offsetHeight);

                seams.forEach((seam) => {
                    seam.style.overflow = 'hidden';
                    seam.style.opacity = '0';
                });

                const anims = [
                    ...seams.map((seam, i) => animate(
                        seam,
                        { height: ['0px', `${seamHeights[i]}px`] },
                        SPRINGS[enterPlan.spatialToken].productive,
                    )),
                    ...cellMetrics.map(({ cell, padTop, padBottom, borderBottom }) => animate(
                        cell,
                        {
                            paddingTop: ['0px', padTop],
                            paddingBottom: ['0px', padBottom],
                            borderBottomWidth: ['0px', borderBottom],
                        },
                        SPRINGS[enterPlan.spatialToken].productive,
                    )),
                ];
                const timer = setTimeout(() => {
                    const fades = seams.map((seam) => animate(
                        seam,
                        { opacity: [0, 1] },
                        SPRINGS[enterPlan.appearanceToken].productive,
                    ));
                    anims.push(...fades);
                    Promise.allSettled(anims.map((a) => a.finished)).then(() => {
                        seams.forEach((seam) => {
                            seam.style.overflow = '';
                            seam.style.height = '';
                            seam.style.opacity = '';
                        });
                        cells.forEach((cell) => {
                            cell.style.paddingTop = '';
                            cell.style.paddingBottom = '';
                            cell.style.borderBottomWidth = '';
                        });
                        delete tr.dataset.rowMotion;
                        finishEnter();
                    });
                }, enterPlan.contentStartsAtMs);

                activeControlsRef.current.set(controlId, {
                    stop: () => {
                        clearTimeout(timer);
                        anims.forEach((a) => a?.stop?.());
                    },
                });
            }
        }

        // 3. Leaving rows: Phase 1 fade out in place -> Phase 2 collapse height on spatial.fast -> unmount
        for (const leaving of leavingEntries) {
            const controlId = `leave:${leaving.key}`;
            if (activeControlsRef.current.has(controlId)) continue;
            const tr = tbody.querySelector(`[data-leaving-key="${CSS.escape(leaving.key)}"]`);
            if (!tr) continue;

            const removeLeaving = () => {
                activeControlsRef.current.delete(controlId);
                setLeavingEntries((prev) => prev.filter((item) => item.key !== leaving.key));
            };

            if (!canAnimate) {
                removeLeaving();
                continue;
            }

            const exitPlan = planExitBeforeReflow({ reduced });
            tr.dataset.rowMotion = 'exit-fade';
            const fade = animate(tr, { opacity: [1, 0] }, SPRINGS[exitPlan.fadeToken].productive);
            const subControls = [fade];
            activeControlsRef.current.set(controlId, { stop: () => subControls.forEach((c) => c?.stop?.()) });

            Promise.resolve(fade.finished).then(() => {
                if (!tr.isConnected) return;
                tr.style.opacity = '0';
                if (reduced || !exitPlan.collapseToken) {
                    removeLeaving();
                    return;
                }
                tr.dataset.rowMotion = 'exit-reflow';
                const cells = Array.from(tr.cells ?? tr.querySelectorAll(':scope > td, :scope > th'));
                const seams = cells.map((cell) => cell.querySelector('[data-table-seam], .plus-table-cell-inner')).filter(Boolean);
                const cellMetrics = cells.map((cell) => {
                    const cs = getComputedStyle(cell);
                    return {
                        cell,
                        padTop: cs.paddingTop,
                        padBottom: cs.paddingBottom,
                        borderBottom: cs.borderBottomWidth,
                    };
                });
                const seamHeights = seams.map((seam) => seam.offsetHeight);
                seams.forEach((seam) => { seam.style.overflow = 'hidden'; });

                const collapses = [
                    ...seams.map((seam, i) => animate(
                        seam,
                        { height: [`${seamHeights[i]}px`, '0px'] },
                        SPRINGS[exitPlan.collapseToken].productive,
                    )),
                    ...cellMetrics.map(({ cell, padTop, padBottom, borderBottom }) => animate(
                        cell,
                        {
                            paddingTop: [padTop, '0px'],
                            paddingBottom: [padBottom, '0px'],
                            borderBottomWidth: [borderBottom, '0px'],
                        },
                        SPRINGS[exitPlan.collapseToken].productive,
                    )),
                ];
                subControls.push(...collapses);
                Promise.allSettled(collapses.map((c) => c.finished)).then(() => {
                    removeLeaving();
                });
            });
        }

        // Record resting row offsets for the next update's FLIP calculation.
        const nextTops = new Map();
        for (const key of currentKeys) {
            const tr = tbody.querySelector(`[data-row-key="${CSS.escape(key)}"]`);
            if (tr) nextTops.set(key, tr.offsetTop);
        }
        prevTopsRef.current = nextTops;
        return undefined;
    });

    useEffect(() => () => {
        activeControlsRef.current.forEach((ctrl) => ctrl?.stop?.());
        activeControlsRef.current.clear();
    }, []);

    if (!trackable) {
        return tbodyElement;
    }

    // Splice leaving rows at their original indices so rows below stay in place until exit fade completes.
    const merged = currentEntries.map(({ key, element }) => {
        const isEntering = enteringKeys.has(key);
        const baseProps = { 'data-row-key': key };
        return isEntering && !reduced
            ? wrapRowCellsForSeam(element, baseProps)
            : cloneElement(element, baseProps);
    });

    const sortedLeaving = [...leavingEntries].sort((a, b) => a.index - b.index);
    for (const leaving of sortedLeaving) {
        const leavingRow = wrapRowCellsForSeam(leaving.element, {
            key: `__leaving__${leaving.key}`,
            'data-leaving-key': leaving.key,
            'data-leaving-row': 'true',
            'aria-hidden': 'true',
            inert: true,
        });
        const insertAt = Math.min(leaving.index, merged.length);
        merged.splice(insertAt, 0, leavingRow);
    }

    const externalRef = tbodyElement.props?.ref ?? tbodyElement.ref;
    return cloneElement(tbodyElement, { ref: mergeRefs(tbodyRef, externalRef) }, merged);
}

TableBodyMotion.propTypes = {
    tbodyElement: PropTypes.element.isRequired,
    reducedMotion: PropTypes.bool,
};
