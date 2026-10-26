// Parity with the reference Python generator, token for token.
//
// The reference outputs live outside the repo (Bill's color-system folder), so
// this suite runs where that folder exists and skips elsewhere, CI included.
// Point COLOR_REFERENCE_DIR at the folder that holds `generator/` and `out/` to
// run it from another checkout.
//
// Four departures from the reference are deliberate, and the comparison is
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
/** Top-level blocks of a stylesheet body (each ends with a `}` in column 0). */
/** Tokens PLUS added after the reference was cut. */
const PLUS_ADDED = /^color[./]background[./]smart[./][a-z-]+[./]subtle$/;
const ADDED_DECL = /^ +--ds-background-smart-[a-z-]+-subtle: [^\n]*\n/gm;
const withoutAdded = (spec) => ({
  ...spec,
  collections: spec.collections.map((c) => ({ ...c, variables: c.variables.filter((v) => !PLUS_ADDED.test(v.name)) })),
});
const blocks = (css) => css.split(/(?<=^\}\n)/m).map((b) => b.trim()).filter(Boolean);

for (const key of ['A', 'B']) {
  test(`Plan ${key}: every primitive matches the reference palette`, { skip }, () => {
    const { semantics } = buildPlan(key);
    const ref = json(`generator/palette_${key}.json`).palette;
    assert.deepEqual(semantics.palette, ref);
    assert.deepEqual(Object.keys(semantics.palette), Object.keys(ref));
  });

  test(`Plan ${key}: all 518 reference tokens match, names, refs and hex, in every mode`, { skip }, () => {
    const { semantics } = buildPlan(key);
    const ref = json(`generator/semantics_${key}.json`);
    const rows = semantics.rows.filter((r) => !PLUS_ADDED.test(r.name));
    assert.equal(rows.length, 518);
    assert.deepEqual(values(rows), values(ref.rows));
    assert.deepEqual(withoutProse(semantics.shadows), withoutProse(ref.shadows));
    assert.deepEqual(withoutProse(semantics.opacity), withoutProse(ref.opacity));
  });

  test(`Plan ${key}: the Figma spec matches the reference, descriptions aside`, { skip }, () => {
    const { semantics } = buildPlan(key);
    assert.deepEqual(withoutProse(withoutAdded(figmaSpec(key, semantics))), withoutProse(json(`out/${key}/figma-spec.json`)));
  });

  test(`Plan ${key}: palette and semantic SCSS match byte for byte below the header`, { skip }, () => {
    const files = renderPlan(key, 'scripts/generate-color-tokens.mjs');
    for (const file of ['_palette.scss', '_semantic.scss']) {
      assert.equal(body(files[file]).replace(ADDED_DECL, ''), body(readFileSync(join(REF, `out/${key}/${file}`), 'utf8')), file);
    }
  });

  test(`Plan ${key}: elevation and bridge SCSS keep every reference block`, { skip }, () => {
    const files = renderPlan(key, 'scripts/generate-color-tokens.mjs');
    const ours = blocks(body(files['_elevation.scss']));
    for (const b of blocks(body(readFileSync(join(REF, `out/${key}/_elevation.scss`), 'utf8')))) assert.ok(ours.includes(b), `_elevation.scss: ${b.split('\n')[0]}`);

    const decls = (b) => (b.match(/--bs-[^\n;]+/g) ?? []).map((d) => d.replace(/(-rgb: )(\d+)[ ,]+(\d+)[ ,]+(\d+)/, '$1$2,$3,$4'));
    const bySelector = (css) => new Map(blocks(css).map((b) => [b.slice(0, b.indexOf('{')).trim(), decls(b)]));
    const bridge = bySelector(body(files['_bootstrap-bridge.scss']));
    for (const [sel, refDecls] of bySelector(body(readFileSync(join(REF, `out/${key}/_bootstrap-bridge.scss`), 'utf8')))) {
      assert.ok(bridge.has(sel), `_bootstrap-bridge.scss: ${sel}`);
      for (const d of refDecls.filter((d) => !d.startsWith('--bs-light'))) assert.ok(bridge.get(sel).includes(d), `_bootstrap-bridge.scss ${sel}: ${d}`);
    }
  });
}
