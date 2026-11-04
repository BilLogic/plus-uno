import React, { useEffect } from 'react';
import { DocsContainer } from '@storybook/addon-docs/blocks';

/**
 * The "On this page" rail's four page-side fixes, applied from the docs container.
 *
 * 1. Heading ids. Tocbot links each entry to `#<heading id>`. Many docs pages
 *    render their section headings through components (FoundationSection and
 *    friends) that put the id on a wrapper, so the heading itself has none and
 *    its entry linked to a bare `#` — a click did nothing. The headings the rail
 *    lists get a slug id here, unique on the page, before Tocbot reads them.
 * 2. Entry titles. Entries are one line with an ellipsis (storybook-overrides.css);
 *    the full heading is the native tooltip.
 * 3. Landing. Tocbot measures the jump once, then animates; canvases and fonts
 *    settling mid-animation leave the heading short of the line (measured: 488px
 *    down instead of 96). After a click settles, the heading is nudged onto the
 *    line on whichever element actually scrolls.
 * 4. End space. The last sections can never reach the top of a page that ends
 *    right after them, so their entries could neither land nor become active.
 *    The page gets just enough room below its last heading for that heading to
 *    sit on the line (`--docs-toc-end-space`, consumed in storybook-overrides.css).
 *
 * Headings match the rail's own selectors, so the set stamped is the set of
 * entries listed: inside the prose, outside story canvases.
 */
// Mirrors `unsafeTocbotOptions.headingsOffset` in preview.jsx: the heading's line.
const LINE = 96;
const HEADINGS = '.sbdocs-content h2, .sbdocs-content h3';
// Tocbot's ignoreSelector: `.docs-story *, .skip-toc` — inside a canvas, or marked itself.
const isSkipped = (h) => h.matches('.skip-toc') || !!h.closest('.docs-story');

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';

/** Gives every listed heading without an id a unique, stable one. */
export function stampHeadingIds(root = document) {
  const taken = new Set([...root.querySelectorAll('[id]')].map((el) => el.id));
  for (const heading of root.querySelectorAll(HEADINGS)) {
    if (heading.id || isSkipped(heading)) continue;
    const base = slug(heading.textContent ?? '');
    let id = base;
    for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
    heading.id = id;
    taken.add(id);
  }
}

/** Sets each rail entry's native tooltip to its full heading text. */
export function titleRailEntries(root = document) {
  for (const link of root.querySelectorAll('.toc-wrapper a.toc-link')) {
    const text = link.textContent ?? '';
    if (link.title !== text) link.title = text;
  }
}

/** The nearest ancestor that scrolls, else the document's scroller. */
export function scrollerOf(el) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return document.scrollingElement ?? document.documentElement;
}

/** Scrolls the heading's scroller until the heading sits on the line. */
export function settleOnLine(heading) {
  const delta = heading.getBoundingClientRect().top - LINE;
  if (Math.abs(delta) <= 2) return;
  const scroller = scrollerOf(heading);
  scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: 'instant' });
}

/** Room below the last heading so it can reach the line; 0 when it already can. */
export function endSpaceFor(lastHeadingTop, contentBottom, viewport) {
  return Math.max(0, Math.round(viewport - LINE - (contentBottom - lastHeadingTop)));
}

function updateEndSpace() {
  const headings = [...document.querySelectorAll(HEADINGS)].filter((h) => !isSkipped(h));
  const last = headings[headings.length - 1];
  const content = document.querySelector('.sbdocs-content');
  if (!last || !content) return;
  const root = document.documentElement;
  // Below 768px Storybook hides the rail, so there is nothing to land on.
  const rail = document.querySelector('.toc-wrapper')?.closest('aside');
  const railShown = !rail || getComputedStyle(rail).display !== 'none';
  const current = parseFloat(root.style.getPropertyValue('--docs-toc-end-space')) || 0;
  const rect = content.getBoundingClientRect();
  // `content` ends where its spacer begins, so the spacer is not counted twice.
  const next = railShown
    ? endSpaceFor(last.getBoundingClientRect().top, rect.bottom - current, window.innerHeight)
    : 0;
  if (next !== current) root.style.setProperty('--docs-toc-end-space', `${next}px`);
}

function TocEnhancer() {
  useEffect(() => {
    const refresh = () => {
      stampHeadingIds();
      titleRailEntries();
      updateEndSpace();
    };
    refresh();
    // Late-rendering MDX and the rail itself (Tocbot builds it ~100ms after mount). A heading that
    // appears after that still links to `#`: the rail reads ids once, when it is built.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    };
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    const sizes = new ResizeObserver(schedule);
    sizes.observe(document.body);

    const timers = [];
    const onClick = (event) => {
      const link = event.target instanceof Element ? event.target.closest('.toc-wrapper a.toc-link') : null;
      const id = link?.getAttribute('href')?.slice(1);
      if (!id) return;
      timers.forEach(clearTimeout);
      // Tocbot's animation is 420ms; settle after it, then once more for late layout.
      for (const ms of [500, 1100]) {
        timers.push(setTimeout(() => {
          let key = id;
          try {
            key = decodeURIComponent(id);
          } catch {
            // a malformed escape: use the raw id
          }
          const heading = document.getElementById(key);
          if (heading) settleOnLine(heading);
        }, ms));
      }
    };
    document.addEventListener('click', onClick);
    // A reader who takes over the scroll is not nudged back.
    const cancel = () => timers.forEach(clearTimeout);
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    return () => {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      mutations.disconnect();
      sizes.disconnect();
      document.removeEventListener('click', onClick);
      document.documentElement.style.removeProperty('--docs-toc-end-space');
    };
  }, []);
  return null;
}

/** Storybook's docs container with the rail enhancer mounted beside the page. */
export function TocDocsContainer({ children, ...props }) {
  return (
    <DocsContainer {...props}>
      <TocEnhancer />
      {children}
    </DocsContainer>
  );
}
