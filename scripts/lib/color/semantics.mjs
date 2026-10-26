/**
 * The semantic layer: Atlassian's semantic tokens (@atlaskit/tokens 20.7.0)
 * remapped onto the PLUS primitives, in four modes (light, dark, light
 * increased contrast, dark increased contrast). Port of the reference
 * generator's `semantics.py`.
 *
 * Every value is a reference to a named primitive (`family.step`), so Figma
 * can alias it, and the build fails otherwise. Primitive names: `lagoon` is
 * the brand ramp and `teal` the accent teal; `neutralAlpha.{slot}` and
 * `darkNeutralAlpha.{slot}` are the ink and paper alphas (slots, percents set
 * per plan); `{hue}.{step}a{percent}` is a hue at an opacity, registered on
 * the palette the first time a token asks for it.
 *
 * The passes run in the reference's order, and the order matters: an
 * override may be overwritten by a later decision, and the de-collapse passes
 * read what the earlier ones left.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from '../corpus.mjs';

import { hexToOklch } from './oklch.mjs';
import { withAlpha } from './plans.mjs';
import { STEPS } from './ramps.mjs';

export const MODES = ['light', 'dark', 'light_ic', 'dark_ic'];

/** SMART subject → the accent hue it aliases. */
export const SMART = { 'mastering-content': 'teal', relationship: 'magenta', 'social-emotional': 'orange', advocacy: 'lime', 'technology-tools': 'brown' };

/** The vendored Atlassian reference tokens, in their published order. */
export function loadAtlassian({ root = REPO_ROOT } = {}) {
  return JSON.parse(readFileSync(join(root, 'scripts/lib/color/atlassian-tokens.json'), 'utf8')).tokens;
}

// Rovo is Atlassian's AI layer: out of scope until the AI hue is decided.
const SKIP = ['color.rovo', 'elevation.rovo', 'elevation.shadow'];
const HUES = ['blue', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'magenta', 'purple', 'gray', 'brown'];
const DIRECT = {
  Blue: 'blue', Teal: 'teal', Green: 'green', Lime: 'lime', Yellow: 'yellow', Orange: 'orange',
  Red: 'red', Magenta: 'magenta', Purple: 'purple', Brown: 'brown',
};
const ROLE_FAM = { brand: 'lagoon', danger: 'red', warning: 'yellow', success: 'green', discovery: 'purple', information: 'blue' };
// Atlassian's alpha steps, as opacity percent.
const ATL_NA = { 100: 3, 200: 6, 300: 14, 400: 31, 500: 49 };
const ATL_DA = { 100: 4, 200: 8, 250: 10, 300: 16, 400: 28, 500: 50 };
// Alpha slots by percent. Slot 300, the line, is plan-set and reached only through LINE.
const NA_SLOT = { 3: 100, 6: 200, 8: 250, 10: 400, 12: 500, 14: 600, 16: 700, 24: 750, 31: 800, 32: 850, 49: 900 };
const DA_SLOT = { 4: 100, 8: 200, 10: 400, 12: 500, 14: 600, 16: 700, 24: 750, 28: 800, 32: 850, 50: 900 };
const TRANSPARENT = ['transparent', '#00000000'];
const HEX6 = /^#[0-9a-fA-F]{6}$/;
const HUE_ALT = HUES.join('|');
const isDigits = (k) => /^\d+$/.test(k);

/** Accents, chart hues, categorical charts and code syntax keep their hue; semantic roles remap. */
const isDirect = (token) =>
  token.includes('.accent.') || token.includes('.code') || token.startsWith('color.chart.categorical') ||
  new RegExp(`^color\\.chart\\.(${HUE_ALT})\\.`).test(token);

function tokenFamily(token) {
  const m = token.match(new RegExp(`\\.(?:accent|chart)\\.(${HUE_ALT})\\b`));
  return !m || m[1] === 'gray' ? null : m[1];
}

function familyFor(token, atlFamily) {
  if (atlFamily === 'Blue') return token.includes('.information') ? 'blue' : 'lagoon';
  const f = { Red: 'red', Orange: 'yellow', Lime: 'green', Purple: 'purple', Green: 'green', Yellow: 'yellow', Teal: 'teal', Magenta: 'magenta' }[atlFamily];
  if (!f) throw new Error(`${token}: no PLUS family for Atlassian's ${atlFamily}`);
  return f;
}

