/**
 * Tests for the one gate that runs on `pull_request`.
 *
 * `check:harness` was the last untested script in this harness, which is the
 * defect #191 named in every other script: a guard nobody has watched fail is a
 * guard nobody knows works. The four things asserted here are the four the
 * runner decides — a legacy check's exit code, a findings check's exit code and
 * banner, the completeness assertion, and the agreement between the registry
 * and the three generated blocks.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  ALL,
  CHECKS,
  EXCLUDED,
  WORKFLOW_STEPS,
  byName,
  rootCheckRows,
  triggersOf,
} from './checks.registry.mjs';
import * as nodeFloor from './check-node-floor.mjs';
import * as registryGenerator from './generate-check-scripts.mjs';
import { npmArgs, orphans, orphansInRepo, runAll, runCheck } from './harness-runner.mjs';
import { exitCodeFor, renderFindings } from './lib/findings.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Two fake checks. Neither exists on disk: `load` is injected, which is the
// point of taking it as a dependency — the runner's decisions are testable
// without a fixture package.json or a real sub-process.
const PASSING = { name: 'check:fake-pass', pkg: 'root', module: 'fake/pass.mjs', guards: 'nothing' };
const FAILING = {
  name: 'check:fake-findings',
  pkg: 'root',
  module: 'fake/findings.mjs',
  guards: 'nothing',
};

const FINDINGS = [
  { file: 'docs/a.md', line: 12, message: 'says Tier 1.', severity: 'error' },
  { message: 'and one finding with no location.', severity: 'error' },
];

const fakeLoad = (modulePath) => {
  if (modulePath === PASSING.module) return Promise.resolve({ run: () => [] });
  if (modulePath === FAILING.module) {
    return Promise.resolve({ run: () => FINDINGS, REMEDY: '  do the thing' });
  }
  return Promise.resolve({});
};

test('a findings check that returns nothing passes, and says so in one line', async () => {
  const result = await runCheck(PASSING, { repoRoot: REPO_ROOT, load: fakeLoad });
  assert.equal(result.ok, true);
  assert.equal(result.output, '✓ check:fake-pass — no findings');
  assert.equal(result.invocation, 'node fake/pass.mjs');
});

test('a findings check that returns findings fails, and the banner names each one', async () => {
  const result = await runCheck(FAILING, { repoRoot: REPO_ROOT, load: fakeLoad });
  assert.equal(result.ok, false);
  assert.match(result.output, /^✗ check:fake-findings — 2 finding\(s\)$/m);
  assert.match(result.output, /docs\/a\.md:12 {2}says Tier 1\./);
  assert.match(result.output, /and one finding with no location\./);
  assert.match(result.output, /do the thing/);
});

test('warnings are printed and do not fail the check', () => {
  const warned = [{ message: 'worth saying, not worth blocking.', severity: 'warning' }];
  assert.equal(exitCodeFor(warned), 0);
  assert.match(renderFindings('check:x', warned), /\(warning\) worth saying/);
});

test('a legacy check is spawned and read by its exit code, unchanged', async () => {
  const calls = [];
  const spawn = (args) => {
    calls.push(args);
    return { status: 1, stdout: 'out\n', stderr: 'err' };
  };
  const row = { name: 'check:legacy', pkg: 'root', guards: 'nothing' };
  const result = await runCheck(row, { repoRoot: REPO_ROOT, spawn });
  assert.deepEqual(calls, [['run', '--silent', 'check:legacy']]);
  assert.equal(result.ok, false);
  assert.equal(result.output, 'out\nerr');
  assert.equal(result.invocation, 'npm run --silent check:legacy');

  const bot = { name: 'check:legacy', pkg: 'bot', guards: 'nothing' };
  assert.deepEqual(npmArgs(bot), ['--prefix', 'agents/uno-bot', 'run', '--silent', 'check:legacy']);
});

test('a row whose module exports no run() falls back to the spawn and says so', async () => {
  const row = { name: 'check:mislabelled', pkg: 'root', module: 'fake/empty.mjs', guards: 'x' };
  const result = await runCheck(row, {
    repoRoot: REPO_ROOT,
    load: fakeLoad,
    spawn: () => ({ status: 0, stdout: 'ran the script', stderr: '' }),
  });
  assert.equal(result.ok, true);
  assert.match(result.output, /exports no run\(\)/);
  assert.match(result.output, /ran the script/);
});

test('the composite reports every failure, not the first', async () => {
  const seen = [];
  const { failures, total } = await runAll({
    repoRoot: REPO_ROOT,
    rows: [FAILING, PASSING, FAILING],
    load: fakeLoad,
    onResult: (row) => seen.push(row.name),
  });
  assert.equal(total, 3);
  assert.deepEqual(seen, ['check:fake-findings', 'check:fake-pass', 'check:fake-findings']);
  assert.equal(failures.length, 2);
});

test('an unregistered check:* fails the completeness assertion', () => {
  const manifests = [
    { label: 'package.json', scripts: ['check:glossary', 'check:brand-new', 'dev', 'build'] },
  ];
  const found = orphans(manifests, new Set(['check:glossary']));
  assert.deepEqual(found, ['check:brand-new  (package.json)']);
});

test('a registered name and a non-check script are both complete', () => {
  const manifests = [{ label: 'agents/uno-bot/package.json', scripts: ['check:secrets', 'tail'] }];
  assert.deepEqual(orphans(manifests, new Set(['check:secrets'])), []);
});

test('this repo has no orphan checks', () => {
  assert.deepEqual(orphansInRepo(REPO_ROOT), []);
});

test('every registry row carries the columns its readers need', () => {
  for (const row of ALL) {
    assert.ok(row.name, 'a row has no name');
    assert.ok(row.script, `${row.name} has no script`);
    assert.ok(['root', 'bot'].includes(row.pkg), `${row.name} has pkg ${row.pkg}`);
    assert.ok(triggersOf(row).length, `${row.name} has no trigger`);
    for (const trigger of triggersOf(row)) {
      assert.ok(
        ['pull_request', 'sweep', 'storybook-gate', 'deploy'].includes(trigger),
        `${row.name} has unknown trigger '${trigger}'`,
      );
    }
  }
  for (const row of CHECKS) assert.ok(row.guards, `${row.name} is composed with no guards prose`);
  for (const row of EXCLUDED) assert.ok(row.reason, `${row.name} is excluded with no reason`);
  assert.ok(rootCheckRows().length >= CHECKS.length - 6, 'the package.json block looks truncated');
  assert.ok(WORKFLOW_STEPS.length > 0);
});

test('the generated blocks match the registry', () => {
  const found = registryGenerator.run();
  assert.deepEqual(
    found.map((f) => `${f.file ?? ''} ${f.message}`),
    [],
  );
});

test('drift in a generated block is visible: an edited package.json no longer renders itself', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8');
  const tampered = text.replace(
    '"check:glossary": "node scripts/check-glossary.mjs"',
    '"check:glossary": "node scripts/check-glossary.mjs --oops"',
  );
  assert.notEqual(tampered, text, 'the fixture edit found nothing to edit');
  assert.notEqual(registryGenerator.renderPackageJson(tampered), tampered);
  // …and rendering restores exactly the committed bytes.
  assert.equal(registryGenerator.renderPackageJson(tampered), text);
});

test('the migrated example check answers the findings interface', async () => {
  assert.equal(typeof nodeFloor.run, 'function');
  assert.equal(byName('check:node-floor').module, 'scripts/check-node-floor.mjs');
  assert.deepEqual(nodeFloor.run({ repoRoot: REPO_ROOT }), []);

  // An empty tree has no .nvmrc, which is a finding rather than a crash — and it
  // comes back as data, so the runner is what decides the exit code.
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'node-floor-'));
  try {
    const found = nodeFloor.run({ repoRoot: empty });
    assert.ok(found.length >= 1);
    assert.match(found[0].message, /\.nvmrc is missing/);
    const result = await runCheck(byName('check:node-floor'), {
      repoRoot: REPO_ROOT,
      load: () => Promise.resolve({ run: () => found, REMEDY: nodeFloor.REMEDY }),
    });
    assert.equal(result.ok, false);
    assert.match(result.output, /✗ check:node-floor/);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});
