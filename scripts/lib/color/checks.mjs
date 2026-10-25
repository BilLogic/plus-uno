/**
 * The color system's checks (port of the reference generator's `contrast.py`
 * and `parity.py`). Each returns a list of failures; an empty list passes.
 *
 * Alpha tokens are composited onto the ground they sit on before contrast is
 * measured, so a translucent selection is judged as it renders. Increased
 * contrast raises the bar: 7:1 for text, 4.5:1 for icons and borders.
 */

import { contrast, deltaE, hexByte, hexToOklch, linToSrgb, pyRound, srgbToLin } from './oklch.mjs';
import { MODES } from './semantics.mjs';

/** Composite an 8-digit hex over an opaque ground; a 6-digit hex is returned as is. */
export function composite(hex, ground) {
  if (hex.length < 9) return hex.slice(0, 7);
  const a = parseInt(hex.slice(7, 9), 16) / 255;
  const ch = (h, i) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => hexByte(pyRound(ch(hex, i) * a + ch(ground, i) * (1 - a)))).join('')}`;
}

const icBar = (bar) => (bar >= 4.5 ? 7 : 4.5);
const barFor = (mode, bar) => (mode.endsWith('_ic') ? icBar(bar) : bar);

/** Text, icon and border pairs, each on the ground it is drawn on. */
export const PAIRS = [
  ['color.text.subtlest', 'elevation.surface.raised', 4.5], ['color.text.subtle', 'elevation.surface.sunken', 4.5],
  ['color.text', 'elevation.surface.sunken', 4.5], ['color.border.input', 'color.background.input', 3],
  ['color.text', 'elevation.surface', 4.5], ['color.text.subtle', 'elevation.surface', 4.5], ['color.text.subtlest', 'elevation.surface', 4.5],
  ['color.text.subtlest', 'elevation.surface.sunken', 4.5], ['color.text', 'elevation.surface.overlay', 4.5],
  ['color.text.brand', 'elevation.surface', 4.5], ['color.link', 'elevation.surface', 4.5],
  ['color.text.inverse', 'color.background.brand.bold', 4.5], ['color.text.inverse', 'color.background.selected.bold', 4.5],
  ['color.text.inverse', 'color.background.danger.bold', 4.5], ['color.text.inverse', 'color.background.success.bold', 4.5],
  ['color.text.inverse', 'color.background.information.bold', 4.5], ['color.text.inverse', 'color.background.discovery.bold', 4.5],
  ['color.text.inverse', 'color.background.neutral.bold', 4.5], ['color.text.warning.inverse', 'color.background.warning.bold', 4.5],
  ['color.text.selected', 'color.background.selected', 4.5], ['color.text.brand', 'color.background.brand.subtlest', 4.5],
  ['color.text.danger', 'color.background.danger', 4.5], ['color.text.warning', 'color.background.warning', 4.5],
  ['color.text.success', 'color.background.success', 4.5], ['color.text.information', 'color.background.information', 4.5],
  ['color.text.discovery', 'color.background.discovery', 4.5],
  ['color.text.danger.bolder', 'color.background.danger.subtler', 4.5], ['color.text.warning.bolder', 'color.background.warning.subtler', 4.5],
  ['color.text.success.bolder', 'color.background.success.subtler', 4.5], ['color.text.information.bolder', 'color.background.information.subtler', 4.5],
  ['color.text.danger', 'elevation.surface', 4.5], ['color.text.warning', 'elevation.surface', 4.5],
  ['color.text.success', 'elevation.surface', 4.5], ['color.text.information', 'elevation.surface', 4.5],
  ['color.icon', 'elevation.surface', 3], ['color.icon.subtle', 'elevation.surface', 3], ['color.icon.brand', 'elevation.surface', 3],
  ['color.icon.danger', 'elevation.surface', 3], ['color.icon.warning', 'elevation.surface', 3],
  ['color.icon.success', 'elevation.surface', 3], ['color.icon.information', 'elevation.surface', 3], ['color.icon.discovery', 'elevation.surface', 3],
  ['color.border.input', 'elevation.surface', 3], ['color.border.bold', 'elevation.surface', 3], ['color.border.focused', 'elevation.surface', 3],
  ['color.border.danger', 'elevation.surface', 3], ['color.border.warning', 'elevation.surface', 3], ['color.border.success', 'elevation.surface', 3],
  ['color.border.brand', 'elevation.surface', 3], ['color.border.selected', 'elevation.surface', 3],
];

/** Text and edges on the hovered, selected and overlay grounds they actually sit on: [fg, ground stack, bar, IC bar]. */
export const STATE_GROUNDS = [
  ['color.text.subtlest', ['elevation.surface.sunken', 'color.background.neutral.subtle.hovered'], 4.5, 7],
  ['color.text.subtlest', ['elevation.surface', 'color.background.selected'], 4.5, 7],
  ['color.text.subtlest', ['elevation.surface.overlay'], 4.5, 7],
  ['color.text.subtle', ['elevation.surface', 'color.background.selected.pressed'], 4.5, 7],
  ['color.link', ['elevation.surface', 'color.background.selected'], 4.5, 7],
  ['color.link', ['elevation.surface', 'color.background.selected.pressed'], 4.5, 7],
  ['color.border.focused', ['elevation.surface.sunken', 'color.background.selected'], 3, 4.5],
  ['color.border.focused', ['elevation.surface'], 3, 4.5],
  ['color.border.focused', ['elevation.surface.sunken'], 3, 4.5],
  ['color.border.input', ['elevation.surface', 'color.background.neutral.subtle.hovered'], 3, 4.5],
  ['color.border.input', ['elevation.surface.overlay'], 3, 4.5],
];

const ACCENT_FAMILIES = ['blue', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'magenta', 'purple', 'gray', 'brown'];

// Color-vision deficiency simulation, Machado 2009, severity 1.
const PROTAN = [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]];
const DEUTAN = [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]];

function simulate(hex, M) {
  const c = [1, 3, 5].map((i) => srgbToLin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const o = M.map((row) => Math.max(0, Math.min(1, row[0] * c[0] + row[1] * c[1] + row[2] * c[2])));
  return `#${o.map((v) => hexByte(pyRound(Math.max(0, Math.min(1, linToSrgb(v))) * 255))).join('')}`;
}

