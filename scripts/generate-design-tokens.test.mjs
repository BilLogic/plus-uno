import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { artifacts, run } from './generate-design-tokens.mjs';
import { LEGACY_ALIASES } from './lib/tokens/plan.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';

test('the committed deep-foundation token files match the plan', () => {
  assert.deepEqual(run(), []);
});

test('drift: a missing or hand-edited file is a finding, and --check writes nothing', () => {
  const root = mkdtempSync(join(tmpdir(), 'design-tokens-'));
  try {
    assert.equal(run({ repoRoot: root }).length, artifacts().length);
    for (const { path, content } of artifacts()) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    assert.deepEqual(run({ repoRoot: root }), []);
    const [first] = artifacts();
    writeFileSync(join(root, first.path), `${first.content}/* edited */\n`);
    assert.deepEqual(run({ repoRoot: root }).map((f) => f.file), [first.path]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('no role token is declared twice', () => {
  const { content: roles } = artifacts().find(({ path }) => path.endsWith('_roles.scss'));
  const names = new Set();
  for (const [, name] of roles.matchAll(tokenDeclarationPattern())) {
    assert.ok(!names.has(name), `${name} is declared twice`);
    names.add(name);
  }
  assert.ok(names.size > 0);
});

test('motion durations are zeroed under reduced motion, exactly the set declared at :root', () => {
  const { content: motion } = artifacts().find(({ path }) => path.endsWith('_motion.scss'));
  const [rootBlock, reducedBlock] = motion.split('@media (prefers-reduced-motion: reduce)');
  const rootDurations = [...rootBlock.matchAll(/--motion-duration-[a-z]+(?=:)/g)].map((m) => m[0]);
  const reducedDurations = [...reducedBlock.matchAll(/--motion-duration-[a-z]+(?=:)/g)].map((m) => m[0]);
  assert.ok(rootDurations.length > 0);
  assert.deepEqual([...reducedDurations].sort(), [...rootDurations].sort());
  assert.match(reducedBlock, /0ms/);
});

test('every legacy alias target is a real role token', () => {
  const { content: roles } = artifacts().find(({ path }) => path.endsWith('_roles.scss'));
  for (const { role } of LEGACY_ALIASES) {
    assert.match(roles, new RegExp(`${role}:`), `${role} is not declared in _roles.scss`);
  }
});
