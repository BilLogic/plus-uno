import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate } from 'motion';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { useMotionReduced } from './motionPreference';

export const STEPS_ACROSS_MAX = 4;
const CALL_ATTENTION_HOLD_MS = 500;
const DRILL_CONTENT_REVEAL = 0.45;

/**
 * Decide once on task open whether steps sit across the top or down the side.
 * Four or fewer steps sit across the top unless long labels would truncate,
 * which pushes them down the side; adding a step mid-task never flips the axis.
 */
export function resolveStepAxis({ maxSteps = STEPS_ACROSS_MAX, labels = [], maxTopChars = 48 } = {}) {
    const count = Math.max(maxSteps, labels.length);
    if (count > STEPS_ACROSS_MAX) return 'down';
    const totalChars = labels.reduce((sum, label) => sum + String(label).length, 0);
    if (totalChars > maxTopChars || labels.some((label) => String(label).length > 16)) return 'down';
    return 'across';
}

/** Nearest scrollable ancestor (commonly `.plus-frame__surface`), or document scrolling element. */
export function findScrollContainer(element) {
    let node = element?.parentElement ?? null;
    while (node) {
        if (node.classList?.contains('plus-frame__surface')) return node;
        const style = getComputedStyle(node);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
            return node;
        }
        node = node.parentElement;
    }
    return element?.ownerDocument?.scrollingElement ?? null;
}

/** Measure `el` in `host`'s unscaled layout coordinates so scaled stages (FitStage) keep exact geometry. */
export function measureRelativeBox(el, host) {
    if (!el || !host) return null;
    const elRect = el.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const scaleX = host.offsetWidth > 0 ? hostRect.width / host.offsetWidth : 1;
    const scaleY = host.offsetHeight > 0 ? hostRect.height / host.offsetHeight : 1;
    const radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    return {
        x: (elRect.left - hostRect.left) / (scaleX || 1),
        y: (elRect.top - hostRect.top) / (scaleY || 1),
        width: elRect.width / (scaleX || 1),
        height: elRect.height / (scaleY || 1),
        borderRadius: radius,
    };
}

const activeAttention = new WeakMap();
const activeScroll = new WeakMap();

/**
 * Call attention: highlight fades in on `appearance.fast`, holds 500 ms, then
 * fades out on `appearance.slow` and ends unmarked. Plays once.
 */
export function callAttention(targetEl, { holdMs = CALL_ATTENTION_HOLD_MS } = {}) {
    if (!targetEl || typeof targetEl.ownerDocument?.createElement !== 'function') return Promise.resolve();
    activeAttention.get(targetEl)?.cancel();

    const overlay = targetEl.ownerDocument.createElement('span');
    overlay.setAttribute('data-call-attention-overlay', '');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.opacity = '0';
    targetEl.appendChild(overlay);

    let cancelled = false;
    let controls = null;
    let timer = null;
    const cleanup = () => {
        if (overlay.isConnected) overlay.remove();
        delete targetEl.dataset.callAttention;
    };
    const cancel = () => {
        cancelled = true;
        controls?.stop?.();
        if (timer) clearTimeout(timer);
        cleanup();
    };
    activeAttention.set(targetEl, { cancel });

    targetEl.dataset.callAttention = 'in';
    return new Promise((resolve) => {
        controls = animate(overlay, { opacity: [0, 1] }, SPRINGS['appearance.fast'].productive);
        Promise.resolve(controls.finished).then(() => {
            if (cancelled || !targetEl.isConnected) { cleanup(); resolve(); return; }
            timer = setTimeout(() => {
                if (cancelled || !targetEl.isConnected) { cleanup(); resolve(); return; }
                targetEl.dataset.callAttention = 'out';
                controls = animate(overlay, { opacity: [1, 0] }, SPRINGS['appearance.slow'].productive);
                Promise.resolve(controls.finished).then(() => {
                    if (!cancelled) {
                        cleanup();
                        activeAttention.delete(targetEl);
                    }
                    resolve();
                });
            }, holdMs);
        });
    });
}

