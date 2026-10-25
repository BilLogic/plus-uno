import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { COLOR_TOKEN_DIR, artifacts, run } from './generate-color-tokens.mjs';

test('the committed color token files match the active plan', () => {
  assert.deepEqual(run(), []);
});

test('drift: a missing or hand-edited file is a finding, and --check writes nothing', () => {
  const root = mkdtempSync(join(tmpdir(), 'color-tokens-'));
  try {
    assert.equal(run({ repoRoot: root }).length, artifacts().length);
    mkdirSync(join(root, COLOR_TOKEN_DIR), { recursive: true });
    for (const { path, content } of artifacts()) writeFileSync(join(root, path), content);
    assert.deepEqual(run({ repoRoot: root }), []);
    const [first] = artifacts();
    writeFileSync(join(root, first.path), `${first.content}/* edited */\n`);
    assert.deepEqual(run({ repoRoot: root }).map((f) => f.file), [first.path]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
