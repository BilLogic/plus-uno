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
 * What docs prose must be, from the design system's own tokens: `body1-txt`
 * reads `--font-size-body1` (16px) and `--font-family-body`, and
 * `--color-on-surface` is `#191c1e`. They are literals here because this file is
 * asserting the rendered result, and reading the token to compare against the
 * token would assert nothing.
 */
const PROSE_FAMILY = 'Merriweather Sans';
const PROSE_SIZE = '16px';
const PROSE_COLOR = 'rgb(25, 28, 30)';
/**
 * 45–75 characters is the comfortable range; the ticket asks for at most 80.
 * The corpus sample's longest paragraph ran 134 before the cap.
 */
const MAX_MEASURE = 80;

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
    // #252. Docs prose had never rendered in the design system's font: Storybook
    // styles it with `.css-… :where(p:not(…))`, which is a class in front of a
    // zero-specificity `:where()` and so beats an inherited value outright.
    for (const t of p.prose ?? []) {
      const family = t.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (family !== PROSE_FAMILY) {
        failures.push(
          `${where}: prose "${t.label}" renders in ${family}, not ${PROSE_FAMILY}. ` +
            `Storybook's own rule out-ranked the docs prose rule.`,
        );
      }
      if (t.fontSize !== PROSE_SIZE) {
        failures.push(`${where}: prose "${t.label}" is ${t.fontSize}, not ${PROSE_SIZE}.`);
      }
      if (t.color !== PROSE_COLOR) {
        failures.push(
          `${where}: prose "${t.label}" is ${t.color}, not ${PROSE_COLOR} — that is ` +
            `Storybook's own text colour, not the design system's.`,
        );
      }
      if (t.measure > MAX_MEASURE) {
        failures.push(
          `${where}: prose "${t.label}" runs ${t.measure} characters per line, over ${MAX_MEASURE}. ` +
            `The measure cap is not reaching it.`,
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
    // Prose the fix in #252 owns, and only that: elements carrying no class of
    // their own. A paragraph with an authored class — the Tailwind captions on
    // Getting started/Introduction — is that page's decision, not this one's,
    // and asserting over it would turn a typography gate into a content gate.
    // The selector here is deliberately the same population the CSS rule claims.
    const prose = [...document.querySelectorAll('.sbdocs-content p, .sbdocs-content li')]
      .filter((e) => !e.closest('.docs-story'))
      .filter((e) => e.textContent.trim().length > 40)
      .filter((e) => e.className === '')
      .map((e, i) => {
        const c = g(e);
        const lines = Math.max(1, Math.round(e.getBoundingClientRect().height / parseFloat(c.lineHeight)));
        return {
          label: e.tagName.toLowerCase() + ' ' + i + ': ' + e.textContent.trim().slice(0, 32),
          fontFamily: c.fontFamily,
          fontSize: c.fontSize,
          color: c.color,
          measure: Math.round(e.textContent.trim().length / lines),
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
      prose,
      tokens: {
        fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-family-body').trim(),
        color: getComputedStyle(document.body).getPropertyValue('color'),
      },
    };
  })()`;
}
