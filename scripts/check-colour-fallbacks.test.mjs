/**
 * The POLICY half of `check:colour-fallbacks` (#611).
 *
 * `token-fallbacks.test.mjs` already watches the measurement — a disagreeing
 * literal, an undefined name, the three colour spellings. What it cannot watch
 * is the gate: a run against a fixture tree, the finding that run reports, and
 * the sentinel floor that fires when the token directory is empty rather than
 * a clean sweep.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { run } from './check-colour-fallbacks.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

const BASELINE = JSON.stringify({
  why: 'Literal fallbacks that disagree with their own token.',
  disagreements: [],
  undefinedTokens: [],
});

test('a disagreeing colour fallback in a fixture tree is a finding', () => {
  const { root, done } = policyTree(
    {
      'design-system/src/tokens/_colors.scss': ':root { --color-primary: #0472a8; }\n',
      'design-system/src/a.scss': '.a { color: var(--color-primary, #000000); }\n',
      'docs/evals/colour-fallback-baseline.json': BASELINE,
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

test('an empty token directory fires the sentinel floor, not a clean sweep', () => {
  const { root, done } = policyTree(
    {
      'design-system/src/a.scss': '.a { color: var(--color-primary, #000000); }\n',
      'docs/evals/colour-fallback-baseline.json': BASELINE,
    },
    { git: true },
  );
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty token directory must not report a clean sweep');
    assert.match(found[0], /no --color-\* tokens found under design-system\/src\/tokens/);
  } finally {
    done();
  }
});
