import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { run, summary } from './check-color-system.mjs';

const INPUTS = 'scripts/lib/color';

/** A fixture root holding a copy of the plans and the Atlassian reference, so a plan can be broken. */
function fixture(edit) {
  const root = mkdtempSync(join(tmpdir(), 'color-system-'));
  for (const rel of [`${INPUTS}/plans`, `${INPUTS}/atlassian-tokens.json`]) cpSync(join(REPO_ROOT, rel), join(root, rel), { recursive: true });
  const file = join(root, INPUTS, 'plans/plan-a.json');
  const plan = JSON.parse(readFileSync(file, 'utf8'));
  edit(plan);
  writeFileSync(file, JSON.stringify(plan));
  return root;
}

test('the repo passes, and the green line says what was checked', () => {
  assert.deepEqual(run(), []);
  assert.match(summary(), /2 plans x 518 tokens x 4 modes/);
});

test('a plan whose body text loses contrast fails, naming the check, plan and mode', () => {
  const root = fixture((plan) => {
    plan.neutral.light['1000'] = '#bcbab6';
  });
  try {
    const messages = run({ repoRoot: root }).map((f) => f.message);
    assert.ok(messages.includes('contrast pairs, Plan A: color.text on elevation.surface, light: 1.94:1 < 4.5:1'), messages.slice(0, 3).join('\n'));
    assert.ok(messages.every((m) => !m.includes('Plan B')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
