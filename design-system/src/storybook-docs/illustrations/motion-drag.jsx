import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@base-ui/react/button';
import { animate } from 'motion';
import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { useReducedMotion } from 'motion/react';

import { Icon, VisuallyHidden } from '@/components';
import { CORNER_TOKEN, PAINT } from './paint.js';
import { Pointer } from './primitives-motion.jsx';
import { springFor } from './motion.jsx';
import { dropInto, dropOnto, locate, orderKey, step } from './drag-model.js';

/**
 * Reorder items, with a hand on them: drag within a list, drag between two
 * lists, or move by keyboard through each item's grab handle. Built on
 * Pragmatic drag and drop for the pointer and Base UI for the handle; every
 * motion reads a spring token, never a time of its own.
 *
 *  - What you carry follows by weight (02-physics § Weight): a chip trails on
 *    `spatial.fast`, a card on `spatial.default`. Neither bounces.
 *  - On drop the item settles on `spatial.fast`, started from the release velocity.
 *  - Neighbors close up on `spatial.default`.
 *  - Reduced motion: no travel; what moved fades in place on `appearance.fast`.
 *
 * Blocked out in kit paint, no words. The order is exposed as `data-order` on
 * each list and the demo's state as `data-phase` on the root, which the stories read.
 */

const LISTS = {
  single: { a: ['a', 'b', 'c'] },
  between: { left: ['a', 'b', 'c'], right: ['x', 'y', 'z'] },
};
const WEIGHT = { chip: 'spatial.fast', card: 'spatial.default' };
const LABEL = (id) => `Item ${id.toUpperCase()}`;

const px = (n) => `${n}px`;
const rectOf = (el) => el.getBoundingClientRect();

const Item = ({ id, kind, held, grabbed, onKeyDown, register }) => {
  const ref = useRef(null);
  const handle = useRef(null);
  useEffect(() => register(id, ref.current, handle.current, kind), [id, kind, register]);
  return (
    <li
      ref={ref}
      data-item={id}
      data-kind={kind}
      data-held={held ? 'true' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--stack-md)',
        height: px(kind === 'chip' ? 24 : 40),
        width: kind === 'chip' ? '60%' : '100%',
        padding: '0 var(--stack-md)',
        borderRadius: CORNER_TOKEN.shape,
        background: grabbed ? PAINT.accent : PAINT.cardSurface,
        border: `var(--border-default) solid ${PAINT.rowDivider}`,
        // The slot stays while the copy travels: a held item reads as an empty place.
        opacity: held ? 0.35 : 1,
        listStyle: 'none',
        boxSizing: 'border-box',
      }}
    >
      <Button
        ref={handle}
        data-grab
        aria-label={`Grab ${LABEL(id)}`}
        aria-pressed={grabbed}
        onKeyDown={(e) => onKeyDown(e, id)}
        style={{ all: 'unset', cursor: 'grab', display: 'inline-flex', color: PAINT.placeholderText, outlineOffset: 2 }}
      >
        <Icon name="grip-vertical" />
      </Button>
      <span aria-hidden style={{ flex: 1, height: 6, borderRadius: CORNER_TOKEN.shape, background: PAINT.placeholderText }} />
    </li>
  );
};

