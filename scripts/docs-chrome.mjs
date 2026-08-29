/**
 * What a docs page's chrome must be true of, separated from the browser.
 *
 * #263 recorded four defects in the docs chrome and one thing connecting them:
 * none of them could fail a check, because there is no check. `check:storybook`'s
 * 1136 tests are story tests, and a docs page is not a story — so the props table
 * spilling under the sidebar, and a canvas card left hanging open onto
 * whitespace, were both found by looking at the rendered page.
 *
 * These three assertions are the narrow version the ticket asked for. They are
 * kept apart from the Playwright driver so they can be exercised by
 * `test:scripts` without a browser: the measurement is the hard part to fake,
 * the judgement is the part worth testing.
 */

/** Sub-pixel slack. Layout widths are fractional; 1px of it is not a defect. */
const EPSILON = 1;

/**
 * @typedef {object} Canvas
 * @property {string} label which section it is, for the failure message
 * @property {boolean} hasActions whether a source/actions panel attaches beneath
 * @property {number} borderBottomWidth computed, in px
 *
 * @typedef {object} Table
 * @property {string} label
 * @property {number} intrinsic the table's own scrollWidth
 * @property {number} wrapperClient its wrapper's clientWidth
 * @property {string} wrapperOverflowX the wrapper's computed overflow-x
 *
 * @typedef {object} PageMeasurement
 * @property {string} page the docs id
 * @property {number} width the viewport it was measured at
 * @property {number} bodyScroll documentElement.scrollWidth
 * @property {number} bodyClient documentElement.clientWidth
 * @property {Canvas[]} canvases
 * @property {Table[]} tables
 */

/**
 * Everything wrong with the measured pages, as lines for a CI log.
 *
 * Returns every failure rather than the first: one run should report the whole
 * picture, which is the same reason `check:harness` does not stop at the first
 * failing sub-check.
 *
 * @param {PageMeasurement[]} pages
 * @returns {string[]}
 */
export function chromeFailures(pages) {
  const failures = [];

  for (const p of pages) {
    const where = `${p.page} @ ${p.width}px`;

    // D1's symptom, and the one the ticket names first: whatever a docs page
    // contains, the page itself must not scroll sideways.
    if (p.bodyScroll > p.bodyClient + EPSILON) {
      failures.push(
        `${where}: the docs body scrolls horizontally — scrollWidth ${p.bodyScroll} ` +
          `vs clientWidth ${p.bodyClient}. Something inside is wider than its column and ` +
          `is not scrolling on its own.`,
      );
    }

    // D2. The open bottom edge is deliberate — the code strip attaches there and
    // completes the card. With no strip it is a card opening onto nothing.
    for (const c of p.canvases) {
      if (!c.hasActions && c.borderBottomWidth <= 0) {
        failures.push(
          `${where}: canvas "${c.label}" has an open bottom edge (border-bottom-width ` +
            `${c.borderBottomWidth}px) and no source panel beneath it. The open edge is for ` +
            `a panel to attach to; with nothing there the card hangs open onto whitespace.`,
        );
      }
    }

    // D1's cause. A table wider than its wrapper is fine — that is what a props
    // table is. A wrapper that does not scroll is not.
    for (const t of p.tables) {
      const overflows = t.intrinsic > t.wrapperClient + EPSILON;
      const scrolls = t.wrapperOverflowX === 'auto' || t.wrapperOverflowX === 'scroll';
      if (overflows && !scrolls) {
        failures.push(
          `${where}: table "${t.label}" is ${t.intrinsic}px inside a ${t.wrapperClient}px ` +
            `wrapper whose overflow-x is "${t.wrapperOverflowX}", so it spills rather than ` +
            `scrolling.`,
        );
      }
    }
  }

  return failures;
}

/**
 * The measurement, as a string to evaluate inside the docs document.
 *
 * It lives here rather than in the driver so the shape it produces and the
 * assertions that read it sit in one file and cannot drift apart.
 *
 * @param {string} page the docs id, echoed back into the result
 * @returns {string}
 */
export function measureScript(page) {
  return `(() => {
    const g = (e) => getComputedStyle(e);
    const label = (el, fallback) => {
      let p = el.closest('.sb-docs-demo') || el;
      let h = p.previousElementSibling;
      while (h && !/^H[1-6]$/.test(h.tagName)) h = h.previousElementSibling;
      return h ? h.textContent.trim().slice(0, 40) : fallback;
    };
    const canvases = [...document.querySelectorAll('.sb-ds-docs-canvas-attached-root')].map((root, i) => {
      const card = root.querySelector('.docs-story > *');
      return {
        label: label(root, 'canvas ' + i),
        hasActions: !!root.querySelector('.sbdocs-preview-actions'),
        borderBottomWidth: card ? parseFloat(g(card).borderBottomWidth) : 0,
      };
    });
    const tables = [...document.querySelectorAll('.docblock-argstable')].map((t, i) => {
      const w = t.parentElement;
      return {
        label: label(t, 'argstable ' + i),
        intrinsic: t.scrollWidth,
        wrapperClient: w.clientWidth,
        wrapperOverflowX: g(w).overflowX,
      };
    });
    return {
      page: ${JSON.stringify(page)},
      bodyScroll: document.documentElement.scrollWidth,
      bodyClient: document.documentElement.clientWidth,
      canvases,
      tables,
    };
  })()`;
}
