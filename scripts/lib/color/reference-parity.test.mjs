// Parity with the reference Python generator, token for token.
//
// The reference outputs live outside the repo (Bill's color-system folder), so
// this suite runs where that folder exists and skips elsewhere, CI included.
// Point COLOR_REFERENCE_DIR at the folder that holds `generator/` and `out/` to
// run it from another checkout.
//
// Six departures from the reference are deliberate, and the comparison is
// shaped around them:
// - PLUS adds tokens the reference never had: `color.background.smart.<subject>.subtle`,
//   the mid-strength SMART fill for illustration bodies. They are dropped from
//   our side before comparing, so every reference token still matches.
// - Descriptions (`use`, `deviation`, Figma `description`) say the rule rather
//   than the proposal's decision numbers, so names, references and hex are
//   compared, and description prose is not.
// - `_elevation.scss` and `_bootstrap-bridge.scss` add the color-auto and
//   contrast-auto blocks the reference omits, so every reference block must
//   appear verbatim in ours, and ours may hold more.
// - `_bootstrap-bridge.scss` writes its `*-rgb` triplets with commas, since
//   Bootstrap composes them as `rgba(var(--bs-primary-rgb), .5)`; points
//   `--bs-light` at an opaque surface, since a triplet drops alpha; and bridges
//   more variables, with increased-contrast blocks. So every other reference
//   declaration must appear in our block of the same selector, triplets
//   compared as numbers.
// - The chart series moved after the reference was cut: the categorical order
//   and steps, the SMART chart series, and the gray chart mark in dark
//   increased contrast (`semantics.mjs` § charts). Those tokens are left out
//   of every comparison; `check:color-system` holds them instead.
// - Lagoon was retuned toward Notion's teal after the reference was cut (plan-a.json
//   `accents`). The reference's Lagoon hexes are swapped for ours, step for step,
//   before any comparison, so every other value is still held to the reference.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { buildPlan, renderPlan } from './build.mjs';
import { figmaSpec } from './figma.mjs';

const REF = process.env.COLOR_REFERENCE_DIR ?? join(homedir(), 'Documents/Claude/Projects/PLUS/color-system');
const skip = existsSync(join(REF, 'generator')) ? false : `reference folder not found at ${REF}`;
const json = (rel) => JSON.parse(readFileSync(join(REF, rel), 'utf8'));
const body = (text) => text.slice(text.indexOf('\n') + 1);
const VALUE_KEYS = ['name', 'light_ref', 'light', 'dark_ref', 'dark', 'light_ic_ref', 'light_ic', 'dark_ic_ref', 'dark_ic'];
const values = (rows) => rows.map((r) => Object.fromEntries(VALUE_KEYS.map((k) => [k, r[k]])));
const withoutProse = (value) =>
  JSON.parse(JSON.stringify(value, (k, v) => (k === 'description' || k === 'use' || k === 'deviation' ? undefined : v)));
/** Tokens PLUS added after the reference was cut. */
const PLUS_ONLY_TOKEN = /^color[./]background[./]smart[./][a-z-]+[./]subtle$|^color[./]ai[./]background[./]bold/;
const PLUS_ONLY_SCSS_DECL = /^ +--ds-(?:background-smart-[a-z-]+-subtle|ai-background-bold[a-z-]*): [^\n]*\n/gm;
const withoutPlusOnly = (spec) => ({
  ...spec,
  collections: spec.collections.map((c) => ({ ...c, variables: c.variables.filter((v) => !PLUS_ONLY_TOKEN.test(v.name)) })),
});
/** Top-level blocks of a stylesheet body (each ends with a `}` in column 0). */
const CHART_DEPARTURE = /^color\.chart\.(categorical|smart)\.|^color\.chart\.(neutral|gray\.bold)$/;
const isDeparture = (name) => CHART_DEPARTURE.test(name);
const keptRows = (rows) => rows.filter((r) => !isDeparture(r.name));
/** A Figma spec without the departed variables (`color/chart/neutral/default` is `color.chart.neutral`). */
const keptSpec = (spec) => ({
  ...spec,
  collections: spec.collections.map((c) => ({
    ...c,
    variables: c.variables.filter((v) => !isDeparture(v.name.replace(/\/default$/, '').replaceAll('/', '.'))),
  })),
});
/** A stylesheet without the departed declarations. */
const keptCss = (css) => css.split('\n').filter((l) => !/--ds-chart-(categorical|smart)-|--ds-chart-(neutral|gray-bold):/.test(l)).join('\n');
/** Rewrites the reference's Lagoon values (hex, bare hex and rgb triplets) to ours, for the plan's retuned steps. */
function lagoonSwap(key) {
  const ours = buildPlan(key).semantics.palette.lagoon;
  const ref = json(`generator/palette_${key}.json`).palette.lagoon;
  const triplet = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const swaps = Object.keys(ref).filter((step) => ref[step].hex !== ours[step].hex).map((step) => {
    const [from, to] = [ref[step].hex.toLowerCase(), ours[step].hex.toLowerCase()];
    return [new RegExp(from.slice(1), 'gi'), to.slice(1), new RegExp(`\\b${triplet(from).join('[ ,]+')}\\b`, 'g'), triplet(to).join(', ')];
  });
  const swapText = (text) => swaps.reduce((t, [hexRe, hex, rgbRe, rgb]) => t.replace(hexRe, hex).replace(rgbRe, rgb), text);
  // The Figma spec carries colors as 0-1 floats, rounded to four places.
  const floats = (hex) => triplet(hex).map((v) => Math.round((v / 255) * 1e4) / 1e4);
  const colorSwaps = Object.keys(ref).filter((step) => ref[step].hex !== ours[step].hex).map((step) => [floats(ref[step].hex), floats(ours[step].hex)]);
  swapText.value = (value) =>
    JSON.parse(swapText(JSON.stringify(value)), (k, v) => {
      if (v && typeof v === 'object' && typeof v.r === 'number' && typeof v.b === 'number') {
        const hit = colorSwaps.find(([[r, g, b]]) => v.r === r && v.g === g && v.b === b);
        if (hit) return { ...v, r: hit[1][0], g: hit[1][1], b: hit[1][2] };
      }
      return v;
    });
  return swapText;
}
const swapJson = (swap, value) => swap.value(value);
const blocks = (css) => css.split(/(?<=^\}\n)/m).map((b) => b.trim()).filter(Boolean);

