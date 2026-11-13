import { useRef, useState, useLayoutEffect } from 'react';

/**
 * The shared overlay module (B4): the one place that owns the portal
 * container floating UI mounts into, the document-wide stacked-overlay count,
 * and the two product rules that hang off it.
 *
 * - **Portal container.** `getOverlayPortalRoot()` is the one place every
 *   adapter asks where to mount when it isn't nested inside an open overlay:
 *   `Popup` (`popupMountOf`), `Tooltip`, and the field-anchored popups —
 *   Dropdown, Select, the date pickers, TagInput, TreeSelect, Cascader
 *   (`popupLayerOf`) — all resolve through it instead of each picking
 *   `document.body` on its own. It answers with `document.body` itself, not a
 *   dedicated wrapper: an always-present wrapper would turn `document.body`'s
 *   children from "one per open overlay" into "one, ever," which the
 *   contract-test harness (and anything else that reads body's direct
 *   children to find a portaled node) depends on. `Flag` is the one adapter
 *   with no portal or stack entry: it draws from `--layer-flag`, the
 *   top of the scale in `design-system/src/tokens/ladder/_layers.scss`, so it layers
 *   above a modal wherever its `FlagGroup` is placed.
 * - **A Modal never opens on another Modal.** A confirm Modal may open over a
 *   Panel, a Popup or a focused task, a Modal brings its own Backdrop, a Panel has none; a Modal that
 *   needs a confirm holds it inside itself (a warning SectionMessage and the
 *   danger button). `useOverlaySlot(active, onRefused)` refuses a Modal while
 *   one is open: it does not open, development builds warn, and the caller's
 *   `onRefused` runs so its owner's state says closed. `Modal` is the only
 *   participant: a Panel floats and takes no slot, and Base UI already owns
 *   Escape and focus return for `Popup` and `Tooltip`.
 * - **Opening a Modal closes a floating sidebar.** `Frame` subscribes and
 *   closes a peeking sidebar when the count leaves zero. A module-level count
 *   rather than a React context, because a Modal does not have to sit under the
 *   frame in the tree, and a page should not have to thread a callback from
 *   the frame to it.
 *
 * - **A Modal never dismisses what raised it.** The Panel and the AI popup
 *   stay open under a Modal's Backdrop. The Panel is excluded in `Frame` by
 *   the open count; a popup is a Base UI popover that hears a press in the
 *   Modal as "outside", so it asks `isPressInRaisedOverlay` and keeps
 *   itself open when the press landed in a Modal it sits outside.
 *
 * The `--layer-*` scale itself stays in `ladder/_layers.scss` — this module
 * coordinates who uses the scale, it does not duplicate its values in JS.
 */

let count = 0;
const listeners = new Set();

const emit = (type) => {
    const event = { type, count };
    listeners.forEach((listener) => listener(event));
};

/**
 * Takes the Modal slot if it is free.
 * @returns {{ release: () => void } | null} null when a Modal is already open
 */
export function openOverlay() {
    if (count > 0) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[overlay] A Modal never opens on another Modal: confirm inside the open one with a warning SectionMessage and the danger button. This one did not open.');
        }
        return null;
    }
    count += 1;
    emit('open');
    let released = false;
    return {
        release: () => {
            if (released) return;
            released = true;
            count -= 1;
            emit('close');
        },
    };
}

/** How many Modals are open: zero or one. */
export const openOverlayCount = () => count;

/**
 * A closed overlay could not hand focus back, because its trigger left the
 * page (a button in a floating sidebar the overlay closed). Whoever removed
 * the trigger puts focus somewhere sensible.
 */
export const reportFocusLost = () => emit('focus-lost');

/**
 * Hears overlays open and close, and a closed one that lost its trigger.
 * @param {(event: { type: 'open' | 'close' | 'focus-lost', count: number }) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeOverlays(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * The default mount point every overlay adapter asks for when it isn't
 * nested inside another open overlay: `document.body`, resolved through one
 * function instead of three separate `?? document.body` fallbacks (Popup,
 * Tooltip, the field-anchored popups). `null` without a `document` (SSR, or
 * `overlay.test.js`'s own non-DOM assertions).
 *
 * @returns {HTMLElement | null}
 */
export function getOverlayPortalRoot() {
    return typeof document === 'undefined' ? null : document.body;
}

/**
 * Where a trigger's floating surface mounts: the Backdrop a Modal placed it in, or the shared portal root. The one rule
 * `popupMountOf` (Popup) and `popupLayerOf` (the field-anchored popups) both
 * resolve through, so there is one spelling of it rather than two copies of
 * `.closest('.plus-pattern-backdrop') ?? document.body`.
 *
 * @param {Element | null | undefined} fromNode a node inside the trigger
 * @returns {Element | null} `null` only without a `document` (SSR)
 */
export function overlayMountOf(fromNode) {
    return fromNode?.closest?.('.plus-pattern-backdrop') ?? getOverlayPortalRoot();
}

/**
 * Takes the Modal slot while `active`. Opening tells any `subscribeOverlays` listener (`Frame`
 * closes a floating sidebar); a second Modal gets no slot and stays closed, calling
 * `onRefused` so its owner's state says closed too. The element that had
 * focus when the slot was taken is kept, so a trigger that left the page
 * (the sidebar `Frame` just closed) can be reported through
 * `reportFocusLost` once the overlay has finished closing.
 *
 * A layout effect, so the slot is taken before the first paint and the
 * overlay does not flash closed.
 *
 * @param {boolean} active
 * @param {() => void} [onRefused]
 * @returns {[boolean, React.MutableRefObject<Element | null>]} whether it has a slot, and its trigger
 */
export function useOverlaySlot(active, onRefused) {
    const [placed, setPlaced] = useState(false);
    const trigger = useRef(null);
    const refused = useRef(onRefused);
    refused.current = onRefused;
    useLayoutEffect(() => {
        if (!active) return undefined;
        trigger.current = typeof document === 'undefined' ? null : document.activeElement;
        const handle = openOverlay();
        if (!handle) {
            refused.current?.();
            return undefined;
        }
        setPlaced(true);
        return () => {
            handle.release();
            setPlaced(false);
        };
    }, [active]);
    return [placed, trigger];
}

/**
 * Whether a press landed inside a Modal that the surface owning
 * `ownerNode` sits outside of: the one case where an "outside press" is not a
 * dismissal. The AI popup and the Panel stay open under the Backdrop of a
 * Modal they raised, so a click in that Modal must not close them. A surface
 * that is itself inside the Modal (a popup opened in a dialog) still closes
 * on a press elsewhere in that dialog.
 *
 * @param {EventTarget | null | undefined} target where the press landed
 * @param {Element | null | undefined} ownerNode the trigger or root of the surface asking
 * @returns {boolean}
 */
export function isPressInRaisedOverlay(target, ownerNode) {
    const backdrop = target?.closest?.('.plus-pattern-backdrop');
    if (!backdrop) return false;
    return !backdrop.contains(ownerNode ?? null);
}

/**
 * Whether a Modal is open that the surface owning `ownerNode` sits
 * outside of. While one is, the surface is not dismissed by Escape (which
 * belongs to the Modal) or by focus moving into the Modal.
 *
 * @param {Element | null | undefined} ownerNode the trigger or root of the surface asking
 * @returns {boolean}
 */
export function isOverlayRaisedOver(ownerNode) {
    if (count === 0) return false;
    return !ownerNode?.closest?.('.plus-pattern-backdrop');
}
