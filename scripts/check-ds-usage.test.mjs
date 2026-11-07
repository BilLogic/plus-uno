import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { inScope, tally } from './check-ds-usage.mjs';
import { RULES } from './lib/ds-usage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = 'scripts/lib/__fixtures__/ds-usage';
const cli = (...args) => spawnSync(process.execPath, ['scripts/check-ds-usage.mjs', ...args], { cwd: ROOT, encoding: 'utf8' });

test('a prototype with one escape per fail-level rule exits 1, naming file, line, column, rule and fix', () => {
  const out = cli(`${FIXTURES}/escaping`);
  assert.equal(out.status, 1);
  const failRules = Object.entries(RULES).filter(([, r]) => r.level === 'fail').map(([id]) => id);
  for (const rule of failRules) {
    assert.match(out.stderr, new RegExp(`escaping/src/App\\.jsx:\\d+:\\d+  ${rule}  `), rule);
  }
  assert.match(out.stderr, /-> did you mean `Button`\?/);
  assert.match(out.stderr, /see docs\/engineering\/ds-usage-rules\.md#dsno-unknown-component/);
});

test('a prototype that stays inside the design system exits 0', () => {
  const out = cli(`${FIXTURES}/clean`);
  assert.equal(out.status, 0, out.stderr);
});

test('--json prints the same findings as data', () => {
  const out = cli(`${FIXTURES}/escaping`, '--json');
  assert.equal(out.status, 1);
  const data = JSON.parse(out.stdout);
  assert.equal(data.files, 1);
  assert.ok(data.blocking.every((f) => f.file && f.line && f.col && f.rule && f.fix));
});

test('the whole scope passes against the recorded baseline, in under five seconds', () => {
  const started = Date.now();
  const out = cli('--all');
  assert.equal(out.status, 0, out.stderr);
  assert.ok(Date.now() - started < 5000, `took ${Date.now() - started}ms`);
});

test('scope: consumer code only, tests and stories skipped', () => {
  assert.ok(inScope('prototypes/live-app/src/App.jsx'));
  assert.ok(inScope('src/App.scss'));
  assert.ok(!inScope('design-system/src/components/x/X.jsx'));
  assert.ok(!inScope('prototypes/x/src/App.test.jsx'));
  assert.ok(!inScope('prototypes/x/node_modules/y/index.js'));
});

test('tally: fail-level findings per rule and file; warnings are not held', () => {
  const f = (rule, level, file) => ({ rule, level, file });
  assert.deepEqual(
    tally([f('ds/no-raw-literal', 'fail', 'a'), f('ds/no-raw-literal', 'fail', 'a'), f('ds/no-retired-name', 'warn', 'a')]),
    { 'ds/no-raw-literal a': 2 },
  );
});