for (const key of ['A', 'B']) {
  test(`Plan ${key}: every primitive matches the reference palette`, { skip }, () => {
    const { semantics } = buildPlan(key);
    const ref = json(`generator/palette_${key}.json`).palette;
    ref.lagoon = semantics.palette.lagoon; // retuned on purpose, see the header
    assert.deepEqual(semantics.palette, ref);
    assert.deepEqual(Object.keys(semantics.palette), Object.keys(ref));
  });

  test(`Plan ${key}: every reference token but the chart departures matches, names, refs and hex, in every mode`, { skip }, () => {
    const { semantics } = buildPlan(key);
    const ref = swapJson(lagoonSwap(key), json(`generator/semantics_${key}.json`));
    const rows = semantics.rows.filter((r) => !PLUS_ONLY_TOKEN.test(r.name));
    assert.equal(ref.rows.length, 518);
    assert.deepEqual(values(keptRows(rows)), values(keptRows(ref.rows)));
    assert.deepEqual(withoutProse(semantics.shadows), withoutProse(ref.shadows));
    assert.deepEqual(withoutProse(semantics.opacity), withoutProse(ref.opacity));
  });

  test(`Plan ${key}: the Figma spec matches the reference, descriptions aside`, { skip }, () => {
    const { semantics } = buildPlan(key);
    assert.deepEqual(withoutProse(keptSpec(withoutPlusOnly(figmaSpec(key, semantics)))), withoutProse(keptSpec(swapJson(lagoonSwap(key), json(`out/${key}/figma-spec.json`)))));
  });

  test(`Plan ${key}: palette and semantic SCSS match byte for byte below the header`, { skip }, () => {
    const files = renderPlan(key, 'scripts/generate-color-tokens.mjs');
    for (const file of ['_palette.scss', '_semantic.scss']) {
      assert.equal(keptCss(body(files[file]).replace(PLUS_ONLY_SCSS_DECL, '')), keptCss(body(lagoonSwap(key)(readFileSync(join(REF, `out/${key}/${file}`), 'utf8')))), file);
    }
  });

  test(`Plan ${key}: elevation and bridge SCSS keep every reference block`, { skip }, () => {
    const files = renderPlan(key, 'scripts/generate-color-tokens.mjs');
    const ours = blocks(body(files['_elevation.scss']));
    for (const b of blocks(body(readFileSync(join(REF, `out/${key}/_elevation.scss`), 'utf8')))) assert.ok(ours.includes(b), `_elevation.scss: ${b.split('\n')[0]}`);

    const decls = (b) => (b.match(/--bs-[^\n;]+/g) ?? []).map((d) => d.replace(/(-rgb: )(\d+)[ ,]+(\d+)[ ,]+(\d+)/, '$1$2,$3,$4'));
    const bySelector = (css) => new Map(blocks(css).map((b) => [b.slice(0, b.indexOf('{')).trim(), decls(b)]));
    const bridge = bySelector(body(files['_bootstrap-bridge.scss']));
    for (const [sel, refDecls] of bySelector(body(lagoonSwap(key)(readFileSync(join(REF, `out/${key}/_bootstrap-bridge.scss`), 'utf8'))))) {
      assert.ok(bridge.has(sel), `_bootstrap-bridge.scss: ${sel}`);
      for (const d of refDecls.filter((d) => !d.startsWith('--bs-light'))) assert.ok(bridge.get(sel).includes(d), `_bootstrap-bridge.scss ${sel}: ${d}`);
    }
  });
}