export const DragReorder = ({ between = false, reduced: forcedReduced, fastForward = 1 }) => {
  const prefersReduced = useReducedMotion();
  const reduced = forcedReduced ?? prefersReduced;
  const mode = reduced ? 'reduced' : 'productive';
  const [lists, setLists] = useState(() => LISTS[between ? 'between' : 'single']);
  const [phase, setPhase] = useState('idle');
  const [heldId, setHeldId] = useState(null);
  const [grabbed, setGrabbed] = useState(null);
  const [message, setMessage] = useState('');
  const [float, setFloat] = useState(null);

  const nodes = useRef(new Map());
  const listNodes = useRef(new Map());
  const before = useRef(new Map());
  const origin = useRef(null);
  const latest = useRef(lists);
  latest.current = lists;
  const motions = useRef(new Set());
  const root = useRef(null);
  const pointerTrail = useRef([]);

  // Cards in the single list; chips in the second list of the pair.
  const kindOf = (id, list) => (between && list === 'right' ? 'chip' : between ? 'chip' : 'card');
  const register = useCallback((id, el, handle, kind) => {
    nodes.current.set(id, { el, handle, kind });
    return () => nodes.current.delete(id);
  }, []);

  /** Runs motion controls to the end, then marks the demo settled. */
  const track = useCallback((controls) => {
    motions.current.add(controls);
    controls.speed = fastForward;
    setPhase('settling');
    controls.finished.then(() => {
      motions.current.delete(controls);
      if (motions.current.size === 0) setPhase((p) => (p === 'settling' ? 'settled' : p));
    });
    return controls;
  }, [fastForward]);

  // Neighbors close up: every item that changed place springs from where it was.
  const snapshot = () => {
    before.current = new Map([...nodes.current].map(([id, { el }]) => [id, rectOf(el)]));
  };
  useLayoutEffect(() => {
    const moved = [];
    for (const [id, { el }] of nodes.current) {
      const was = before.current.get(id);
      if (!was || id === heldId) continue;
      const now = rectOf(el);
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (dx || dy) moved.push([el, dx, dy]);
    }
    before.current = new Map();
    for (const [el, dx, dy] of moved) {
      if (reduced) {
        track(animate(0, 1, { ...springFor('appearance.fast', mode), onUpdate: (t) => { el.style.opacity = String(0.4 + 0.6 * t); }, onComplete: () => { el.style.opacity = ''; } }));
      } else {
        track(animate(1, 0, { ...springFor('spatial.default', mode), onUpdate: (t) => { el.style.transform = `translate(${dx * t}px, ${dy * t}px)`; }, onComplete: () => { el.style.transform = ''; } }));
      }
    }
  }, [lists]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next) => {
    if (orderKey(Object.values(next).flat()) === orderKey(Object.values(latest.current).flat()) && JSON.stringify(next) === JSON.stringify(latest.current)) return;
    snapshot();
    setLists(next);
  };

  // ---- Pointer: Pragmatic drag and drop ----
  useEffect(() => {
    const cleanups = [];
    for (const [id, { el, handle }] of nodes.current) {
      cleanups.push(
        combine(
          draggable({
            element: el,
            dragHandle: handle,
            getInitialData: () => ({ id }),
            onGenerateDragPreview: ({ nativeSetDragImage }) => disableNativeDragPreview({ nativeSetDragImage }),
          }),
          dropTargetForElements({ element: el, getData: () => ({ type: 'item', id }) }),
        ),
      );
    }
    for (const [list, el] of listNodes.current) {
      cleanups.push(dropTargetForElements({ element: el, getData: () => ({ type: 'list', list }) }));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [lists]);

  useEffect(() => {
    let fx; let fy; let fxAnim; let fyAnim;
    const follow = (id, x, y) => {
      const { el, kind } = nodes.current.get(id);
      const box = rectOf(el);
      const target = [x - box.width / 2, y - box.height / 2];
      const cfg = { ...springFor(WEIGHT[kind], mode) };
      if (reduced) { fx = target[0]; fy = target[1]; setFloat({ id, x: fx, y: fy, w: box.width, h: box.height }); return; }
      fxAnim?.stop(); fyAnim?.stop();
      const at = (axis) => (axis === 0 ? fx : fy);
      const set = () => setFloat({ id, x: fx, y: fy, w: box.width, h: box.height });
      fxAnim = animate(at(0) ?? target[0], target[0], { ...cfg, onUpdate: (v) => { fx = v; set(); } });
      fyAnim = animate(at(1) ?? target[1], target[1], { ...cfg, onUpdate: (v) => { fy = v; set(); } });
    };
    const targetOf = (location, id, base) => {
      const hit = location.current.dropTargets[0];
      if (!hit) return base;
      if (hit.data.type === 'item') return dropOnto(base, id, hit.data.id);
      return dropInto(base, id, hit.data.list);
    };
    return monitorForElements({
      onDragStart: ({ source, location }) => {
        origin.current = latest.current;
        pointerTrail.current = [];
        setHeldId(source.data.id);
        setPhase('dragging');
        const { clientX, clientY } = location.current.input;
        const { el } = nodes.current.get(source.data.id);
        const box = rectOf(el);
        fx = box.left; fy = box.top;
        follow(source.data.id, clientX, clientY);
      },
      onDrag: ({ source, location }) => {
        const { clientX, clientY } = location.current.input;
        pointerTrail.current.push({ x: clientX, y: clientY, t: performance.now() });
        pointerTrail.current = pointerTrail.current.slice(-6);
        follow(source.data.id, clientX, clientY);
        const next = targetOf(location, source.data.id, origin.current);
        if (JSON.stringify(next) !== JSON.stringify(latest.current)) {
          snapshot();
          setLists(next);
        }
      },
      onDrop: ({ source, location }) => {
        const id = source.data.id;
        const next = targetOf(location, id, origin.current);
        fxAnim?.stop(); fyAnim?.stop();
        if (JSON.stringify(next) !== JSON.stringify(latest.current)) {
          snapshot();
          setLists(next);
        }
        // Release velocity, in px/s, from the last few pointer samples.
        const trail = pointerTrail.current;
        const a = trail[0]; const b = trail[trail.length - 1];
        const dt = a && b && b.t > a.t ? (b.t - a.t) / 1000 : 0;
        const vx = dt ? (b.x - a.x) / dt : 0;
        const vy = dt ? (b.y - a.y) / dt : 0;
        requestAnimationFrame(() => {
          const slot = nodes.current.get(id);
          if (!slot) return;
          const to = rectOf(slot.el);
          const from = { x: fx ?? to.left, y: fy ?? to.top };
          const finish = () => { setFloat(null); setHeldId(null); };
          if (reduced) { finish(); track(animate(0, 1, { ...springFor('appearance.fast', mode), onUpdate: (t) => { slot.el.style.opacity = String(0.4 + 0.6 * t); }, onComplete: () => { slot.el.style.opacity = ''; } })); return; }
          const cfg = springFor('spatial.fast', mode);
          const ax = animate(from.x, to.left, { ...cfg, velocity: vx, onUpdate: (v) => { fx = v; setFloat((f) => f && { ...f, x: v }); } });
          const ay = animate(from.y, to.top, { ...cfg, velocity: vy, onUpdate: (v) => { fy = v; setFloat((f) => f && { ...f, y: v }); } });
          track(ay);
          ax.speed = fastForward;
          Promise.all([ax.finished, ay.finished]).then(finish);
        });
        setPhase('settling');
      },
    });
  }, [mode, reduced, fastForward, track]);

  // ---- Keyboard: grab, move, drop, cancel ----
  const where = (ls, id) => {
    const at = locate(ls, id);
    return `position ${at.index + 1} of ${ls[at.list].length}`;
  };
  const onKeyDown = (e, id) => {
    const key = e.key;
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      if (grabbed === id) {
        setGrabbed(null);
        setMessage(`${LABEL(id)} dropped at ${where(lists, id)}.`);
        setPhase((p) => (p === 'grabbed' ? 'settled' : p));
      } else {
        origin.current = lists;
        setGrabbed(id);
        setPhase('grabbed');
        setMessage(`${LABEL(id)} grabbed at ${where(lists, id)}. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
      }
      return;
    }
    if (grabbed !== id) return;
    if (key === 'Escape') {
      e.preventDefault();
      snapshot();
      setLists(origin.current);
      setGrabbed(null);
      setMessage(`${LABEL(id)} returned to ${where(origin.current, id)}.`);
      return;
    }
    const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: between ? 'left' : null, ArrowRight: between ? 'right' : null }[key];
    if (!direction) return;
    e.preventDefault();
    const next = step(lists, id, direction);
    if (next === lists) return;
    snapshot();
    setLists(next);
    setMessage(`${LABEL(id)} moved to ${where(next, id)}.`);
  };
  // A move that crosses lists remounts the handle: keep it focused while it is held.
  useLayoutEffect(() => {
    if (grabbed) nodes.current.get(grabbed)?.handle?.focus();
  }, [lists, grabbed]);
  // Dropping with the keyboard has no flight to wait for: settled once the neighbors have closed up.
  useEffect(() => {
    if (phase === 'grabbed' || phase === 'dragging') return;
    if (motions.current.size === 0 && phase === 'settling') setPhase('settled');
  }, [phase, lists]);

  const listIds = Object.keys(lists);
  return (
    <div
      ref={root}
      data-reorder-root
      data-phase={phase}
      style={{ display: 'flex', gap: 'var(--space-100)', padding: 'var(--space-100)', background: PAINT.shape, borderRadius: CORNER_TOKEN.shape }}
    >
      {listIds.map((list) => (
        <ul
          key={list}
          ref={(el) => (el ? listNodes.current.set(list, el) : listNodes.current.delete(list))}
          data-reorder-list={list}
          data-order={orderKey(lists[list])}
          aria-label={between ? `${list} list` : 'List'}
          style={{ flex: 1, margin: 0, padding: 'var(--stack-md)', display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', minHeight: 140, border: `var(--border-default) dashed ${PAINT.target}`, borderRadius: CORNER_TOKEN.shape }}
        >
          {lists[list].map((id) => (
            <Item key={id} id={id} kind={kindOf(id, list)} held={heldId === id} grabbed={grabbed === id} onKeyDown={onKeyDown} register={register} />
          ))}
        </ul>
      ))}
      {float && (
        <div
          aria-hidden
          data-float
          style={{
            position: 'fixed', left: 0, top: 0, width: float.w, height: float.h, pointerEvents: 'none', zIndex: 10,
            transform: `translate(${float.x}px, ${float.y}px)`,
            background: PAINT.cardSurface, border: `var(--border-default) solid ${PAINT.accent}`, borderRadius: CORNER_TOKEN.shape,
          }}
        >
          <svg width="20" height="24" viewBox="0 0 20 24" style={{ position: 'absolute', right: -8, bottom: -14 }}>
            <Pointer x={2} y={2} accent />
          </svg>
        </div>
      )}
      <VisuallyHidden>
        <div aria-live="polite" role="status">{message}</div>
      </VisuallyHidden>
    </div>
  );
};