/**
 * Scroll to a spot on the current page: `spatial.slow` on the scroll container,
 * then Call attention on arrival. Under reduced motion the page does not travel:
 * scroll jumps immediately, the destination fades in on `appearance.fast`, and
 * Call attention still marks the spot.
 */
export function scrollToSpot(scroller, targetEl, { reduced = false, holdMs = CALL_ATTENTION_HOLD_MS } = {}) {
    if (!scroller || !targetEl) return Promise.resolve();
    activeScroll.get(scroller)?.cancel();

    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const scaleY = scroller.offsetHeight > 0 ? scrollerRect.height / scroller.offsetHeight : 1;
    const rawTop = scroller.scrollTop + (targetRect.top - scrollerRect.top) / (scaleY || 1);
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const destination = Math.max(0, Math.min(maxScroll, rawTop));

    if (!targetEl.hasAttribute('tabindex') && !targetEl.matches('a, button, input, select, textarea')) {
        targetEl.setAttribute('tabindex', '-1');
    }
    targetEl.focus({ preventScroll: true });

    if (reduced) {
        delete scroller.dataset.scrollPhase;
        scroller.scrollTop = destination;
        const fade = animate(targetEl, { opacity: [0, 1] }, SPRINGS['appearance.fast'].productive);
        Promise.resolve(fade.finished).then(() => {
            if (targetEl.isConnected) targetEl.style.removeProperty('opacity');
        });
        return callAttention(targetEl, { holdMs });
    }

    let cancelled = false;
    let controls = null;
    const cancel = () => {
        cancelled = true;
        controls?.stop?.();
        delete scroller.dataset.scrollPhase;
    };
    activeScroll.set(scroller, { cancel });
    scroller.dataset.scrollPhase = 'scrolling';

    return new Promise((resolve) => {
        controls = animate(scroller.scrollTop, destination, {
            ...SPRINGS['spatial.slow'].productive,
            onUpdate: (v) => {
                if (!cancelled) scroller.scrollTop = v;
            },
        });
        Promise.resolve(controls.finished).then(() => {
            if (cancelled) { resolve(); return; }
            scroller.scrollTop = destination;
            delete scroller.dataset.scrollPhase;
            activeScroll.delete(scroller);
            callAttention(targetEl, { holdMs }).then(resolve);
        });
    });
}

/**
 * Go to another area: old page fades out on `appearance.fast`, then after the
 * clean-fade gap (old page gone before new arrives, never overlapping and never
 * sliding) the new page fades in, in place, on `appearance.default`
 * (`appearance.fast` in reduced motion).
 */
export function AreaStage({ areaKey, className = '', style, children }) {
    const reduced = useMotionReduced();
    const stageRef = useRef(null);
    const viewRef = useRef(null);
    const latestRef = useRef({ key: areaKey, children });
    latestRef.current = { key: areaKey, children };

    const [shown, setShown] = useState(() => ({ key: areaKey, content: children }));
    const [phase, setPhase] = useState('settled');
    const targetKeyRef = useRef(areaKey);

    // Keep live children reactive when staying in the same area.
    const liveContent = areaKey === shown.key && phase === 'settled' ? children : shown.content;

    if (areaKey !== targetKeyRef.current) {
        targetKeyRef.current = areaKey;
        if (phase !== 'exiting') setPhase('exiting');
    }

    useLayoutEffect(() => {
        const el = viewRef.current;
        if (!el) return undefined;
        let active = true;

        if (phase === 'exiting') {
            const out = animate(el, { opacity: [1, 0] }, SPRINGS['appearance.fast'].productive);
            Promise.resolve(out.finished).then(() => {
                if (!active) return;
                const scroller = findScrollContainer(stageRef.current);
                if (scroller && scroller.classList?.contains('plus-frame__surface')) scroller.scrollTop = 0;
                const latest = latestRef.current;
                setShown({ key: latest.key, content: latest.children });
                setPhase('entering');
            });
            return () => { active = false; out.stop(); };
        }

        if (phase === 'entering') {
            el.style.opacity = '0';
            const enterSpring = reduced ? SPRINGS['appearance.fast'].productive : SPRINGS['appearance.default'].productive;
            const enter = animate(el, { opacity: [0, 1] }, enterSpring);
            Promise.resolve(enter.finished).then(() => {
                if (!active) return;
                el.style.removeProperty('opacity');
                // If another area click arrived while entering, exit to it next.
                if (latestRef.current.key !== shown.key) {
                    setPhase('exiting');
                } else {
                    setPhase('settled');
                }
            });
            return () => { active = false; enter.stop(); };
        }

        return undefined;
    }, [phase, shown.key, reduced]);

    return (
        <div
            ref={stageRef}
            data-area-stage
            data-area-key={shown.key}
            data-area-phase={phase}
            className={className}
            style={style}
        >
            <div ref={viewRef} data-area-view={shown.key}>
                {liveContent}
            </div>
        </div>
    );
}