const fmt = (n) => n.toFixed(2);

/**
 * Run every check over one plan's semantic layer.
 *
 * @param {{rows: object[], palette: object}} semantics
 * @returns {Record<string, string[]>} check name -> failures
 */
export function colorChecks({ rows, palette }) {
  const S = Object.fromEntries(rows.map((r) => [r.name, r]));
  const surface = (m) => S['elevation.surface'][m].slice(0, 7);

  // Contrast of fg on bg, both composited onto the page, rounded as the reference reports it.
  const pairRatio = (fg, bg, m) => {
    const b = composite(S[bg][m], surface(m));
    return pyRound(contrast(composite(S[fg][m], b), b), 2);
  };
  const pairFailures = (fg, bg, bar, label = '') =>
    MODES.filter((m) => pairRatio(fg, bg, m) < barFor(m, bar)).map(
      (m) => `${label}${fg} on ${bg}, ${m}: ${fmt(pairRatio(fg, bg, m))}:1 < ${barFor(m, bar)}:1`,
    );

  const contrastPairs = PAIRS.flatMap(([fg, bg, bar]) => pairFailures(fg, bg, bar));

  const accentPairings = ACCENT_FAMILIES.flatMap((f) => {
    const a = `color.background.accent.${f}`;
    return [
      ['text on subtlest', `color.text.accent.${f}`, `${a}.subtlest`, 4.5],
      ['text on subtler', `color.text.accent.${f}`, `${a}.subtler`, 4.5],
      ['bolder text on subtle', `color.text.accent.${f}.bolder`, `${a}.subtle`, 4.5],
      ['inverse on bolder', 'color.text.inverse', `${a}.bolder`, 4.5],
      ['icon on surface', `color.icon.accent.${f}`, 'elevation.surface', 3],
    ].flatMap(([label, fg, bg, bar]) => pairFailures(fg, bg, bar, `${f} ${label}: `));
  });

  const ground = (m, stack) => {
    let g = stack[0] === 'elevation.surface.sunken' ? S['elevation.surface.sunken'][m].slice(0, 7) : surface(m);
    if (stack[0] !== 'elevation.surface' && stack[0] !== 'elevation.surface.sunken') g = composite(S[stack[0]][m], g);
    for (const t of stack.slice(1)) g = composite(S[t][m], g);
    return g;
  };
  const rowStateGrounds = [];
  for (const [fg, stack, bar, ic] of STATE_GROUNDS) {
    for (const m of MODES) {
      const g = ground(m, stack);
      const v = contrast(composite(S[fg][m], g), g);
      const b = m.endsWith('_ic') ? ic : bar;
      if (v < b) rowStateGrounds.push(`${fg} on ${stack.map((x) => x.split('.').at(-1)).join('+')}, ${m}: ${fmt(v)}:1 < ${b}:1`);
    }
  }

  const collapsedStates = [];
  for (const m of MODES) {
    const sel = S['color.background.selected'][m];
    for (const other of ['color.background.neutral', 'color.background.neutral.subtle.hovered', 'color.skeleton', 'color.background.disabled']) {
      if (sel === S[other][m]) collapsedStates.push(`color.background.selected equals ${other}, ${m}`);
    }
    for (const gname of ['elevation.surface', 'elevation.surface.sunken']) {
      const g = S[gname][m].slice(0, 7);
      const L = (t) => hexToOklch(composite(S[t][m], g))[0];
      const sg = m.startsWith('light') ? 1 : -1; // light: selection darkens; dark: it lightens
      if (!(sg * L('color.background.selected') < sg * L('color.background.neutral.subtle.hovered'))) {
        collapsedStates.push(`selected is not past hover on ${gname}, ${m}`);
      }
      const [a, h, p] = ['', '.hovered', '.pressed'].map((s) => sg * L(`color.background.selected${s}`));
      if (!(a > h && h > p)) collapsedStates.push(`selected ladder is not monotone on ${gname}, ${m}`);
    }
    // base, hovered and pressed are three different values for every state triple
    for (const n of Object.keys(S)) {
      if (n.endsWith('.hovered') || n.endsWith('.pressed') || n === 'color.background.input') continue; // input: Atlassian presses back to rest
      if (`${n}.hovered` in S && `${n}.pressed` in S) {
        if (new Set([S[n][m], S[`${n}.hovered`][m], S[`${n}.pressed`][m]]).size < 3) collapsedStates.push(`state collapse: ${n}, ${m}`);
      }
    }
    const surfaces = new Set(['elevation.surface', 'elevation.surface.sunken', 'elevation.surface.raised', 'elevation.surface.overlay'].map((k) => S[k][m]));
    for (const n of Object.keys(S)) {
      if (n.startsWith('color.background.accent.') && surfaces.has(S[n][m])) collapsedStates.push(`${n} equals a surface, ${m}`);
    }
  }

  // Status tints must read as tints against the frame (OKLab deltaE x100 >= 2.5).
  const tintVsFrame = [];
  for (const role of ['success', 'warning', 'danger', 'information', 'discovery']) {
    for (const m of ['light', 'dark']) {
      for (const gname of ['elevation.surface', 'elevation.surface.sunken']) {
        const d = deltaE(S[`color.background.${role}`][m], S[gname][m]);
        if (d < 2.5) tintVsFrame.push(`color.background.${role} on ${gname}, ${m}: deltaE ${fmt(d)} < 2.5`);
      }
    }
  }

  // Categorical chart series 1-4 stay apart under protan and deutan simulation (deltaE >= 5).
  const chartCvd = [];
  for (const m of ['light', 'dark']) {
    const cols = [1, 2, 3, 4].map((i) => S[`color.chart.categorical.${i}`][m].slice(0, 7));
    for (const [name, M] of [['protan', PROTAN], ['deutan', DEUTAN]]) {
      const sim = cols.map((c) => simulate(c, M));
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          const d = deltaE(sim[i], sim[j]);
          if (d < 5) chartCvd.push(`categorical ${i + 1} and ${j + 1} under ${name}, ${m}: deltaE ${d.toFixed(1)} < 5`);
        }
      }
    }
  }

  // The accent teal must not read as the brand.
  const tealVsLagoon = ['200', '500', '700', '850']
    .map((s) => [s, pyRound(deltaE(palette.teal[s].hex, palette.lagoon[s].hex), 1)])
    .filter(([s, d]) => d < (s === '200' || s === '850' ? 3 : 4))
    .map(([s, d]) => `teal.${s} vs lagoon.${s}: deltaE ${d} < ${s === '200' || s === '850' ? 3 : 4}`);

  return {
    'contrast pairs': contrastPairs,
    'accent pairings': accentPairings,
    'row-state grounds': rowStateGrounds,
    'collapsed states': collapsedStates,
    'tint vs frame': tintVsFrame,
    'chart color vision': chartCvd,
    'teal vs Lagoon': tealVsLagoon,
  };
}

/**
 * Plans may differ in primitive values only: every plan must map every
 * semantic token to the same primitive reference in every mode.
 *
 * @param {Record<string, {rows: object[]}>} byPlan  plan key -> semantics
 * @returns {string[]}
 */
export function planParity(byPlan) {
  const [base, ...others] = Object.keys(byPlan);
  const index = (key) => Object.fromEntries(byPlan[key].rows.map((r) => [r.name, r]));
  const B = index(base);
  const out = [];
  for (const p of others) {
    const P = index(p);
    for (const n of Object.keys(B)) {
      if (!(n in P)) out.push(`${n} is in Plan ${base} and not in Plan ${p}`);
      else for (const m of MODES) {
        if (B[n][`${m}_ref`] !== P[n][`${m}_ref`]) out.push(`${n}, ${m}: Plan ${base} ${B[n][`${m}_ref`]}, Plan ${p} ${P[n][`${m}_ref`]}`);
      }
    }
    for (const n of Object.keys(P)) if (!(n in B)) out.push(`${n} is in Plan ${p} and not in Plan ${base}`);
  }
  return out;
}
