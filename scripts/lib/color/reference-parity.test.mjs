// Parity with the reference Python generator, token for token.
//
// The reference outputs live outside the repo (Bill's color-system folder), so
// this suite runs where that folder exists and skips elsewhere. Point
// COLOR_REFERENCE_DIR at the folder that holds `generator/` and `out/` to run
// it from another checkout.
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
const dropFirstLine = (text) => text.slice(text.indexOf('\n') + 1);

for (const key of ['A', 'B']) {
  test(`Plan ${key}: every primitive matches the reference palette`, { skip }, () => {
    const { semantics } = buildPlan(key);
    assert.deepEqual(semantics.palette, json(`generator/palette_${key}.json`).palette);
    assert.deepEqual(Object.keys(semantics.palette), Object.keys(json(`generator/palette_${key}.json`).palette));
  });

  test(`Plan ${key}: all 518 semantic tokens match, refs and hex, in every mode`, { skip }, () => {
    const { semantics } = buildPlan(key);
    const ref = json(`generator/semantics_${key}.json`);
    assert.equal(semantics.rows.length, 518);
    assert.deepEqual(semantics.rows, ref.rows);
    assert.deepEqual(semantics.shadows, ref.shadows);
    assert.deepEqual(semantics.opacity, ref.opacity);
    assert.deepEqual(semantics.accent_pattern, ref.accent_pattern);
  });

  test(`Plan ${key}: the Figma spec matches the reference`, { skip }, () => {
    const { semantics } = buildPlan(key);
    assert.deepEqual(figmaSpec(key, semantics), json(`out/${key}/figma-spec.json`));
  });

  test(`Plan ${key}: the SCSS matches the reference byte for byte below the header`, { skip }, () => {
    const files = renderPlan(key, 'scripts/generate-color-tokens.mjs');
    for (const file of ['_palette.scss', '_semantic.scss', '_elevation.scss', '_bootstrap-bridge.scss']) {
      assert.equal(dropFirstLine(files[file]), dropFirstLine(readFileSync(join(REF, `out/${key}/${file}`), 'utf8')), file);
    }
  });
}
