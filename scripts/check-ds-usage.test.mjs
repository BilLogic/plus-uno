import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPO_ROOT, contextOf, escapes, filesUnder, inScope, judge, scopeFiles, tally } from './check-ds-usage.mjs';
import fs from 'node:fs';
import os from 'node:os';
import { RULES, escapesIn } from './lib/ds-usage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = 'scripts/lib/__fixtures__/ds-usage';
const cli = (...args) => spawnSync(process.execPath, ['scripts/check-ds-usage.mjs', ...args], { cwd: ROOT, encoding: 'utf8' });

test('a prototype with one escape per fail-level rule exits 1, naming file, line, column, rule and fix', () => {
  const out = cli(`${FIXTURES}/escaping`);
  assert.equal(out.status, 1);
  const failRules = Object.entries(RULES).filter(([id, r]) => r.level === 'fail' && id !== 'ds/no-raw-motion').map(([id]) => id);
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
  assert.ok(inScope('prototypes/x/src/main.jsx'));
  assert.ok(inScope('prototypes/x/src/App.scss'));
  assert.ok(!inScope('src/App.jsx'));
  assert.ok(!inScope('design-system/src/components/x/X.jsx'));
  assert.ok(!inScope('prototypes/x/src/App.test.jsx'));
  assert.ok(!inScope('prototypes/x/node_modules/y/index.js'));
});

test('DS styles are in scope and raw motion fails while semantic motion passes', () => {
  const ctx = contextOf(REPO_ROOT);
  for (const kind of ['components', 'patterns', 'templates']) {
    const file = `design-system/src/${kind}/Example/Example.scss`;
    assert.ok(inScope(file));
    for (const declaration of [
      'transition: all 0.2s ease',
      'animation: pulse 150ms ease-in-out infinite',
      'transition-timing-function: cubic-bezier(0, 0, 1, 1)',
      'animation-duration: .5s',
    ]) {
      const found = escapesIn({ path: file, text: `.example { ${declaration}; }` }, ctx);
      assert.equal(found.length, 1, declaration);
      assert.equal(found[0].rule, 'ds/no-raw-motion');
      assert.equal(found[0].level, 'fail');
    }
    const clean = `.example {
      transition: transform var(--ds-motion-spatial-fast-duration) var(--ds-motion-spatial-fast);
      animation: pulse var(--ds-motion-loop-duration) var(--ds-motion-loop) infinite alternate;
    }`;
    assert.deepEqual(escapesIn({ path: file, text: clean }, ctx), []);
  }
});

test('an injected stylesheet fixture blocks the usage gate, then passes after migration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-motion-'));
  const rel = 'design-system/src/components/Example/Example.scss';
  const file = path.join(root, rel);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '.example { transition: all 0.2s ease; }');
    const check = () => judge(REPO_ROOT, escapes(root, scopeFiles(root), REPO_ROOT), { held: true });
    assert.equal(check().blocking[0]?.rule, 'ds/no-raw-motion');
    fs.writeFileSync(file, '.example { transition: color var(--ds-motion-appearance-fast-duration) var(--ds-motion-appearance-fast); }');
    assert.deepEqual(check().blocking, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('tally: fail-level findings per rule and file; warnings are not held', () => {
  const f = (rule, level, file) => ({ rule, level, file });
  assert.deepEqual(
    tally([f('ds/no-raw-literal', 'fail', 'a'), f('ds/no-raw-literal', 'fail', 'a'), f('ds/no-retired-name', 'warn', 'a')]),
    { 'ds/no-raw-literal a': 2 },
  );
});

test('outside a git checkout, the files on disk stand in for the tracked list', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-usage-nogit-'));
  try {
    for (const rel of ['prototypes/a/src/App.jsx', 'prototypes/a/node_modules/x.js', 'prototypes/.hidden/b.jsx', 'src/c.scss']) {
      fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), '');
    }
    assert.deepEqual(filesUnder(root, ['prototypes', 'src']), ['prototypes/a/src/App.jsx', 'src/c.scss']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the real facts hold patterns: invented name, wrong prop and wrong value fail; valid use passes', () => {
  const ctx = contextOf(REPO_ROOT);
  const rules = (text) => escapesIn({ path: 'prototypes/x/src/App.jsx', text }, ctx).map((f) => f.rule);
  const head = "import { Frame, PatternCard, PatternSection } from '@/patterns';\n";
  assert.deepEqual(rules(head + '<Frame width="reading"><PatternSection><PatternCard title="x" padding="md" /></PatternSection></Frame>'), []);
  assert.deepEqual(rules("import { PatternCardd } from '@/patterns';"), ['ds/no-unknown-component']);
  assert.deepEqual(rules(head + '<PatternCard heading="x" />'), ['ds/no-unknown-prop']);
  assert.deepEqual(rules(head + '<PatternCard padding="xl" />'), ['ds/no-unknown-prop']);
  assert.deepEqual(rules(head + '<Frame width="wide" />'), ['ds/no-unknown-prop']);
});
