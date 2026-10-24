/**
 * The open modal overlays, counted for the whole document.
 *
 * Two rules from the overlay spec hang off this one count:
 *
 * - **Opening a modal closes a floating sidebar.** The app frame
 *   (`SurfaceContainer`) subscribes and closes a peeking sidebar when an overlay
 *   opens. A module-level count rather than a React context, because a modal
 *   does not have to sit under the frame in the tree, and a page should not
 *   have to thread a callback from the frame to each of its modals.
 * - **At most two overlays stack**: a modal and the confirm it raises. A third
 *   is refused: it does not open, and development builds warn. Replacing the
 *   top one instead would close a dialog its owner still thinks is open.
 *
 * Only an overlay counts: an inline modal (a docs preview, `PatternModal`) and
 * a popup are not overlays.
 */

/** A modal raised from a modal is the most that stacks: a nested confirm. */
export const MAX_OVERLAYS = 2;

let count = 0;
const listeners = new Set();

const emit = (type) => {
    const event = { type, count };
    listeners.forEach((listener) => listener(event));
};

/**
 * Opens an overlay if there is room.
 * @returns {{ release: () => void } | null} null when two are already open
 */
export function openOverlay() {
    if (count >= MAX_OVERLAYS) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[Modal] At most ${MAX_OVERLAYS} overlays stack: a modal and the confirm it raises. This one did not open.`);
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

/** How many overlays are open. */
export const openOverlayCount = () => count;

/**
 * A closed overlay could not hand focus back, because its trigger left the
 * page (a button in a floating sidebar the overlay closed). Whoever removed
 * the trigger puts focus somewhere sensible.
 */
export const reportFocusLost = () => emit('focus-lost');

/**
 * @param {(event: { type: 'open' | 'close' | 'focus-lost', count: number }) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeOverlays(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