const shortUse = (desc) => {
  const d = desc.replace(/^Use (for|as) /, '').replace(/\.+$/, '').replaceAll('colour', 'color').replaceAll('Colour', 'Color');
  return d ? d[0].toUpperCase() + d.slice(1) : d;
};

const mk = (name, l, d, li, di, use, deviation, atl = ['—', '—']) => {
  li = li || l;
  di = di || d;
  return {
    name, light_ref: l[0], light: l[1], dark_ref: d[0], dark: d[1], light_ic_ref: li[0], light_ic: li[1],
    dark_ic_ref: di[0], dark_ic: di[1], atl_light: atl[0], atl_dark: atl[1], use, deviation,
  };
};

const famStep = (ref) => {
  const m = ref.match(/^([a-zA-Z]+)\.([0-9]+)$/);
  return m ? [m[1], Number(m[2])] : [null, null];
};

/**
 * Build the semantic layer over one plan's palette.
 *
 * @param {object} basePalette  from `buildPalette`; copied, never mutated
 * @param {object[]} [atlassian]
 * @returns {{rows: object[], accent_pattern: object, shadows: object[], opacity: object[], palette: object}}
 *          `palette` is the input plus the hue-alpha primitives the tokens registered.
 */
export function buildSemantics(basePalette, atlassian = loadAtlassian()) {
  const pal = structuredClone(basePalette);

  const stepOf = (key, step) => {
    if (step in pal[key]) return step;
    let best = null;
    for (const k of Object.keys(pal[key])) {
      if (isDigits(k) && (best === null || Math.abs(Number(k) - Number(step)) < Math.abs(Number(best) - Number(step)))) best = k;
    }
    return best;
  };
  const nearestByL = (fam, hex) => {
    const L = hexToOklch(hex.slice(0, 7))[0];
    let best = null;
    for (const k of Object.keys(pal[fam])) {
      if (isDigits(k) && (best === null || Math.abs(pal[fam][k].L - L) < Math.abs(pal[fam][best].L - L))) best = k;
    }
    return best;
  };
  /** Register a hue-at-opacity primitive, e.g. red.200a40, and return its ref. */
  const hueAlpha = (f, step, pct) => {
    const key = `${step}a${pct}`;
    if (!(key in pal[f])) {
      const base = pal[f][step].hex;
      pal[f][key] = { base, a: Number(pct) / 100, hex: withAlpha(base, Number(pct) / 100) };
    }
    return [`${f}.${key}`, pal[f][key].hex];
  };
  const ref = (group, step) => [`${group}.${step}`, pal[group][String(step)].hex];
  const N = (s) => ref('neutral', s);
  const D = (s) => ref('darkNeutral', s);
  const NA = (pct) => ref('neutralAlpha', NA_SLOT[pct]);
  const DA = (pct) => ref('darkNeutralAlpha', DA_SLOT[pct]);
  const LINE = () => ref('neutralAlpha', 300);
  const DLINE = () => ref('darkNeutralAlpha', 300);
  const H = (f, s) => ref(f, s);

  function resolve(token, reference) {
    const name = reference.split(/\s+/)[0];
    let m = name.match(/^(DarkNeutral|Neutral)(\d+)(A?)/);
    if (m) {
      const [, fam, step, a] = m;
      const dark = fam === 'DarkNeutral';
      if (a) return dark ? DA(ATL_DA[step]) : NA(ATL_NA[step]);
      if (step === '1200') return N(dark ? 0 : 1100);
      return dark ? D(stepOf('darkNeutral', step)) : N(stepOf('neutral', step));
    }
    m = name.match(/^([A-Z][a-z]+)(\d+)(A\d+)?$/);
    if (m) {
      const [, fam, rawStep, a] = m;
      const f = isDirect(token) ? DIRECT[fam] : familyFor(token, fam);
      const step = stepOf(f, rawStep);
      return a ? hueAlpha(f, step, a.slice(1)) : H(f, step);
    }
    if (name === 'transparent') return TRANSPARENT;
    let f = tokenFamily(token) ?? Object.entries(ROLE_FAM).find(([k]) => token.includes(`.${k}`))?.[1] ?? null;
    if (token.startsWith('elevation.surface') && HEX6.test(name)) f = 'neutral';
    // Atlassian's off-ramp extremes land on the nearest step (1100 exists for this).
    if (f && HEX6.test(name)) return H(f, nearestByL(f, name));
    throw new Error(`${token}: unresolvable reference ${reference}`);
  }

  // ---- PLUS deviations: [light, dark, light IC, dark IC, why]. IC null = same as base. ----
  // Evaluated in this order on purpose: it is the order hue-alpha primitives register in.
  const SEL_WHY =
    "Selection is neutral, as in Notion, claude.ai and Atlassian's FY27 Finesse override. Ink 10/12/14% " +
    '(pressed stops at 14% so subtle text and links on it keep 4.5:1), a step past hover (6%); always paired with a ' +
    'non-color cue (a check, an icon or the medium label weight), never a side stripe.';
  const overrides = {
    'color.border.focused': [H('lagoon', 700), H('lagoon', 300), H('lagoon', 800), H('lagoon', 300),
      'Two steps darker than Atlassian (500): 5.0:1 on white, and 3:1 on the hovered and selected grounds it sits on. Drawn with a 2px offset, never inset on a fill.'],
    'color.interaction.hovered': [NA(8), DA(8), null, null, 'PLUS state-layer ruling (2026-10-24): hover overlay 8%. Atlassian uses 16%. Only for fills that cannot change (avatars, images).'],
    'color.interaction.pressed': [NA(12), DA(12), null, null, 'PLUS ruling: pressed overlay 12%. Atlassian uses 32%.'],
    'color.blanket': [NA(32), ref('blackAlpha', 60), null, null, "Today's 0.32 scrim in light; in dark the scrim is black at 60%, because paper at any opacity would lighten the page."],
    'color.blanket.selected': [NA(8), DA(8), null, null, 'Selection is neutral.'],
    'color.blanket.danger': [hueAlpha('red', '500', 8), hueAlpha('red', '600', 8), null, null, "Atlassian's alpha re-based on the PLUS red."],
    'color.background.inverse.subtle': [NA(16), DA(16), null, null, "Atlassian's alpha re-based on PLUS ink and paper."],
    'color.background.inverse.subtle.hovered': [NA(24), DA(24), null, null, "Atlassian's alpha re-based on PLUS ink and paper."],
    'color.background.inverse.subtle.pressed': [NA(32), DA(32), null, null, "Atlassian's alpha re-based on PLUS ink and paper."],
    'color.background.selected': [NA(10), DA(10), NA(12), DA(12), SEL_WHY],
    'color.background.selected.hovered': [NA(12), DA(12), NA(16), DA(16), SEL_WHY],
    'color.background.selected.pressed': [NA(14), DA(14), NA(24), DA(24), `${SEL_WHY} Atlassian presses to 31%.`],
    'color.background.selected.bold.pressed': [H('lagoon', 850), H('lagoon', 250), null, null, 'Set below from brand.bold: checked controls are Lagoon.'],
    'color.text.selected': [N(1000), D(1000), N(1100), D(1100), SEL_WHY],
    'color.icon.selected': [N(1000), D(1000), N(1100), D(1100), SEL_WHY],
    'color.link': [H('lagoon', 800), H('lagoon', 300), H('lagoon', 1000), H('lagoon', 100),
      'One step darker than Atlassian (700) so links keep 4.5:1 on selected and hovered rows. Links in running text are underlined at rest.'],
    'color.link.pressed': [H('lagoon', 900), H('lagoon', 250), H('lagoon', 1100), H('lagoon', 200), 'Follows color.link.'],
    'color.text.brand': [H('lagoon', 800), H('lagoon', 300), H('lagoon', 1000), H('lagoon', 100), 'Follows color.link.'],
    // headroom on the grounds these actually sit on (hovered rows, selected rows, overlays)
    'color.text.subtlest': [N(750), D(750), N(900), D(900),
      'One half-step darker than Atlassian (700) so meta text keeps 4.5:1 on hovered and selected rows and on dark overlays. icon.subtlest stays on 700.'],
    'color.border.input': [N(600), D(700), N(800), D(800),
      'One step darker than Atlassian (500) so a field edge keeps 3:1 on hovered grounds and overlays.'],
  };
  overrides['color.border'] = [LINE(), DLINE(), NA(49), DA(50),
    'The line alpha (slot 300) is set per plan: Notion draws dividers at about 7% warm ink, claude.ai at 8-12%. Increased contrast: 49%, which clears 3:1.'];
  overrides['color.text.warning.inverse'] = [N(1100), null, N(0), null, 'Full ink, since step 1000 on warning.bold.pressed is 4.4:1 in Plan A.'];
  overrides['color.icon.warning.inverse'] = [N(1100), null, N(0), null, 'Full ink, as text.warning.inverse.'];

  const ADDITIONS = [ // [name, light, dark, light IC, dark IC, use, why]
    ['color.interaction.dragged', NA(16), DA(16), null, null, 'Overlay on an item while it is dragged.', 'PLUS addition: the 16% step of the state-layer ruling.'],
    ['color.interaction.inverse.hovered', DA(8), NA(8), null, null,
      'Hover overlay on a dark or colored ground (close buttons on toasts, chips on bold fills).', "PLUS addition: today's surface-state on dark grounds has no Atlassian equivalent."],
    ['color.interaction.inverse.pressed', DA(12), NA(12), null, null, 'Pressed overlay on a dark or colored ground.', 'PLUS addition.'],
    ['color.border.focused.inverse', N(0), D(100), null, null, 'Focus ring drawn inside a bold or colored fill.', "PLUS addition: today's focus-ring-inverse."],
    ['color.border.surface', TRANSPARENT, TRANSPARENT, NA(49), TRANSPARENT,
      "The Surface pattern's 1px edge. Invisible except in light increased contrast, where the sunken frame turns white.",
      'PLUS addition: keeps the frame and the Surface apart when increased contrast removes the tone step.'],
  ];

  const KEYS = ['light', 'dark', 'lic', 'dic'];
  function row(name, x, alias = null) {
    const t = alias || name;
    const base = (i) => resolve(t, x[KEYS[i]]); // lazy: only resolved where no override applies
    let why = null;
    const vals = [];
    if (name in overrides) {
      const o = overrides[name];
      why = o[4];
      for (let i = 0; i < 4; i++) {
        if (o[i]) vals.push(o[i]);
        else if (i >= 2 && o[i - 2]) vals.push(o[i - 2]);
        else vals.push(base(i));
      }
    } else {
      for (let i = 0; i < 4; i++) vals.push(base(i));
    }
    return mk(name, ...vals, shortUse(x.desc), why, [x.light, x.dark]);
  }

  const rows = [];
  for (const x of atlassian) {
    const n = x.name;
    if (SKIP.some((s) => n.includes(s))) continue;
    if (n === 'utility.elevation.surface.current') {
      rows.push(mk(n, N(0), D(100), null, null, 'The surface the element sits on; containers reassign it, sticky cells and overflow fades read it.', null));
      continue;
    }
    if (!n.startsWith('color.') && !n.startsWith('elevation.surface')) continue;
    rows.push(row(n, x));
  }
  const BROWN_WHY = "PLUS addition: brown, Notion's tag color that Atlassian lacks. Same shape as every accent.";
  for (const x of atlassian) {
    const n = x.name;
    if (n.includes('.accent.blue') || n.startsWith('color.chart.blue.')) {
      const bn = n.replaceAll('.blue', '.brown');
      const swapped = Object.fromEntries(Object.entries(x).map(([k, v]) => [k, KEYS.includes(k) ? v.replaceAll('Blue', 'Brown') : v]));
      const r = row(bn, swapped, bn);
      r.use = r.use.replaceAll('blue', 'brown').replaceAll('Blue', 'Brown');
      r.deviation = BROWN_WHY;
      rows.push(r);
    }
  }
  for (const [n, l, d, li, di, use, why] of ADDITIONS) rows.push(mk(n, l, d, li, di, use, why));
  const byName = {};
  for (const r of rows) byName[r.name] = r;

  const setMode = (name, mode, [refName, hex]) => {
    byName[name][`${mode}_ref`] = refName;
    byName[name][mode] = hex;
  };

  // ---- accents: tag text, dark IC fills, gray fixes ----
  const TAG_WHY = "PLUS: tag text one step further from its fill than Atlassian (850 in light, 250 in dark), as Notion's and Claude's tags are (8-9:1).";
  const IC_WHY = 'PLUS increased-contrast fix: dark accent fills step one further from their text, and hovered and pressed stay distinct (step 1100).';
  for (const f of HUES) {
    const a = `color.background.accent.${f}`;
    if (f === 'gray') {
      setMode('color.text.accent.gray', 'light', N(900));
      setMode('color.text.accent.gray', 'light_ic', N(1100));
      setMode('color.text.accent.gray', 'dark', D(900));
      setMode('color.text.accent.gray', 'dark_ic', D(1100));
      byName['color.text.accent.gray'].deviation = TAG_WHY;
      for (const [suf, mode, v] of [
        ['.subtler', 'dark', D(350)], ['.subtler', 'dark_ic', D(350)], ['.subtler.hovered', 'light', N(350)], ['.subtler.hovered', 'light_ic', N(350)],
        ['.subtler.pressed', 'light', N(400)], ['.subtler.pressed', 'light_ic', N(400)], ['.subtler.pressed', 'dark', D(500)],
        ['.subtle', 'dark_ic', D(300)], ['.subtle.hovered', 'dark_ic', D(350)], ['.subtle.pressed', 'dark_ic', D(400)],
        ['.bolder', 'light_ic', N(900)], ['.bolder.hovered', 'light_ic', N(1000)], ['.bolder.pressed', 'light_ic', N(1100)],
      ]) {
        setMode(a + suf, mode, v);
        byName[a + suf].deviation = byName[a + suf].deviation || IC_WHY;
      }
      setMode('color.icon.accent.gray', 'dark', D(800));
      continue;
    }
    setMode(`color.text.accent.${f}`, 'light', H(f, 850));
    setMode(`color.text.accent.${f}`, 'light_ic', H(f, 1000));
    setMode(`color.text.accent.${f}`, 'dark', H(f, 250));
    setMode(`color.text.accent.${f}`, 'dark_ic', H(f, 100));
    const x = byName[`color.text.accent.${f}`];
    x.deviation = x.deviation ? `${x.deviation} ${TAG_WHY}` : TAG_WHY;
    for (const [suf, st] of [['.subtle', 900], ['.subtle.hovered', 1000], ['.subtle.pressed', 1100], ['.bolder', 300], ['.bolder.hovered', 250], ['.bolder.pressed', 200]]) {
      setMode(a + suf, 'dark_ic', H(f, st));
      byName[a + suf].deviation = byName[a + suf].deviation || IC_WHY;
    }
  }

  // ---- checked controls and the active tab indicator are Lagoon; highlight selection stays neutral ----
  const SB_WHY =
    'Checked checkboxes, radios, switches and the active tab indicator are Lagoon, ' +
    'the same steps as brand.bold; highlight fills and selected text stay neutral ink.';
  for (const suf of ['', '.hovered', '.pressed']) {
    for (const mode of MODES) {
      const b = byName[`color.background.brand.bold${suf}`];
      setMode(`color.background.selected.bold${suf}`, mode, [b[`${mode}_ref`], b[mode]]);
    }
    byName[`color.background.selected.bold${suf}`].deviation = SB_WHY;
  }
  for (const mode of MODES) {
    const b = byName['color.background.brand.bold'];
    setMode('color.border.selected', mode, [b[`${mode}_ref`], b[mode]]);
  }
  byName['color.border.selected'].deviation = SB_WHY;

  // ---- semantic-role IC gaps ----
  for (const [role, f] of Object.entries(ROLE_FAM)) {
    if (`color.background.${role}.subtle` in byName) setMode(`color.background.${role}.subtle`, 'dark_ic', H(f, 900));
  }
  setMode('color.background.neutral.bold.pressed', 'light_ic', N(900));
  setMode('color.icon.danger', 'light_ic', H('red', 800));

  // ---- charts: categorical order chosen for color-vision deficiency (protan and deutan) in both plans ----
  // Atlassian's order is blue, lime, purple, orange, then darker blue, purple, teal and orange. PLUS keeps blue
  // first and Atlassian's limit of six, and re-picks the hues and steps so neighbors stay apart.
  const CH_WHY =
    'PLUS: series 1-6 are blue, yellow, magenta, orange, purple and lime, picked so neighbors stay apart under ' +
    'protan and deutan simulation (deltaE >= 8) and for full color vision (deltaE >= 15) in both plans, light and dark. ' +
    'Dark keeps the light steps, one lighter at most: the 300 and 400 steps wash out on the dark surface and ' +
    'pull same-family neighbors together. No red, ' +
    'which reads as danger, no green, which reads as success, and no teal, which reads as the brand. 7 and 8 are ' +
    'darker reprises of 1 and 4 for overflow past the limit of six.';
  const CAT = { 1: ['blue', 600, 600], 2: ['yellow', 500, 500], 3: ['magenta', 800, 700], 4: ['orange', 500, 500],
    5: ['purple', 600, 500], 6: ['lime', 500, 500], 7: ['blue', 800, 700], 8: ['orange', 800, 700] };
  const nxt = (st, k) => STEPS[Math.max(0, Math.min(STEPS.length - 1, STEPS.indexOf(st) + k))];
  for (const [i, [f, l, d]] of Object.entries(CAT)) {
    for (const [suf, dl] of [['', 0], ['.hovered', 1]]) {
      const n = `color.chart.categorical.${i}${suf}`;
      const ls = nxt(l, dl);
      const ds = nxt(d, -dl);
      setMode(n, 'light', H(f, ls));
      setMode(n, 'dark', H(f, ds));
      setMode(n, 'light_ic', H(f, nxt(ls, 3)));
      setMode(n, 'dark_ic', H(f, nxt(ds, -2)));
      byName[n].deviation = CH_WHY;
    }
  }
  // The gray chart mark at the base emphasis keeps 4.5:1 on overlays in dark increased contrast.
  for (const n of ['color.chart.neutral', 'color.chart.gray.bold']) {
    setMode(n, 'dark_ic', D(750));
    byName[n].deviation = 'PLUS increased-contrast fix: darkNeutral.750, half a step past Atlassian, so the mark keeps 4.5:1 on overlays.';
  }

  const digitSteps = (f) => Object.keys(pal[f]).filter(isDigits).map(Number).sort((a, b) => a - b);
  const clampIndex = (steps, i) => Math.max(0, Math.min(steps.length - 1, i));

  // ---- no state may collapse: hovered and pressed step further when a mode maps them onto the same primitive ----
  for (const n of Object.keys(byName)) {
    if (n.endsWith('.hovered') || n.endsWith('.pressed') || !(`${n}.hovered` in byName) || !(`${n}.pressed` in byName)) continue;
    for (const mode of MODES) {
      const [b, h, p] = [byName[n], byName[`${n}.hovered`], byName[`${n}.pressed`]];
      // by reference, so every plan maps alike
      if (new Set([b[`${mode}_ref`], h[`${mode}_ref`], p[`${mode}_ref`]]).size === 3) continue;
      const [f0, s0] = famStep(b[`${mode}_ref`]);
      let [f1, s1] = famStep(h[`${mode}_ref`]);
      if (!f0 || f0 !== f1 || !(f0 in pal)) continue;
      const steps = digitSteps(f0);
      let direction = (s1 || s0) >= s0 ? 1 : -1;
      if (s1 === s0) { // hovered collapsed onto base: derive the direction from the other theme
        direction = mode.startsWith('light') ? 1 : -1;
        s1 = steps[clampIndex(steps, steps.indexOf(s0) + direction)];
        [h[`${mode}_ref`], h[mode]] = ref(f0, s1);
      }
      const s2 = steps[clampIndex(steps, steps.indexOf(s1) + direction)];
      if (s2 !== s0 && s2 !== s1) {
        [p[`${mode}_ref`], p[mode]] = ref(f0, s2);
        p.deviation = p.deviation || 'PLUS: pressed steps one further so it never equals hovered.';
      }
    }
  }
  // pairs with a hovered state but no pressed one (charts): hovered steps one further when it lands on its base
  for (const n of Object.keys(byName)) {
    if (n.endsWith('.hovered') || !(`${n}.hovered` in byName) || `${n}.pressed` in byName) continue;
    for (const mode of MODES) {
      const [b, h] = [byName[n], byName[`${n}.hovered`]];
      if (b[`${mode}_ref`] !== h[`${mode}_ref`]) continue;
      const [f0, s0] = famStep(b[`${mode}_ref`]);
      if (!f0 || !(f0 in pal)) continue;
      const steps = digitSteps(f0);
      const i = steps.indexOf(s0) + (mode.startsWith('light') ? 1 : -1);
      if (i >= 0 && i < steps.length) [h[`${mode}_ref`], h[mode]] = ref(f0, steps[i]);
    }
  }

  // ---- SMART subjects: a product layer aliasing the non-role accents. Each subject takes an
  // accent no semantic role uses, so a subject tag never reads as information, success, warning, danger or discovery.
  const SMART_MAP = [
    ['color.background.smart.{s}', 'color.background.accent.{f}.subtler', 'Subject tag and chip fill.'],
    ['color.background.smart.{s}.hovered', 'color.background.accent.{f}.subtler.hovered', 'Hovered subject chip.'],
    ['color.background.smart.{s}.pressed', 'color.background.accent.{f}.subtler.pressed', 'Pressed subject chip.'],
    ['color.background.smart.{s}.subtle', 'color.background.accent.{f}.subtle', 'Illustration bodies and other mid-strength SMART fills.'],
    ['color.background.smart.{s}.bold', 'color.background.accent.{f}.bolder', 'Bold subject fill (art, a filled badge).'],
    ['color.background.smart.{s}.bold.hovered', 'color.background.accent.{f}.bolder.hovered', 'Hovered bold subject fill.'],
    ['color.background.smart.{s}.bold.pressed', 'color.background.accent.{f}.bolder.pressed', 'Pressed bold subject fill.'],
    ['color.text.smart.{s}', 'color.text.accent.{f}', 'Text on the subject fill.'],
    ['color.icon.smart.{s}', 'color.icon.accent.{f}', 'Subject icon.'],
    ['color.border.smart.{s}', 'color.border.accent.{f}', 'Subject edge.'],
  ];
  for (const [subject, fam] of Object.entries(SMART)) {
    for (const [tn, src, use] of SMART_MAP) {
      const r0 = byName[src.replace('{f}', fam)];
      const n = tn.replace('{s}', subject);
      const r = { ...r0, name: n, atl_light: '—', atl_dark: '—', use: `${use} Aliases the ${fam} accent.`,
        deviation: `PLUS product layer: SMART ${subject} is the ${fam} accent.` };
      rows.push(r);
      byName[n] = r;
    }
  }
  // A subject's chart series is its accent hue at the emphasis that keeps S-M-A-R-T neighbors apart
  // (deltaE >= 8 under protan and deutan, >= 15 for full color vision), in that order.
  const SMART_CHART = { 'social-emotional': 'bold', 'mastering-content': 'boldest', advocacy: 'bold', relationship: 'boldest', 'technology-tools': 'bold' };
  for (const [subject, emphasis] of Object.entries(SMART_CHART)) {
    const fam = SMART[subject];
    for (const suf of ['', '.hovered']) {
      const r0 = byName[`color.chart.${fam}.${emphasis}${suf}`];
      const n = `color.chart.smart.${subject}${suf}`;
      const r = { ...r0, name: n, atl_light: '—', atl_dark: '—',
        use: suf ? `Hovered state of color.chart.smart.${subject}.` : `Chart series for the ${subject} subject. Aliases color.chart.${fam}.${emphasis}.`,
        deviation: `PLUS product layer: SMART ${subject} charts in the ${fam} hue, at ${emphasis} so neighbors in S-M-A-R-T order stay apart.` };
      rows.push(r);
      byName[n] = r;
    }
  }

  // ---- every value must be a primitive reference ----
  const REF_RE = /^(transparent|[a-zA-Z]+\.[0-9]+(a[0-9]+)?)$/;
  const bad = rows.flatMap((r) => MODES.filter((m) => !REF_RE.test(r[`${m}_ref`])).map((m) => `${r.name} ${m} ${r[`${m}_ref`]}`));
  if (bad.length) throw new Error(`non-primitive references: ${bad.slice(0, 8).join(', ')}`);

  const accentPattern = {};
  for (const x of atlassian) {
    if (x.name.includes('.accent.blue')) {
      accentPattern[x.name.replaceAll('.blue', '.{f}')] = [x.light.split(/\s+/)[0], x.dark.split(/\s+/)[0], shortUse(x.desc)];
    }
  }

  return { rows, accent_pattern: accentPattern, shadows: shadows(pal), opacity: OPACITY, palette: pal };
}

