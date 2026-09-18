import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { run } from './check-focus-ring.mjs';
import { AFFORDANCE, NEGATED, colours, failures, focusRules, indicators, invisible, ratio } from './focus-ring.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

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
  assert.deepEqual([...invisible(entries).keys()], []);
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
  assert.equal(invisible(entries).size, 1);
});

/*
 * The three verdicts, worded. Which rule is NEW, which recorded one has gone
 * STALE and which reason says nothing is `scripts/lib/ratchet.mjs`'s, asserted
 * once against all twelve live records in `scripts/lib/ratchet-conformance.mjs`
 * (#600). What is asserted here is the measured side this check hands it, and
 * what each verdict says.
 */

const ENTRY = {
  file: 'a.scss',
  line: 3,
  selector: '.a:focus',
  best: { token: '--color-inverse-primary', ratio: 1.62, property: 'border-color', ground: '--color-surface' },
};

test('the measured side is keyed the way the record is, and holds only rules under the bar', () => {
  assert.deepEqual([...invisible([ENTRY]).keys()], ['a.scss:3']);
  assert.equal(invisible([{ ...ENTRY, best: { ...ENTRY.best, ratio: 5 } }]).size, 0);
});

test('a new ring is worded with its ratio, and nothing new is nothing said', () => {
  const under = invisible([ENTRY]);
  const found = failures(under, { fresh: ['a.scss:3'] });
  assert.equal(found.length, 1);
  assert.match(found[0], /1\.62:1/);
  assert.deepEqual(failures(under, {}), []);
});

test('a stale exception and a reasonless one are each their own finding', () => {
  const stale = failures(new Map(), { stale: ['a.scss:3'] });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /no longer is one/);

  const unreviewed = failures(invisible([ENTRY]), { unreviewed: ['a.scss:3'] });
  assert.equal(unreviewed.length, 1);
  assert.match(unreviewed[0], /with no reason/);
});

/*
 * The policy half (#611). The measurement above plants a rule; the gate is a
 * run against a fixture tree — an invisible ring, and a vanished token directory.
 */

const FOCUS_BASELINE = JSON.stringify({
  note: 'Focus rules whose strongest visible affordance is under 3:1.',
  recordedAt: '2026-09-18',
  measured: { focusRules: 0, wereUnder3to1: 0, fixedBy: '--color-focus-ring' },
  exceptions: {},
});

test('an invisible focus ring in a fixture tree is a finding', () => {
  const { root, done } = policyTree({
    'design-system/src/tokens/_colors.scss':
      ':root { --color-surface: #f9f9fc; --color-inverse-primary: #84cfff; --color-focus-ring: #0472a8; }\n',
    'design-system/src/tokens/_color_roles.scss': ':root { --color-focus-ring: var(--color-primary); }\n',
    'design-system/src/a.scss': '.a:focus { outline: 2px solid var(--color-inverse-primary); }\n',
    'docs/evals/focus-ring.json': FOCUS_BASELINE,
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /strongest focus affordance/.test(message) && /--color-inverse-primary/.test(message)),
      `expected an invisible-ring finding, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('an empty token directory fires the sentinel floor, not a clean sweep', () => {
  const { root, done } = policyTree({
    'design-system/src/a.scss': '.a:focus { outline: 2px solid var(--color-inverse-primary); }\n',
    'docs/evals/focus-ring.json': FOCUS_BASELINE,
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty token directory must not report a clean sweep');
    assert.ok(
      found.some((message) => /only \d+ stylesheets scanned \(floor 150\)/.test(message)),
      `expected the stylesheet floor, got:\n${found.join('\n')}`,
    );
    assert.ok(
      found.some((message) => /no longer defines --color-focus-ring/.test(message)),
      `expected the vanished role, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});
