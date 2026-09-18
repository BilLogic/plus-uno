/**
 * The POLICY half of `check:size-fallbacks` (#611).
 *
 * The measurement — a disagreeing dimension literal, a percentage that must
 * not convert to px — lives in `token-fallbacks.test.mjs`. This file drives
 * the gate against a fixture tree: plant a wrong gap, assert the finding;
 * empty the token directory, assert the floor.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { run } from './check-size-fallbacks.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

const BASELINE = JSON.stringify({
  why: 'Literal fallbacks that disagree with their own DIMENSION token.',
  disagreements: [],
});

test('a disagreeing size fallback in a fixture tree is a finding', () => {
  const { root, done } = policyTree(
    {
      'design-system/src/tokens/_spacing.scss': ':root { --size-gap: 8px; }\n',
      'design-system/src/a.scss': '.a { gap: var(--size-gap, 16px); }\n',
      'docs/evals/size-fallback-baseline.json': BASELINE,
    },
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /--size-gap/.test(message) && /16px/.test(message)),
      `expected a disagreement finding, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('an empty token directory fires the sentinel floor, not a clean sweep', () => {
  const { root, done } = policyTree(
    {
      'design-system/src/a.scss': '.a { gap: var(--size-gap, 16px); }\n',
      'docs/evals/size-fallback-baseline.json': BASELINE,
    },
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty token directory must not report a clean sweep');
    assert.match(found[0], /no dimension tokens found under design-system\/src\/tokens/);
  } finally {
    done();
  }
});