// ---- shadows: fixed layer counts (raised 3, overlay 3, overflow 2), per-plan light geometry, shared dark ----
function shadows(pal) {
  const I = pal.neutral['1100'].hex;
  const K = pal.darkNeutral['0'].hex;
  const PA = pal.darkNeutral['1100'].hex;
  const T = '#00000000';
  const a = (hex, pct) => withAlpha(hex, pct / 100);
  const layers = (spec) =>
    spec.map(([x, y, b, sp, pct]) => `${x}px ${y}px ${b}px${sp ? ` ${sp}px` : ''} ${pct ? a(I, pct) : T}`).join(', ');
  const raisedL = layers(pal.shadow.raised);
  const overlayL = layers(pal.shadow.overlay);
  const rw = 'Light geometry comes from the plan (shadow primitives): Plan A Notion cards, Plan B claude.ai cards.';
  const ow = 'Light geometry comes from the plan: Plan A Notion popovers, Plan B claude.ai menus.';
  const raisedD = `0px 0px 0px 1px ${a(PA, 10)}, 0px 1px 1px ${a(K, 50)}, 0px 0px 1px ${a(K, 50)}`;
  const overlayD = `0px 0px 0px 1px ${a(PA, 12)}, 0px 8px 12px ${a(K, 36)}, 0px 0px 1px 1px ${a(K, 50)}`;
  const CARD = ' Cards rest on surface.raised with this ring; a clickable card moves to shadow.overlay on hover.';
  const SHADOWS = [
    ['elevation.shadow.raised', raisedL, raisedD, 'Box shadow of a raised card. Pair with elevation.surface.raised.', `${rw}${CARD} In dark, the ring is paper at 10%, so cards keep an edge.`],
    ['elevation.shadow.overlay', overlayL, overlayD, 'Box shadow of anything over the UI: menus, popovers, tooltips, flags, modals, dragged items. Pair with elevation.surface.overlay.', `${ow} Modals join this level.`],
    ['elevation.shadow.overflow', `0px 0px 8px ${a(I, 16)}, 0px 0px 1px ${a(I, 12)}`, `0px 0px 12px ${a(K, 56)}, 0px 0px 1px ${a(K, 50)}`,
      "Shadow where content scrolls under other content, such as a table's sticky column.", null],
    ['elevation.shadow.overflow.spread', a(I, 16), a(K, 56), 'Fallback for overflow when a box shadow is not feasible; pair with .perimeter.', null],
    ['elevation.shadow.overflow.perimeter', a(I, 12), a(K, 50), 'Fallback for overflow when a box shadow is not feasible; pair with .spread.', null],
  ];
  const icRing = (shadow, ring) => shadow.replace(/^0px 0px 0px 1px #[0-9a-fA-F]{6,8}/, `0px 0px 0px 1px ${ring}`);
  return SHADOWS.map(([name, light, dark, use, deviation]) => {
    const x = { name, light, dark, use, deviation, light_ic: light, dark_ic: dark };
    if (name === 'elevation.shadow.raised' || name === 'elevation.shadow.overlay') {
      x.light_ic = icRing(light, pal.neutralAlpha['900'].hex);
      x.dark_ic = icRing(dark, pal.darkNeutralAlpha['900'].hex);
    }
    return x;
  });
}

const OPACITY = [
  { name: 'opacity.disabled', light: '0.4', dark: '0.4', use: 'Images and whole elements in a disabled state.', deviation: "Today 0.38 (Material); 0.4 is Atlassian's. A visible change on every disabled control." },
  { name: 'opacity.loading', light: '0.2', dark: '0.2', use: 'Content under a loading spinner.', deviation: 'New.' },
];
