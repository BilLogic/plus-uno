import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { artifacts, run } from './export-kit-art.mjs';

test('committed kit art SVGs match a fresh export and contain resolved light/dark colors', () => {
  assert.deepEqual(run(), []);

  const exported = artifacts();
  assert.equal(exported.length, 4);

  const bySuffix = (suffix) => exported.find((entry) => entry.path.endsWith(suffix));
  const summaryLight = bySuffix('session-summary-light.svg');
  const summaryDark = bySuffix('session-summary-dark.svg');
  const partnerLight = bySuffix('partner-mark-light.svg');
  const partnerDark = bySuffix('partner-mark-dark.svg');

  assert.ok(summaryLight && summaryDark && partnerLight && partnerDark);
  assert.notEqual(summaryLight.content, summaryDark.content);
  assert.notEqual(partnerLight.content, partnerDark.content);
  for (const entry of exported) {
    assert.doesNotMatch(entry.content, /var\(--/);
  }
  assert.match(summaryLight.content, /viewBox="0 0 160 90"/);
  assert.match(summaryDark.content, /viewBox="0 0 160 90"/);
  assert.match(partnerLight.content, /viewBox="0 0 64 64"/);
  assert.match(partnerDark.content, /viewBox="0 0 64 64"/);
});

test('run() fails when an exported kit SVG drifts from a fresh export', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-art-check-'));
  try {
    fs.cpSync(path.resolve('design-system/src/tokens'), path.join(tmp, 'design-system/src/tokens'), { recursive: true });
    for (const { path: rel, content } of artifacts()) {
      const abs = path.join(tmp, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, rel.endsWith('session-summary-dark.svg') ? `${content}<!-- drifted -->${String.fromCharCode(10)}` : content);
    }
    const findings = run({ repoRoot: tmp });
    assert.equal(findings.length, 1);
    assert.match(findings[0].file, /session-summary-dark\.svg/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
