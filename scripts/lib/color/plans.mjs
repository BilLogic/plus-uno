/**
 * Plans: a plan is a set of primitive values and nothing else.
 *
 * Each `plans/plan-*.json` holds one plan's accent ramp recipe, neutral hexes,
 * alpha slot percents and shadow geometry. `buildPalette` turns a plan into
 * the primitive palette the semantic layer references by name; the semantic
 * mapping itself is the same for every plan, and `check:color-system` fails
 * when it is not. Swapping the build to another plan is `ACTIVE_PLAN`.
 */

import { readFileSync } from 'node:fs';

import { hexByte, hexToOklch, pyRound } from './oklch.mjs';
import { SHAPE, ramp } from './ramps.mjs';

/** The plan the repo builds. Plan B stays generated and checked beside it. */
export const ACTIVE_PLAN = 'A';

export const PLAN_KEYS = ['A', 'B'];

/**
 * The order primitives are emitted in (`_palette.scss`, the Figma primitives
 * collection). It is the reference generator's order, kept so the two outputs
 * compare line for line.
 */
const PALETTE_ORDER = [
  'teal', 'blue', 'green', 'lime', 'yellow', 'orange', 'red', 'magenta', 'purple',
  'neutral', 'darkNeutral', 'neutralAlpha', 'darkNeutralAlpha', 'lagoon', 'brown', 'shadow', 'blackAlpha',
];

/** @param {string} key  'A' or 'B' */
export function loadPlan(key) {
  const url = new URL(`./plans/plan-${key.toLowerCase()}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8'));
}

/** `#rrggbb` plus an alpha byte for opacity `a` (0-1). */
export const withAlpha = (hex, a) => hex + hexByte(pyRound(a * 255));

const fromHex = (hex) => {
  const [L, C, H] = hexToOklch(hex);
  return { L: pyRound(L, 3), C: pyRound(C, 3), H: pyRound(H, 1), hex };
};

/** Per-step chroma from a ladder: tints, mid steps and dark steps each scaled. */
function ladder(chroma, [tint, mid, dark], tintFloor, override = {}) {
  const shape = {};
  for (const [step, c] of Object.entries(chroma)) {
    const s = Number(step);
    shape[s] = c * (s <= 300 ? tint : s <= 700 ? mid : dark);
  }
  shape[100] = Math.max(shape[100], tintFloor); // a tint must read as a tint against the sunken frame
  for (const [step, c] of Object.entries(override)) shape[Number(step)] = c;
  return shape;
}

/** The accent families, one ramp each, by the plan's recipe. */
function accents({ recipe, vivid, families, ...rest }) {
  const out = {};
  if (recipe === 'ladder') {
    for (const [name, f] of Object.entries(families)) {
      out[name] = ramp(f.H, vivid, 1.0, f.hueLight ?? null, ladder(rest.chroma, f.scale, rest.tintFloor, f.override));
    }
    if (rest.borrow) {
      const { family, steps, from } = rest.borrow;
      const source = ramp(from.H, from.vivid, from.cmax);
      for (const step of steps) out[family][step] = source[step];
    }
    return out;
  }
  if (recipe === 'shape') {
    const shape = Object.fromEntries(Object.entries(SHAPE).map(([s, v]) => [s, Number(s) <= 300 ? v * rest.tintScale : v]));
    for (const [name, f] of Object.entries(families)) out[name] = ramp(f.H, vivid, f.cmax, f.hueLight ?? null, shape);
    return out;
  }
  throw new Error(`unknown accent recipe ${JSON.stringify(recipe)}`);
}

const alphaSlots = (base, pcts) =>
  Object.fromEntries(Object.entries(pcts).map(([slot, pct]) => [slot, { base, a: pct / 100, pct, hex: withAlpha(base, pct / 100) }]));

/**
 * The primitive palette for one plan: `{family: {step: {hex, ...}}}`.
 * Step 0 of the light neutrals is white in every plan.
 */
export function buildPalette(plan) {
  const light = { 0: { L: 1.0, C: 0.0, H: 0, hex: '#ffffff' } };
  for (const [step, hex] of Object.entries(plan.neutral.light)) light[step] = fromHex(hex);
  const dark = Object.fromEntries(Object.entries(plan.neutral.dark).map(([step, hex]) => [step, fromHex(hex)]));
  const ink = light[1100].hex;
  const paper = dark[1100].hex;
  const families = {
    ...accents(plan.accents),
    neutral: light,
    darkNeutral: dark,
    neutralAlpha: alphaSlots(ink, plan.alpha.light),
    darkNeutralAlpha: alphaSlots(paper, plan.alpha.dark),
    shadow: plan.shadow,
    blackAlpha: Object.fromEntries(
      Object.entries(plan.blackAlpha).map(([slot, pct]) => [slot, { base: '#000000', a: pct / 100, hex: withAlpha('#000000', pct / 100) }]),
    ),
  };
  const missing = PALETTE_ORDER.filter((name) => !(name in families));
  const extra = Object.keys(families).filter((name) => !PALETTE_ORDER.includes(name));
  if (missing.length || extra.length) throw new Error(`plan ${plan.key}: families missing ${missing} / unexpected ${extra}`);
  return Object.fromEntries(PALETTE_ORDER.map((name) => [name, families[name]]));
}
