/**
 * A docs page opens at its top. A demo that is open by default (a Modal, a
 * Popup, a Filter menu, a Focused state) moves focus into itself when it
 * mounts, and the browser scrolls that element into view: the page then opens
 * partway down and the sticky "On this page" nav sits off at the scroll
 * position. So, until the reader first touches the page, every `focus()` call
 * on a docs page is made with `preventScroll: true`, even where the caller asks
 * for `false` (Base UI's focus manager does). That covers our own calls and the
 * ones inside Base UI, whichever component makes them.
 *
 * The stories keep real focus behavior: each call checks that the preview is
 * showing a docs page. The manager swaps stories and docs pages inside one
 * iframe without a reload, so the guard stays installed and `onNavigate` hands
 * back a way to re-arm it when the reader moves to another page. After the
 * first pointer, key, wheel or touch event on a page, that page is the
 * reader's and focus moves the way the browser normally moves it.
 */
const INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

/** True when the preview iframe is showing a docs page. */
export const isDocsView = (win = window) => new URLSearchParams(win.location.search).get('viewMode') === 'docs';

/**
 * Installs the guard on `win`. `subscribe(rearm)` is called once; the caller
 * calls `rearm()` whenever the preview moves to another page. Returns a
 * function that removes the guard.
 */
export const keepDocsAtTop = (win = window, subscribe = () => {}) => {
    const proto = win.HTMLElement.prototype;
    const original = proto.focus;
    let touched = false;

    const guarded = function focus(options) {
        const hold = !touched && isDocsView(win);
        return original.call(this, hold ? { ...options, preventScroll: true } : options);
    };
    proto.focus = guarded;

    const onInput = () => { touched = true; };
    for (const type of INPUT_EVENTS) win.addEventListener(type, onInput, true);
    subscribe(() => { touched = false; });

    return () => {
        if (proto.focus === guarded) proto.focus = original;
        for (const type of INPUT_EVENTS) win.removeEventListener(type, onInput, true);
    };
};
