import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { artifacts, run } from './export-kit-art.mjs';

test('committed kit art SVGs match a fresh export and contain resolved light/dark colors', () => {
  assert.deepEqual(run(), []);

  const [light, dark] = artifacts();
  assert.ok(light.path.endsWith('session-summary-light.svg'));
  assert.ok(dark.path.endsWith('session-summary-dark.svg'));
  assert.notEqual(light.content, dark.content);
  assert.doesNotMatch(light.content, /var\(--/);
  assert.doesNotMatch(dark.content, /var\(--/);
  assert.match(light.content, /viewBox="0 0 160 90"/);
  assert.match(dark.content, /viewBox="0 0 160 90"/);
});

test('run() fails when an exported kit SVG drifts from a fresh export', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-art-check-'));
  try {
    fs.cpSync(path.resolve('design-system/src/tokens'), path.join(tmp, 'design-system/src/tokens'), { recursive: true });
    for (const { path: rel, content } of artifacts()) {
      const abs = path.join(tmp, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, rel.includes('dark') ? `${content}<!-- drifted -->${String.fromCharCode(10)}` : content);
    }
    const findings = run({ repoRoot: tmp });
    assert.equal(findings.length, 1);
    assert.match(findings[0].file, /session-summary-dark\.svg/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
