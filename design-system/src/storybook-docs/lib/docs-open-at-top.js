/**
 * A docs page opens at its top. A demo that is open by default (a Modal, a
 * Popup, a Filter menu, a Focused state) moves focus into itself when it
 * mounts, and the browser scrolls that element into view: the page then opens
 * partway down and the sticky "On this page" nav sits off at the scroll
 * position. So, until the reader first touches the page, every `focus()` call
 * in a docs page is made with `preventScroll: true`, even where the caller asks
 * for `false` (Base UI's focus manager does). That covers our own calls and the
 * ones inside Base UI, whichever component makes them.
 *
 * The stories keep real focus behavior: this runs for docs pages only. After the first
 * pointer, key, wheel or touch event the page is the reader's and focus moves
 * the way the browser normally moves it.
 */
const INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

/** Installs the guard on `win`; returns a function that removes it. */
export const keepDocsAtTop = (win = window) => {
    const proto = win.HTMLElement.prototype;
    const original = proto.focus;
    const guarded = function focus(options) {
        return original.call(this, { ...options, preventScroll: true });
    };
    proto.focus = guarded;

    const release = () => {
        if (proto.focus === guarded) proto.focus = original;
        for (const type of INPUT_EVENTS) win.removeEventListener(type, release, true);
    };
    for (const type of INPUT_EVENTS) win.addEventListener(type, release, { capture: true, once: true });
    return release;
};

/** True when the preview iframe is showing a docs page. */
export const isDocsView = (win = window) => new URLSearchParams(win.location.search).get('viewMode') === 'docs';
