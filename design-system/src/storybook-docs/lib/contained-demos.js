/**
 * A demo shown in the docs stays inside its canvas: an overlay that takes over
 * the page (a modal dialog, a Backdrop, a Flag stack fixed to the screen) or
 * anything fixed to the viewport from inside the canvas covers the docs page
 * itself. Overlays anchored to a trigger (Popup, menus, tooltips) portal to the
 * body by design and are not counted.
 *
 * Returns one line per escape; empty when the demo is contained.
 */
/** Visible and bigger than a visually hidden 1px box (Base UI parks its hidden inputs that way). */
const isShown = (el, win) => {
    const style = win.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const box = el.getBoundingClientRect();
    return box.width > 2 && box.height > 2;
};

const describe = (el) => {
    const name = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || '';
    return `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}${name ? ` "${name}"` : ''}`;
};

const TAKEOVER_SELECTOR = [
    '[aria-modal="true"]',
    '.plus-pattern-backdrop',
    '.plus-flag-container[data-container-position="fixed"]',
].join(', ');

export const findEscapes = (canvasElement, doc = canvasElement.ownerDocument) => {
    const win = doc.defaultView;
    const escapes = [];
    for (const el of doc.querySelectorAll(TAKEOVER_SELECTOR)) {
        if (!canvasElement.contains(el) && isShown(el, win)) escapes.push(`over the page: ${describe(el)}`);
    }
    for (const el of canvasElement.querySelectorAll('*')) {
        if (win.getComputedStyle(el).position === 'fixed' && isShown(el, win)) escapes.push(`fixed to the screen: ${describe(el)}`);
    }
    return escapes;
};

/**
 * Storybook `afterEach`: a story shown in the docs fails when its demo escapes.
 * Storybook resolves a `!dev` tag by removing `dev`, so a test-only story is one
 * whose resolved tags lack `dev`.
 */
export const assertContained = async ({ canvasElement, tags = [] }) => {
    if (!tags.includes('dev') || !canvasElement) return;
    const escapes = findEscapes(canvasElement);
    if (escapes.length) {
        throw new Error(`This docs demo leaves its canvas; render it in place (Modal renderAs="inline", FlagGroup containerPosition="static", or a frame):\n${escapes.join('\n')}`);
    }
};
