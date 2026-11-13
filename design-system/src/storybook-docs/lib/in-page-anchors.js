/**
 * In-page links on docs pages (`<a href="#section">`): a page's Contents list
 * and the hand-written `](#…)` links in MDX. Inside the Storybook manager the
 * docs render in an iframe, and a plain hash link there navigates the whole tab
 * away instead of scrolling. This scrolls to the target itself and records the
 * hash with `replaceState`, so the link works in the manager and in the bare
 * iframe alike. A link whose target is not on the page is left alone.
 */
export function handleInPageLink(event, doc = document, win = window) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return false;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const target = id && doc.getElementById(id);
    if (!target) return false;
    event.preventDefault();
    // An instant jump: a smooth scroll is cancelled inside the Storybook iframe, and docs motion is springs, not CSS smooth scrolling.
    target.scrollIntoView({ block: 'start' });
    win.history.replaceState(win.history.state, '', `#${id}`);
    return true;
}

/** Install the handler once per preview document. */
export function mountInPageAnchors(doc = typeof document === 'undefined' ? null : document) {
    if (!doc || doc.__plusInPageAnchors) return;
    doc.__plusInPageAnchors = true;
    doc.addEventListener('click', (event) => handleInPageLink(event, doc, doc.defaultView));
}
