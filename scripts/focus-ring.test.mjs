import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { AFFORDANCE, NEGATED, colours, failures, focusRules, indicators, ratio } from './focus-ring.mjs';

const VALUES = colours();

function corpus(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'focus-ring-'));
  for (const [rel, source] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), source);
  }
  return root;
}

test('the ring is measured against a translucent ground composited over the page', () => {
  // A 12% tint of primary is a near-white ground, so a primary ring on it is
  // legible. Read as raw rgba its channels are primary's own and the check
  // compares primary against primary — four false findings in the first run.
  const onTint = ratio('--color-primary', '--color-primary-state-12', VALUES);
  assert.ok(onTint > 4, `primary on a 12% primary tint measured ${onTint}`);
  const onPage = ratio('--color-primary', '--color-surface', VALUES);
  assert.ok(Math.abs(onTint - onPage) < 1, 'a 12% tint is not far from the page');
});

test('the tokens the sweep found are still the values it found them at', () => {
  assert.ok(ratio('--color-inverse-primary', '--color-surface', VALUES) < 2);
  assert.ok(ratio('--color-primary-state-08', '--color-surface', VALUES) < 1.3);
  assert.ok(ratio('--color-focus-ring', '--color-surface', VALUES) >= 4.5);
});

test('a rule is scored on its strongest affordance, not its weakest', () => {
  // Eleven real rules pair a 1.13:1 glow with a 5.02:1 border. The border is
  // the indicator; the glow is decoration around it.
  const root = corpus({
    'design-system/src/a.scss': [
      '.a:focus {',
      '  outline: none;',
      '  border-color: var(--color-primary);',
      '  box-shadow: 0 0 0 0.2rem var(--color-primary-state-08);',
      '}',
    ].join('\n'),
  });
  const entries = indicators(focusRules(['design-system/src/a.scss'], root), VALUES);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].best.token, '--color-primary');
  assert.deepEqual(failures(entries, {}), []);
});

test('`:not(:focus)` is the unfocused state and is not a focus rule', () => {
  const root = corpus({
    'design-system/src/a.scss': '.a:hover:not(:focus) { border-color: var(--color-inverse-primary); }',
  });
  assert.deepEqual(focusRules(['design-system/src/a.scss'], root), []);
  assert.match('.a:not(:focus-visible)'.replace(NEGATED, ''), /^\.a$/);
});

test('a background is a ground, never an indicator', () => {
  // Scored as an affordance it is measured against itself and returns 1.00:1
  // for every rule that sets one — four findings, all the check misreading its
  // own input.
  assert.equal([...'.a:focus { background-color: var(--color-primary); }'.matchAll(AFFORDANCE)].length, 0);
});

test('a focus style nested under a focus parent counts', () => {
  const root = corpus({
    'design-system/src/a.scss': '.range:focus {\n  &::-webkit-slider-thumb {\n    box-shadow: 0 0 0 2px var(--color-inverse-primary);\n  }\n}\n',
  });
  const entries = indicators(focusRules(['design-system/src/a.scss'], root), VALUES);
  assert.equal(entries.length, 1);
  assert.equal(failures(entries, {}).length, 1);
});

test('failures report the unseen ring, and a stale exception', () => {
  const entry = {
    file: 'a.scss',
    line: 3,
    selector: '.a:focus',
    best: { token: '--color-inverse-primary', ratio: 1.62, property: 'border-color', ground: '--color-surface' },
  };
  const found = failures([entry], {});
  assert.equal(found.length, 1);
  assert.match(found[0], /1\.62:1/);
  assert.deepEqual(failures([entry], { 'a.scss:3': 'recorded' }), []);
  const stale = failures([{ ...entry, best: { ...entry.best, ratio: 5 } }], { 'a.scss:3': 'recorded' });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /no longer is one/);
});
