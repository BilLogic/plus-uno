import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { MANIFEST, run } from './check-token-intent.mjs';

function tree(tokens) {
  const root = mkdtempSync(join(tmpdir(), 'token-intent-'));
  mkdirSync(join(root, MANIFEST, '..'), { recursive: true });
  writeFileSync(join(root, MANIFEST), JSON.stringify({ tokens }));
  return root;
}

test('the real repo passes', () => {
  assert.deepEqual(run(), []);
});

test('a planned token with no intent fails, by name', () => {
  const findings = run({ repoRoot: tree([{ name: '--stack-md', tier: 'semantic', group: 'Ladder Semantics', value: 'var(--space-050)' }]) });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /--stack-md/);
});

test('a --ds- color token with an empty intent fails', () => {
  const findings = run({ repoRoot: tree([{ name: '--ds-text', tier: 'semantic', group: 'Color', value: '#000', intent: ' ' }]) });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /--ds-text/);
});

test('a primitive carrying an intent field fails, even a null one', () => {
  const findings = run({ repoRoot: tree([{ name: '--space-100', tier: 'primitive', group: 'Scale Primitives', value: '1rem', intent: null }]) });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /--space-100/);
});

test('a token no plan defines passes without intent: it is not planned, not missing', () => {
  const findings = run({ repoRoot: tree([{ name: '--color-legacy', tier: 'semantic', group: 'Legacy Color Tokens', value: '#fff' }]) });
  assert.deepEqual(findings, []);
});

test('a missing manifest is a finding, not a pass', () => {
  const root = mkdtempSync(join(tmpdir(), 'token-intent-'));
  assert.equal(run({ repoRoot: root }).length, 1);
});
