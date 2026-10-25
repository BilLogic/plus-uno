/**
 * The POLICY half of `check:color-fallbacks` (#611).
 *
 * `token-fallbacks.test.mjs` already watches the measurement — a disagreeing
 * literal, an undefined name, the three color spellings. What it cannot watch
 * is the gate: a run against a fixture tree, the finding that run reports, and
 * the sentinel floor that fires when the token directory is empty rather than
 * a clean sweep.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { run } from './check-color-fallbacks.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

const BASELINE = JSON.stringify({
  why: 'Literal fallbacks that disagree with their own token.',
  disagreements: [],
  undefinedTokens: [],
});

test('a disagreeing color fallback in a fixture tree is a finding', () => {
  const { root, done } = policyTree(
    {
      'design-system/src/tokens/_colors.scss': ':root { --color-primary: #0472a8; }\n',
      'design-system/src/a.scss': '.a { color: var(--color-primary, #000000); }\n',
      'scripts/baselines/color-fallback-baseline.json': BASELINE,
    },
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /--color-primary/.test(message) && /#000000/.test(message)),
      `expected a disagreement finding, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('a stale rgba() wash in a fixture tree is a finding', () => {
  // The token was re-mixed and the wash beside it was not: same alpha, old base.
  const { root, done } = policyTree(
    {
      'design-system/src/tokens/_colors.scss':
        ':root { --color-tertiary-state-08: rgba(14, 129, 117, 0.08); }\n',
      'design-system/src/a.scss':
        '.a { background: var(--color-tertiary-state-08, rgba(0, 82, 221, 0.08)); }\n',
      'scripts/baselines/color-fallback-baseline.json': BASELINE,
    },
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /--color-tertiary-state-08/.test(message) && /a\.scss:1/.test(message)),
      `expected a disagreement finding for the stale wash, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('an empty token directory fires the sentinel floor, not a clean sweep', () => {
  const { root, done } = policyTree(
    {
      'design-system/src/a.scss': '.a { color: var(--color-primary, #000000); }\n',
      'scripts/baselines/color-fallback-baseline.json': BASELINE,
    },
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty token directory must not report a clean sweep');
    assert.match(found[0], /no --color-\* or --ds-\* tokens found under design-system\/src\/tokens/);
  } finally {
    done();
  }
});

/*
 * BOTH VOCABULARIES. The `--ds-*` tokens are generated into `tokens/color/`, and
 * the check reads them beside the legacy `--color-*` set: a disagreeing
 * fallback on either is a finding, and so is a `--ds-*` name nothing defines.
 */
const DS_TREE = (use) => ({
  'design-system/src/tokens/_colors.scss': ':root { --color-primary: #0472a8; }\n',
  'design-system/src/tokens/color/_palette.scss': ':root { --palette-teal-700: #147d6a; }\n',
  'design-system/src/tokens/color/_semantic.scss': ':root { --ds-text-brand: var(--palette-teal-700); }\n',
  'design-system/src/a.scss': use,
  'scripts/baselines/color-fallback-baseline.json': BASELINE,
});

test('a disagreeing --ds- fallback is a finding, its token followed through the palette', () => {
  const { root, done } = policyTree(
    DS_TREE('.a { color: var(--ds-text-brand, #000000); border-color: var(--color-primary, #111111); }\n'),
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /--ds-text-brand {2}is #147d6a, fallback says #000000/.test(message)),
      `expected a --ds- disagreement, got:\n${found.join('\n')}`,
    );
    assert.ok(
      found.some((message) => /--color-primary {2}is #0472a8, fallback says #111111/.test(message)),
      `expected the legacy disagreement beside it, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('a --ds- name defined nowhere is a finding, and one the color directory defines is not', () => {
  const { root, done } = policyTree(
    DS_TREE('.a { color: var(--ds-text-brand); background: var(--ds-text-brnad); }\n'),
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.equal(found.length, 1, `expected one finding, got:\n${found.join('\n')}`);
    assert.match(found[0], /referenced and never defined/);
    assert.match(found[0], /--ds-text-brnad/);
    assert.doesNotMatch(found[0], /--ds-text-brand\b/);
  } finally {
    done();
  }
});