AreaStage.propTypes = {
    areaKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

/**
 * Stack controller for Drill into and climb back out.
 * Captures the originating row/card/panel box and scroll position synchronously
 * before re-rendering so climbing back restores scroll, focus and Call attention.
 */
export function useDrillStack(initial = { key: 'root' }) {
    const [state, setState] = useState(() => ({
        stack: Array.isArray(initial) ? initial : [initial],
        transition: null,
        seq: 0,
    }));
    const stageRef = useRef(null);

    const drill = useCallback((nextEntry, { fromElement, originId } = {}) => {
        const stageEl = stageRef.current;
        const scroller = findScrollContainer(stageEl);
        const scrollTop = scroller ? scroller.scrollTop : 0;
        const hostEl = scroller?.classList?.contains('plus-frame__surface') ? scroller : stageEl;
        const originBox = fromElement && hostEl ? measureRelativeBox(fromElement, hostEl) : null;

        setState((prev) => {
            const updatedStack = prev.stack.map((item, idx) => (
                idx === prev.stack.length - 1
                    ? { ...item, scrollTop, originId: originId ?? item.originId }
                    : item
            ));
            return {
                stack: [...updatedStack, nextEntry],
                transition: {
                    type: 'drill',
                    delta: 1,
                    originBox,
                    originId,
                    previousEntry: prev.stack[prev.stack.length - 1],
                },
                seq: prev.seq + 1,
            };
        });
    }, []);

    const climbTo = useCallback((targetIndex) => {
        setState((prev) => {
            if (targetIndex < 0 || targetIndex >= prev.stack.length - 1) return prev;
            const delta = prev.stack.length - 1 - targetIndex;
            const targetEntry = prev.stack[targetIndex];
            return {
                stack: prev.stack.slice(0, targetIndex + 1),
                transition: {
                    type: 'climb',
                    delta,
                    returnScrollTop: targetEntry.scrollTop ?? 0,
                    returnOriginId: targetEntry.originId ?? null,
                },
                seq: prev.seq + 1,
            };
        });
    }, []);

    const climb = useCallback(() => {
        setState((prev) => {
            if (prev.stack.length <= 1) return prev;
            const targetIndex = prev.stack.length - 2;
            const targetEntry = prev.stack[targetIndex];
            return {
                stack: prev.stack.slice(0, -1),
                transition: {
                    type: 'climb',
                    delta: 1,
                    returnScrollTop: targetEntry.scrollTop ?? 0,
                    returnOriginId: targetEntry.originId ?? null,
                },
                seq: prev.seq + 1,
            };
        });
    }, []);

    return {
        stack: state.stack,
        current: state.stack[state.stack.length - 1],
        depth: state.stack.length - 1,
        transition: state.transition,
        seq: state.seq,
        stageRef,
        drill,
        climb,
        climbTo,
    };
}

const focusableInRow = (rowEl) => {
    if (!rowEl) return null;
    if (rowEl.matches('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')) return rowEl;
    return rowEl.querySelector('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? rowEl;
};

/**
 * Shared-element container stage for Drill into and climb back out:
 * - Drill grows the tapped row (or promoted Panel) into the record on `spatial.default`,
 *   fades the list in place on `appearance.fast`, and fades the record content in on
 *   `appearance.default` once the container is well on its way.
 * - Climb 1 level restores scroll synchronously, shrinks the container back into the
 *   originating row on `spatial.fast`, returns focus to the row, and briefly lights it.
 * - Climb 2+ levels (or reduced motion) fades in place on `appearance.fast`.
 */
export function DrillStack({ controller, renderView, className = '', style }) {
    const reduced = useMotionReduced();
    const { current, transition, seq, stageRef } = controller;
    const contentRef = useRef(null);
    const shellRef = useRef(null);
    const exitingRef = useRef(null);

    const activeMode = (() => {
        if (!transition) return 'none';
        if (reduced) return 'fade';
        if (transition.type === 'drill') return 'grow';
        if (transition.type === 'climb') return transition.delta === 1 ? 'shrink' : 'fade';
        return 'fade';
    })();

    const [animState, setAnimState] = useState({ seq: 0, phase: 'settled', mode: 'none' });
    if (transition && seq !== animState.seq) {
        const nextPhase = activeMode === 'grow' ? 'drilling' : activeMode === 'shrink' ? 'climbing' : 'fading';
        setAnimState({ seq, phase: nextPhase, mode: activeMode });
    }

    useLayoutEffect(() => {
        if (!transition || animState.phase === 'settled') return undefined;
        const stageEl = stageRef.current;
        const contentEl = contentRef.current;
        if (!stageEl || !contentEl) return undefined;

        const scroller = findScrollContainer(stageEl);
        const hostEl = scroller?.classList?.contains('plus-frame__surface') ? scroller : stageEl;
        let active = true;
        const stops = [];

        const finishTransition = () => {
            if (!active) return;
            contentEl.style.removeProperty('opacity');
            setAnimState((s) => (s.seq === seq ? { ...s, phase: 'settled' } : s));
        };

        if (transition.type === 'drill') {
            if (scroller && scroller.classList?.contains('plus-frame__surface')) {
                scroller.scrollTop = 0;
            }
            if (animState.mode === 'grow' && shellRef.current) {
                const shellEl = shellRef.current;
                const stageBox = measureRelativeBox(stageEl, hostEl) ?? { x: 0, y: 0, width: stageEl.offsetWidth, height: stageEl.offsetHeight, borderRadius: 0 };
                const fromBox = transition.originBox
                    ? {
                        x: transition.originBox.x - stageBox.x,
                        y: transition.originBox.y - stageBox.y,
                        width: transition.originBox.width,
                        height: transition.originBox.height,
                        borderRadius: transition.originBox.borderRadius,
                    }
                    : { x: 0, y: 0, width: stageEl.offsetWidth, height: Math.min(48, stageEl.offsetHeight), borderRadius: 8 };
                const toBox = {
                    x: 0,
                    y: 0,
                    width: Math.max(stageEl.offsetWidth, 1),
                    height: Math.max(stageEl.offsetHeight, 1),
                    borderRadius: 0,
                };

                contentEl.style.opacity = '0';
                let contentStarted = false;
                let contentAnim = null;

                if (exitingRef.current) {
                    const listOut = animate(exitingRef.current, { opacity: [1, 0] }, SPRINGS['appearance.fast'].productive);
                    stops.push(() => listOut.stop());
                }

                const applyBox = (p) => {
                    const lerp = (a, b) => a + (b - a) * p;
                    shellEl.style.transform = `translate(${lerp(fromBox.x, toBox.x)}px, ${lerp(fromBox.y, toBox.y)}px)`;
                    shellEl.style.width = `${Math.max(0, lerp(fromBox.width, toBox.width))}px`;
                    shellEl.style.height = `${Math.max(0, lerp(fromBox.height, toBox.height))}px`;
                    shellEl.style.borderRadius = `${Math.max(0, lerp(fromBox.borderRadius, toBox.borderRadius))}px`;
                };
                applyBox(0);

                const grow = animate(0, 1, {
                    ...SPRINGS['spatial.default'].productive,
                    onUpdate: (p) => {
                        if (!active) return;
                        applyBox(p);
                        if (!contentStarted && p >= DRILL_CONTENT_REVEAL) {
                            contentStarted = true;
                            contentAnim = animate(contentEl, { opacity: [0, 1] }, SPRINGS['appearance.default'].productive);
                            stops.push(() => contentAnim.stop());
                        }
                    },
                });
                stops.push(() => grow.stop());

                Promise.resolve(grow.finished).then(() => {
                    if (!active) return;
                    if (!contentStarted) {
                        contentAnim = animate(contentEl, { opacity: [0, 1] }, SPRINGS['appearance.default'].productive);
                        stops.push(() => contentAnim.stop());
                    }
                    Promise.resolve(contentAnim?.finished).then(finishTransition);
                });
            } else {
                const fade = animate(contentEl, { opacity: [0, 1] }, SPRINGS['appearance.fast'].productive);
                stops.push(() => fade.stop());
                Promise.resolve(fade.finished).then(finishTransition);
            }
        } else if (transition.type === 'climb') {
            // Restore scroll synchronously before paint so the row sits where the user left it.
            if (scroller) scroller.scrollTop = transition.returnScrollTop ?? 0;

            const originRow = transition.returnOriginId
                ? stageEl.querySelector(`[data-drill-row="${CSS.escape(String(transition.returnOriginId))}"]`)
                : null;
            const focusTarget = focusableInRow(originRow);
            if (focusTarget) {
                if (!focusTarget.hasAttribute('tabindex') && !focusTarget.matches('button, a[href], input, select, textarea')) {
                    focusTarget.setAttribute('tabindex', '-1');
                }
                focusTarget.focus({ preventScroll: true });
            }
            if (transition.delta === 1 && originRow) {
                callAttention(originRow);
            }

            if (animState.mode === 'shrink' && shellRef.current && originRow) {
                const shellEl = shellRef.current;
                const rowBox = measureRelativeBox(originRow, stageEl) ?? { x: 0, y: 0, width: stageEl.offsetWidth, height: 40, borderRadius: 8 };
                const startBox = {
                    x: 0,
                    y: 0,
                    width: Math.max(stageEl.offsetWidth, 1),
                    height: Math.max(stageEl.offsetHeight, 1),
                    borderRadius: 0,
                };
                const applyBox = (p) => {
                    const lerp = (a, b) => a + (b - a) * p;
                    shellEl.style.transform = `translate(${lerp(startBox.x, rowBox.x)}px, ${lerp(startBox.y, rowBox.y)}px)`;
                    shellEl.style.width = `${Math.max(0, lerp(startBox.width, rowBox.width))}px`;
                    shellEl.style.height = `${Math.max(0, lerp(startBox.height, rowBox.height))}px`;
                    shellEl.style.borderRadius = `${Math.max(0, lerp(startBox.borderRadius, rowBox.borderRadius))}px`;
                    shellEl.style.opacity = String(Math.max(0, 1 - p * 0.6));
                };
                applyBox(0);

                const listIn = animate(contentEl, { opacity: [0, 1] }, SPRINGS['appearance.fast'].productive);
                const shrink = animate(0, 1, {
                    ...SPRINGS['spatial.fast'].productive,
                    onUpdate: (p) => { if (active) applyBox(p); },
                });
                stops.push(() => listIn.stop(), () => shrink.stop());
                Promise.allSettled([listIn.finished, shrink.finished]).then(finishTransition);
            } else {
                const fade = animate(contentEl, { opacity: [0, 1] }, SPRINGS['appearance.fast'].productive);
                stops.push(() => fade.stop());
                Promise.resolve(fade.finished).then(finishTransition);
            }
        }

        return () => {
            active = false;
            stops.forEach((stop) => stop());
        };
    }, [seq, animState.phase, animState.mode, stageRef, transition]);

    const showDrillShell = animState.phase === 'drilling' && animState.mode === 'grow';
    const showClimbShell = animState.phase === 'climbing' && animState.mode === 'shrink';
    const showExitingList = showDrillShell && Boolean(transition?.previousEntry);

    return (
        <div
            ref={stageRef}
            data-drill-stage
            data-drill-phase={animState.phase}
            data-drill-mode={animState.mode}
            className={className}
            style={style}
        >
            {showExitingList ? (
                <div ref={exitingRef} data-drill-list-exiting inert aria-hidden="true">
                    {renderView(transition.previousEntry, controller)}
                </div>
            ) : null}
            {showDrillShell ? <div ref={shellRef} data-drill-shell="drill" aria-hidden="true" /> : null}
            {showClimbShell ? <div ref={shellRef} data-drill-shell="climb" aria-hidden="true" /> : null}
            <div ref={contentRef} data-drill-content>
                {renderView(current, controller)}
            </div>
        </div>
    );
}

DrillStack.propTypes = {
    controller: PropTypes.object.isRequired,
    renderView: PropTypes.func.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
};

/**
 * Focused task frame transition: opening fades the default Frame (Page + Sidebar)
 * out together on `appearance.fast`, then fades the focused Frame in on
 * `appearance.default`, in place (never growing or sliding). Leaving reverses
 * one speed faster (`appearance.fast`) and returns focus to what opened the task.
 */
export function FocusedFrameSwitch({ focused, defaultFrame, focusedFrame, className = '', style }) {
    const reduced = useMotionReduced();
    const rootRef = useRef(null);
    const layerRef = useRef(null);
    const openerSelectorRef = useRef(null);
    const openerElementRef = useRef(null);
    const wanted = Boolean(focused);

    const [shownFocused, setShownFocused] = useState(wanted);
    const [phase, setPhase] = useState('settled');
    const targetRef = useRef(wanted);

    if (wanted !== targetRef.current) {
        if (wanted && !shownFocused && typeof document !== 'undefined') {
            const active = document.activeElement;
            openerElementRef.current = active;
            openerSelectorRef.current = active?.getAttribute('aria-label')
                ? `[aria-label="${CSS.escape(active.getAttribute('aria-label'))}"]`
                : active?.textContent?.trim() || null;
        }
        targetRef.current = wanted;
        if (phase !== 'exiting') setPhase('exiting');
    }

    useLayoutEffect(() => {
        const el = layerRef.current;
        if (!el) return undefined;
        let active = true;

        if (phase === 'exiting') {
            const out = animate(el, { opacity: [1, 0] }, SPRINGS['appearance.fast'].productive);
            Promise.resolve(out.finished).then(() => {
                if (!active) return;
                setShownFocused(targetRef.current);
                setPhase('entering');
            });
            return () => { active = false; out.stop(); };
        }

        if (phase === 'entering') {
            el.style.opacity = '0';
            // Opening uses appearance.default; closing reverses one speed faster on appearance.fast.
            const spring = shownFocused && !reduced
                ? SPRINGS['appearance.default'].productive
                : SPRINGS['appearance.fast'].productive;
            const enter = animate(el, { opacity: [0, 1] }, spring);

            if (!shownFocused && rootRef.current) {
                const candidate = (openerElementRef.current?.isConnected && openerElementRef.current)
                    || (openerSelectorRef.current && Array.from(rootRef.current.querySelectorAll('button, a[href]'))
                        .find((btn) => btn.textContent?.trim() === openerSelectorRef.current));
                candidate?.focus({ preventScroll: true });
            }

            Promise.resolve(enter.finished).then(() => {
                if (!active) return;
                el.style.removeProperty('opacity');
                if (targetRef.current !== shownFocused) {
                    setPhase('exiting');
                } else {
                    setPhase('settled');
                }
            });
            return () => { active = false; enter.stop(); };
        }

        return undefined;
    }, [phase, shownFocused, reduced]);

    return (
        <div
            ref={rootRef}
            data-focused-switch
            data-focused={String(shownFocused)}
            data-focused-phase={phase}
            className={className}
            style={style}
        >
            <div ref={layerRef} data-focused-layer>
                {shownFocused ? focusedFrame : defaultFrame}
            </div>
        </div>
    );
}

FocusedFrameSwitch.propTypes = {
    focused: PropTypes.bool,
    defaultFrame: PropTypes.node.isRequired,
    focusedFrame: PropTypes.node.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
};

/**
 * Switch views: peer tab bodies move sideways together as one flat sheet with no
 * fade (`spatial.slow` for a page, `spatial.default` for a panel). Under reduced
 * motion the slide becomes an `appearance.fast` fade.
 */
export function SlideViews({ activeKey, keys = [], size = 'page', className = '', style, children }) {
    const reduced = useMotionReduced();
    const currentRef = useRef(null);
    const prevRef = useRef(null);

    const [state, setState] = useState(() => ({
        key: activeKey,
        current: children,
        previous: null,
        direction: 1,
        phase: 'settled',
        seq: 0,
    }));

    if (activeKey !== state.key) {
        const oldIdx = keys.indexOf(state.key);
        const newIdx = keys.indexOf(activeKey);
        const direction = oldIdx !== -1 && newIdx !== -1 && newIdx < oldIdx ? -1 : 1;
        setState({
            key: activeKey,
            current: children,
            previous: reduced ? null : state.current,
            direction,
            phase: reduced ? 'fading' : 'sliding',
            seq: state.seq + 1,
        });
    }

    const liveCurrent = activeKey === state.key && state.phase === 'settled' ? children : state.current;

    useLayoutEffect(() => {
        if (state.phase === 'settled') return undefined;
        const currEl = currentRef.current;
        if (!currEl) return undefined;
        let active = true;
        const stops = [];

        const settle = () => {
            if (!active) return;
            currEl.style.removeProperty('transform');
            currEl.style.removeProperty('opacity');
            setState((s) => (s.seq === state.seq ? { ...s, previous: null, phase: 'settled' } : s));
        };

        if (state.phase === 'fading') {
            const fade = animate(currEl, { opacity: [0, 1] }, SPRINGS['appearance.fast'].productive);
            stops.push(() => fade.stop());
            Promise.resolve(fade.finished).then(settle);
        } else if (state.phase === 'sliding') {
            const spring = SPRINGS[size === 'panel' ? 'spatial.default' : 'spatial.slow'].productive;
            const dir = state.direction;
            currEl.style.opacity = '1';
            const inAnim = animate(currEl, { transform: [`translateX(${dir * 100}%)`, 'translateX(0%)'] }, spring);
            stops.push(() => inAnim.stop());

            let outFinished = Promise.resolve();
            if (prevRef.current) {
                prevRef.current.style.opacity = '1';
                const outAnim = animate(prevRef.current, { transform: ['translateX(0%)', `translateX(${-dir * 100}%)`] }, spring);
                stops.push(() => outAnim.stop());
                outFinished = Promise.resolve(outAnim.finished);
            }
            Promise.allSettled([inAnim.finished, outFinished]).then(settle);
        }

        return () => {
            active = false;
            stops.forEach((stop) => stop());
        };
    }, [state.seq, state.phase, state.direction, size]);

    return (
        <div data-slide-views data-view-phase={state.phase} className={className} style={style}>
            {state.previous ? (
                <div ref={prevRef} data-view-role="previous" inert aria-hidden="true">
                    {state.previous}
                </div>
            ) : null}
            <div ref={currentRef} data-view-role="current" data-view-key={state.key}>
                {liveCurrent}
            </div>
        </div>
    );
}

SlideViews.propTypes = {
    activeKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    keys: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    size: PropTypes.oneOf(['page', 'panel']),
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

/**
 * Step to the next or previous: slides the step body along the same axis as the
 * step tracker (sideways across the top, vertically down a left rail) with no
 * fade on `spatial.default`. Placement is locked once when the task opens.
 * Under reduced motion, swaps via an `appearance.fast` fade.
 */
export function StepStage({ step, axis, maxSteps, labels = [], className = '', style, children }) {
    const reduced = useMotionReduced();
    const [lockedPlacement] = useState(() => axis ?? resolveStepAxis({ maxSteps, labels }));
    const currentRef = useRef(null);
    const prevRef = useRef(null);

    const [state, setState] = useState(() => ({
        step,
        current: children,
        previous: null,
        direction: 1,
        phase: 'settled',
        seq: 0,
    }));

    if (step !== state.step) {
        const direction = step > state.step ? 1 : -1;
        setState({
            step,
            current: children,
            previous: reduced ? null : state.current,
            direction,
            phase: reduced ? 'fading' : 'sliding',
            seq: state.seq + 1,
        });
    }

    const liveCurrent = step === state.step && state.phase === 'settled' ? children : state.current;

    useLayoutEffect(() => {
        if (state.phase === 'settled') return undefined;
        const currEl = currentRef.current;
        if (!currEl) return undefined;
        let active = true;
        const stops = [];

        const settle = () => {
            if (!active) return;
            currEl.style.removeProperty('transform');
            currEl.style.removeProperty('opacity');
            setState((s) => (s.seq === state.seq ? { ...s, previous: null, phase: 'settled' } : s));
        };

        if (state.phase === 'fading') {
            const fade = animate(currEl, { opacity: [0, 1] }, SPRINGS['appearance.fast'].productive);
            stops.push(() => fade.stop());
            Promise.resolve(fade.finished).then(settle);
        } else if (state.phase === 'sliding') {
            const spring = SPRINGS['spatial.default'].productive;
            const dir = state.direction;
            const fn = lockedPlacement === 'down' ? 'translateY' : 'translateX';
            currEl.style.opacity = '1';
            const inAnim = animate(currEl, { transform: [`${fn}(${dir * 100}%)`, `${fn}(0%)`] }, spring);
            stops.push(() => inAnim.stop());

            let outFinished = Promise.resolve();
            if (prevRef.current) {
                prevRef.current.style.opacity = '1';
                const outAnim = animate(prevRef.current, { transform: [`${fn}(0%)`, `${fn}(${-dir * 100}%)`] }, spring);
                stops.push(() => outAnim.stop());
                outFinished = Promise.resolve(outAnim.finished);
            }
            Promise.allSettled([inAnim.finished, outFinished]).then(settle);
        }

        return () => {
            active = false;
            stops.forEach((stop) => stop());
        };
    }, [state.seq, state.phase, state.direction, lockedPlacement]);

    return (
        <div
            data-step-stage
            data-step-placement={lockedPlacement}
            data-step-phase={state.phase}
            data-step-direction={state.phase !== 'settled' ? String(state.direction) : undefined}
            className={className}
            style={style}
        >
            {state.previous ? (
                <div ref={prevRef} data-step-role="previous" inert aria-hidden="true">
                    {state.previous}
                </div>
            ) : null}
            <div ref={currentRef} data-step-role="current" data-step-index={state.step}>
                {liveCurrent}
            </div>
        </div>
    );
}

StepStage.propTypes = {
    step: PropTypes.number.isRequired,
    axis: PropTypes.oneOf(['across', 'down']),
    maxSteps: PropTypes.number,
    labels: PropTypes.arrayOf(PropTypes.node),
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};
