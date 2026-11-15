/**
 * What a cover hero must be true of, separated from the browser.
 *
 * A hero is drawn on a 5:2 frame and shown on an overview card of another shape.
 * Laid out wider than the card and clipped, the drawing lost its edges (the
 * Typography card's "Aa Aa" was cut on both sides at 1280). The rule is that the
 * box a hero draws into never extends past the box that holds it, so the whole
 * drawing shows. `check:docs-hero-fit` measures that in a browser; this file holds
 * the in-page measurement and the judgment, so `test:scripts` can exercise the
 * judgment without one.
 *
 * The `HeroThumbs` grid is not measured: its hero is meant to cover its tile
 * and slice (see `.sb-docs-thumb__picture` in `docs-rhythm.css`), a crop the
 * source asks for, and the svg box equals the tile's whatever it draws.
 * A hero card or landing frame must instead fit: its svg may not `slice`.
 */

/** Sub-pixel slack. Layout is fractional; 1px of it is not a defect. */
const EPSILON = 1;

/**
 * @typedef {object} HeroBox
 * @property {string} label which hero, for the failure message
 * @property {string} part which drawn box: `frame`, `svg` or `pane`
 * @property {boolean} slice whether the svg crops (`slice`) instead of fitting (`meet`)
 * @property {{left:number,top:number,right:number,bottom:number}} box the drawn box
 * @property {{left:number,top:number,right:number,bottom:number}} holder the box that holds it
 *
 * @typedef {object} PageMeasurement
 * @property {string} page the docs id
 * @property {number} width the viewport it was measured at
 * @property {HeroBox[]} heroes
 */

const pick = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });

/**
 * The in-page script: every hero card and landing frame on the page, with each
 * box its drawing occupies and the box that holds it. A hero card's holder is
 * the card; a landing frame's holder is the frame.
 * Returned as a string so Playwright can run it with `page.evaluate`.
 */
export function measureScript() {
  return `(() => {
    const pick = ${pick.toString()};
    const out = [];
    const add = (label, part, el, holder) => {
      if (!el || !holder) return;
      const slice = (el.getAttribute('preserveAspectRatio') || '').includes('slice');
      out.push({ label, part, slice, box: pick(el.getBoundingClientRect()), holder: pick(holder.getBoundingClientRect()) });
    };
    for (const card of document.querySelectorAll('.sb-docs-hero-card')) {
      const label = 'card:' + (card.dataset.heroCard || '?');
      add(label, 'frame', card.querySelector('.sb-docs-hero'), card);
      for (const svg of card.querySelectorAll('svg')) {
        if (svg.closest('.sb-docs-hero__pane')) continue;
        add(label, 'svg', svg, card);
      }
      for (const pane of card.querySelectorAll('.sb-docs-hero__pane')) add(label, 'pane', pane, card);
    }
    for (const frame of document.querySelectorAll('.sb-docs-hero:not(.sb-docs-hero--framed)')) {
      if (frame.closest('.sb-docs-hero-card')) continue;
      const label = 'page-hero';
      for (const svg of frame.querySelectorAll('svg')) {
        if (!svg.closest('.sb-docs-hero__pane')) add(label, 'svg', svg, frame);
      }
      for (const pane of frame.querySelectorAll('.sb-docs-hero__pane')) add(label, 'pane', pane, frame);
    }
    return out;
  })()`;
}

/** How far a drawn box pokes past its holder, per side, in px (0 when inside). */
export function overhang({ box, holder }) {
  return {
    left: Math.max(0, holder.left - box.left),
    top: Math.max(0, holder.top - box.top),
    right: Math.max(0, box.right - holder.right),
    bottom: Math.max(0, box.bottom - holder.bottom),
  };
}

/** The heroes whose drawn box pokes past its holder by more than a pixel. */
export function overflowing(heroes) {
  return heroes.filter((h) => Object.values(overhang(h)).some((v) => v > EPSILON));
}

/**
 * Everything wrong with the measured pages, as lines for a CI log. Every failure
 * is returned rather than the first, so one run reports the whole picture.
 * @param {PageMeasurement[]} measurements
 */
export function heroFitFailures(measurements) {
  const failures = [];
  for (const { page, width, heroes } of measurements) {
    for (const h of heroes.filter((x) => x.slice)) {
      failures.push(`${page} @${width}: ${h.label} ${h.part} crops (preserveAspectRatio slice) instead of fitting`);
    }
    for (const h of overflowing(heroes)) {
      const o = overhang(h);
      const sides = Object.entries(o)
        .filter(([, v]) => v > EPSILON)
        .map(([k, v]) => `${k} ${Math.round(v)}px`)
        .join(', ');
      failures.push(`${page} @${width}: ${h.label} ${h.part} extends past its holder (${sides})`);
    }
  }
  return failures;
}
