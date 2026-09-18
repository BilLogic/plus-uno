/**
 * Tests for the one gate that runs on `pull_request`.
 *
 * `check:harness` was the last untested script in this harness, which is the
 * defect #191 named in every other script: a guard nobody has watched fail is a
 * guard nobody knows works. What is asserted here is what the runner decides —
 * a findings check's exit code and banner, a `kind: 'spawn'` row's exit code,
 * the refusal to run a row that declares neither (#509), the completeness
 * assertion, and the agreement between the registry and the three generated
 * blocks.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

import {
  ALL,
  CHECKS,
  DEPLOY_CHAIN,
  EXCLUDED,
  WORKFLOW_STEPS,
  byName,
  rootCheckRows,
  triggersOf,
} from './checks.registry.mjs';
import * as nodeFloor from './check-node-floor.mjs';
import * as registryGenerator from './generate-check-scripts.mjs';
import {
  checkFiles,
  namedFiles,
  npmArgs,
  orphans,
  orphansInRepo,
  runAll,
  runCheck,
  unboundCheckFiles,
} from './harness-runner.mjs';
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

test("a kind: 'spawn' check is spawned and read by its exit code", async () => {
  const calls = [];
  const spawn = (args) => {
    calls.push(args);
    return { status: 1, stdout: 'out\n', stderr: 'err' };
  };
  const row = { name: 'check:browser', pkg: 'root', kind: 'spawn', guards: 'nothing' };
  const result = await runCheck(row, { repoRoot: REPO_ROOT, spawn });
  assert.deepEqual(calls, [['run', '--silent', 'check:browser']]);
  assert.equal(result.ok, false);
  assert.equal(result.output, 'out\nerr');
  assert.equal(result.invocation, 'npm run --silent check:browser');

  const bot = { name: 'check:browser', pkg: 'bot', kind: 'spawn', guards: 'nothing' };
  assert.deepEqual(npmArgs(bot), ['--prefix', 'agents/uno-bot', 'run', '--silent', 'check:browser']);
});

test('a row that declares neither kind fails, rather than being spawned by default', async () => {
  // This is the whole of what #509 removed. While the runner spawned an
  // undeclared row, the registry's silence carried a decision — and a reader
  // could not tell a check that had been thought about from one that had not.
  let spawned = 0;
  const result = await runCheck(
    { name: 'check:undeclared', pkg: 'root', guards: 'nothing' },
    {
      repoRoot: REPO_ROOT,
      spawn: () => {
        spawned += 1;
        return { status: 0, stdout: '', stderr: '' };
      },
    },
  );
  assert.equal(spawned, 0, 'an incomplete row must not be run on a guess');
  assert.equal(result.ok, false);
  assert.match(result.output, /declares neither a `module` nor `kind: 'spawn'`/);
});

test("every registry row is a module on the findings interface or a kind: 'spawn' with a reason", () => {
  for (const row of ALL) {
    if (row.module) {
      assert.ok(!row.kind, `${row.name} declares both a module and a kind`);
      assert.ok(
        fs.existsSync(path.join(REPO_ROOT, row.module)),
        `${row.name} declares module ${row.module}, which does not exist`,
      );
      continue;
    }
    assert.equal(row.kind, 'spawn', `${row.name} declares neither a module nor kind: 'spawn'`);
    assert.ok(row.spawnReason, `${row.name} is spawned with no reason`);
  }
  // The point of the migration, as a number: the findings interface is the
  // majority case, not the exception it was when #508 built it.
  const findings = ALL.filter((row) => row.module);
  assert.ok(findings.length > ALL.length / 2, `only ${findings.length} of ${ALL.length} rows return findings`);
});

test('every findings module answers the interface its row claims for it', async () => {
  for (const row of ALL.filter((r) => r.module)) {
    const mod = await import(pathToFileURL(path.join(REPO_ROOT, row.module)).href);
    assert.equal(typeof mod.run, 'function', `${row.name}: ${row.module} exports no run()`);
  }
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

test('a check-*.mjs on disk that no row names is an orphan too', () => {
  const named = namedFiles([
    { name: 'check:kept', script: 'node scripts/check-kept.mjs', pkg: 'root' },
  ]);
  const found = unboundCheckFiles(['scripts/check-kept.mjs', 'scripts/check-stray.mjs'], named);
  assert.equal(found.length, 1);
  assert.match(found[0], /scripts\/check-stray\.mjs/);
  assert.match(found[0], /no registry row names it/);
});

test("a row names its file through `module` as well as through `script`", () => {
  const named = namedFiles([
    { name: 'check:agent', script: 'node scripts/generate-agent.js --check', pkg: 'root' },
    { name: 'check:x', script: 'npm run something', pkg: 'root', module: 'scripts/check-x.mjs' },
  ]);
  assert.ok(named.has('scripts/generate-agent.js'));
  assert.ok(named.has('scripts/check-x.mjs'));
});

test("a Worker row's `scripts/…` is read against agents/uno-bot, not the repo root", () => {
  const named = namedFiles([
    { name: 'check:secrets', script: 'node scripts/check-secrets.mjs', pkg: 'bot' },
  ]);
  assert.ok(named.has('agents/uno-bot/scripts/check-secrets.mjs'));
  assert.deepEqual(unboundCheckFiles(['agents/uno-bot/scripts/check-secrets.mjs'], named), []);
});

test('the test beside a check is not itself a check', () => {
  const files = checkFiles(REPO_ROOT);
  assert.ok(files.length > 20, 'the scan found almost nothing — it is looking in the wrong place');
  assert.deepEqual(files.filter((file) => file.includes('.test.')), []);
  assert.ok(files.includes('scripts/check-doc-links.mjs'));
  assert.ok(files.includes('agents/uno-bot/scripts/check-secrets.mjs'));
});

test('this repo has no orphan checks, by name or by file', () => {
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

// ---------------------------------------------------------------------------
// the `baseline` column (#602)
//
// The registry asserts three things about a `baseline:` row: the record parses
// on the shape it declares, the check that declares it reaches it THROUGH ITS
// IMPORTS, and the `--update` its shape row advertises is a flag the check
// really offers — or, where the row says `command: null`, that it offers none.
// Each is watched failing below, because the live tree passes all three.
// ---------------------------------------------------------------------------

const BASELINE_ROWS = ALL.filter((row) => row.baseline);
const rootScripts = () => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')).scripts;

test('every baseline row reaches its record and offers exactly the flag its table names', () => {
  assert.equal(BASELINE_ROWS.length, 12);
  for (const row of BASELINE_ROWS) {
    assert.deepEqual(
      registryGenerator.baselineFindings(row, rootScripts()).map((f) => f.message),
      [],
      row.name,
    );
  }
});

test('a row pointing at a record its check never opens fails, however the check is named', () => {
  const row = { ...byName('check:glossary'), baseline: 'docs/evals/focus-ring.json' };
  const messages = registryGenerator.baselineFindings(row, rootScripts()).map((f) => f.message);
  assert.ok(
    messages.some((m) => /opens\s+through scripts\/lib\/ratchet\.mjs/.test(m)),
    messages.join('\n'),
  );
});

test('the reach is the whole import closure: the fallback pair opens its record one hop away', () => {
  // The case the old basename search passed by luck. `check-colour-fallbacks.mjs`
  // names the file in the `Family` literal it hands over and opens nothing; the
  // `openRatchet`, the read, the stale sweep and the write are all in
  // `scripts/lib/fallback-check.mjs`. So the assertion has to follow the hop —
  // and it must also not be satisfied by the entry's own filename alone.
  const row = byName('check:colour-fallbacks');
  const entry = fs.readFileSync(path.join(REPO_ROOT, 'scripts/check-colour-fallbacks.mjs'), 'utf8');
  assert.ok(entry.includes(row.baseline), 'the fixture assumes the entry still names the record');
  assert.equal(entry.includes('openRatchet'), false, 'the entry is not where the record is opened');
  assert.deepEqual(registryGenerator.baselineFindings(row, rootScripts()), []);
});

test('a hand-maintained record whose check offers --update fails, and the four that do not pass', () => {
  for (const name of ['check:button-contrast', 'check:focus-ring', 'check:icon-button-name', 'check:intent-roles']) {
    assert.deepEqual(registryGenerator.baselineFindings(byName(name), rootScripts()), [], name);
  }
  // `focus-ring.json` is surveyed `command: null` — the value of an entry in it
  // IS the argument for it. Read by a check that does offer the flag, that is a
  // finding: a `--update` on a record whose bar is zero is a way to make a new
  // failure quiet.
  const row = { ...byName('check:focus-ring'), script: 'node scripts/check-glossary.mjs' };
  const messages = registryGenerator.baselineFindings(row, rootScripts()).map((f) => f.message);
  assert.ok(messages.some((m) => /offers --update in its fallThrough slot/.test(m)), messages.join('\n'));
});

test("glossary's --update is asserted in the slot it is IN, not in the terminal one", () => {
  // #610: `flags` is terminal, `fallThrough` prints and then still gates, and
  // which one a flag belongs in is a reading of what it does. Demanding the
  // terminal slot here would move this one and quietly stop the check gating.
  const source = fs.readFileSync(path.join(REPO_ROOT, 'scripts/check-glossary.mjs'), 'utf8');
  assert.match(source, /fallThrough: \{ '--update'/);
  assert.deepEqual(registryGenerator.baselineFindings(byName('check:glossary'), rootScripts()), []);
});

test('a record whose flag is advertised and offered nowhere fails', () => {
  const row = { ...byName('check:text-contrast'), script: 'node scripts/check-focus-ring.mjs' };
  const messages = registryGenerator.baselineFindings(row, rootScripts()).map((f) => f.message);
  assert.ok(messages.some((m) => /offers --update — in either/.test(m)), messages.join('\n'));
});

test('a re-record line naming an npm script nobody has is a remedy nobody can type', () => {
  const messages = registryGenerator
    .baselineFindings(byName('check:colour-fallbacks'), {})
    .map((f) => f.message);
  assert.ok(messages.some((m) => /no check:colour-fallbacks script exists/.test(m)), messages.join('\n'));
});

test('a record that will not parse on its declared shape is reported, never read as empty', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-shape-'));
  try {
    const row = byName('check:focus-ring');
    fs.mkdirSync(path.join(root, 'docs/evals'), { recursive: true });
    // The declared container is an object of reasons. As an array it reads as
    // no entries at all, and an empty baseline is a green ratchet.
    fs.writeFileSync(path.join(root, row.baseline), JSON.stringify({ note: 'x', exceptions: [] }));
    const messages = registryGenerator
      .baselineFindings(row, rootScripts(), { repoRoot: root })
      .map((f) => f.message);
    assert.ok(messages.some((m) => /cannot be read as the baseline shape it declares/.test(m)), messages.join('\n'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the one check that still parses its own record is named, and the exemption cannot outlive it', () => {
  const row = byName('check:storybook');
  // Unexempted, it is a finding — which is the assertion, not a quirk: #600
  // listed the a11y baseline and migrated the other seven.
  const unexempt = registryGenerator
    .baselineFindings(row, rootScripts(), { exemptions: new Map() })
    .map((f) => f.message);
  assert.ok(unexempt.some((m) => /parses the record itself/.test(m)), unexempt.join('\n'));
  // Exempted, it is still held to naming the record.
  assert.deepEqual(registryGenerator.baselineFindings(row, rootScripts()), []);
  // And an exemption for a check that HAS migrated is itself a finding.
  const stale = registryGenerator
    .baselineFindings(byName('check:glossary'), rootScripts(), {
      exemptions: new Map([['check:glossary', 'a reason that has stopped being true']]),
    })
    .map((f) => f.message);
  assert.ok(stale.some((m) => /Delete the exemption/.test(m)), stale.join('\n'));
});

// ---------------------------------------------------------------------------
// the `floors` column (#613)
//
// Sentinel floors — the minimum file / rule / component / variable counts and
// the maximum ages — are the same class of datum as a baseline. The registry
// declares each one, and asserts the number is the one the check enforces.
// A floor that lives only as a private `const` in the check is a finding.
// ---------------------------------------------------------------------------

test('a sentinel the check enforces but the row does not declare is a finding', () => {
  const row = { ...byName('check:focus-ring') };
  delete row.floors;
  const messages = registryGenerator.floorFindings(row).map((f) => f.message);
  assert.ok(
    messages.some((m) => /MIN_FILES = 150 as a private constant/.test(m)),
    messages.join('\n'),
  );
  assert.ok(
    messages.some((m) => /MIN_RULES = 60 as a private constant/.test(m)),
    messages.join('\n'),
  );
});

test('a floor the row declares that the check does not enforce is a finding', () => {
  const row = { ...byName('check:focus-ring'), floors: { MIN_FILES: 150, MIN_RULES: 60, MIN_WIDGETS: 3 } };
  const messages = registryGenerator.floorFindings(row).map((f) => f.message);
  assert.ok(
    messages.some((m) => /floors\.MIN_WIDGETS = 3, which .+ never enforces/.test(m)),
    messages.join('\n'),
  );
});

test('a declared floor that disagrees with the number the check enforces is a finding', () => {
  const row = { ...byName('check:focus-ring'), floors: { MIN_FILES: 1, MIN_RULES: 60 } };
  const messages = registryGenerator.floorFindings(row).map((f) => f.message);
  assert.ok(
    messages.some((m) => /floors\.MIN_FILES = 1, but .+ enforces 150/.test(m)),
    messages.join('\n'),
  );
});

test('every sentinel floor is on its registry row and matches what the check enforces', () => {
  const found = ALL.flatMap((row) => registryGenerator.floorFindings(row));
  assert.deepEqual(
    found.map((f) => `${f.file ?? ''} ${f.message}`),
    [],
  );
  assert.ok(
    ALL.some((row) => row.floors),
    'at least one row declares floors — an empty column is the defect this asserts',
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

// ---------------------------------------------------------------------------
// The other two triggers: `pull_request` and `deploy`
//
// `sweep` and `storybook-gate` have been asserted against WORKFLOW_STEPS since
// the registry existed. These two were honoured by hand — the pull-request
// workflows are not generated and nothing compared their run lines to the
// rows, and the Worker's deploy chain agreed with its seven `deploy` rows only
// because someone kept both lists in step.
// ---------------------------------------------------------------------------

test('a workflow\'s run lines are read as npm script names, installs excluded', () => {
  const runs = registryGenerator.runsIn(
    [
      '      - name: Install deps',
      '        run: npm ci',
      '      - name: npm run check:harness',
      '        run: npm run check:harness',
      '      - name: two of them',
      '        run: |',
      '          npm run check:glossary',
      '          npm test',
      '      - name: not npm at all',
      '        run: node scripts/verify-deployed-cli.mjs',
    ].join('\n'),
  );
  assert.deepEqual(runs, ['check:harness', 'check:glossary', 'test']);
});

test("a row declaring 'pull_request' that no workflow reaches fails", () => {
  const rows = [
    { name: 'check:harness', pkg: 'root', trigger: 'pull_request' },
    { name: 'check:orphaned', pkg: 'root', trigger: 'pull_request' },
  ];
  const found = registryGenerator.pullRequestFindings(
    new Map([['.github/workflows/check-harness.yml', ['check:harness']]]),
    { rows, composed: [] },
  );
  assert.equal(found.length, 1);
  assert.match(found[0].message, /check:orphaned declares trigger 'pull_request'/);
});

test('a composed row is reached through the composite, and so is a stepOf row', () => {
  const composite = { name: 'check:harness', pkg: 'root', trigger: 'pull_request' };
  const composed = { name: 'check:composed', pkg: 'root', trigger: 'pull_request' };
  const parent = { name: 'check:agent', pkg: 'root', trigger: 'pull_request' };
  const child = {
    name: 'check:index',
    pkg: 'root',
    trigger: 'pull_request',
    stepOf: 'check:agent',
    reason: 'step 4 of check:agent.',
  };
  const found = registryGenerator.pullRequestFindings(
    new Map([['.github/workflows/check-harness.yml', ['check:harness']]]),
    { rows: [composite, composed, parent, child], composed: [composed, parent] },
  );
  assert.deepEqual(found, []);
});

test('a pull-request workflow that runs something the registry does not hold fails', () => {
  const found = registryGenerator.pullRequestFindings(
    new Map([['.github/workflows/uno-bot-checks.yml', ['check:invented']]]),
    { rows: [], composed: [] },
  );
  assert.equal(found.length, 1);
  assert.match(found[0].message, /check:invented.*not a registry row/);
});

test("a pull-request step whose row does not declare 'pull_request' fails", () => {
  const row = { name: 'check:storybook', pkg: 'root', trigger: 'storybook-gate' };
  const found = registryGenerator.pullRequestFindings(
    new Map([['.github/workflows/check-harness.yml', ['check:storybook']]]),
    { rows: [row], composed: [] },
  );
  assert.equal(found.length, 1);
  assert.match(found[0].message, /add 'pull_request'/);
});

test('this repo\'s pull-request workflows and the trigger column agree', () => {
  assert.deepEqual(registryGenerator.pullRequestFindings(registryGenerator.pullRequestRuns()), []);
});

test('the deploy chain the manifest holds is the one the registry states', () => {
  assert.deepEqual(registryGenerator.deployChainFindings(), []);
  // …and every gate of it is a row carrying the trigger.
  const gates = DEPLOY_CHAIN.filter((entry) => entry.runs).map((entry) => entry.runs);
  assert.deepEqual(
    gates.slice().sort(),
    ALL.filter((row) => triggersOf(row).includes('deploy'))
      .map((row) => row.name)
      .sort(),
  );
});

test('a deploy chain that has drifted from the registry fails', () => {
  const found = registryGenerator.deployChainFindings(
    'npm run typecheck && node scripts/deploy.mjs',
  );
  assert.equal(found.length, 1);
  assert.match(found[0].message, /deploy chain/);
});

test("a row declaring 'deploy' that the chain does not run fails", () => {
  const rows = [{ name: 'check:unreached', pkg: 'bot', trigger: 'deploy' }];
  const chain = [{ step: 'node scripts/deploy.mjs', notAGate: 'it is the deployment.' }];
  const found = registryGenerator.deployChainFindings('node scripts/deploy.mjs', { rows, chain });
  assert.equal(found.length, 1);
  assert.match(found[0].message, /check:unreached declares trigger 'deploy'/);
});

test("a chain gate whose row does not declare 'deploy' fails", () => {
  const rows = [{ name: 'check:fetch', pkg: 'bot', trigger: 'pull_request' }];
  const chain = [{ step: 'npm run check:fetch', runs: 'check:fetch' }];
  const found = registryGenerator.deployChainFindings('npm run check:fetch', { rows, chain });
  assert.equal(found.length, 1);
  assert.match(found[0].message, /add 'deploy'/);
});

test('a stepOf that names no row, or prose that disagrees with it, fails', () => {
  const rows = [
    { name: 'check:a', pkg: 'root', trigger: 'pull_request', stepOf: 'check:nobody' },
    {
      name: 'check:b',
      pkg: 'root',
      trigger: 'pull_request',
      stepOf: 'check:agent',
      reason: 'excluded because reasons.',
    },
    { name: 'check:agent', pkg: 'root', trigger: 'pull_request' },
    { name: 'check:harness', pkg: 'root', trigger: 'pull_request' },
  ];
  const messages = registryGenerator
    .pullRequestFindings(new Map([['.github/workflows/check-harness.yml', ['check:harness']]]), {
      rows,
      composed: [rows[2]],
    })
    .map((f) => f.message);
  assert.ok(messages.some((m) => /check:a declares stepOf 'check:nobody'/.test(m)));
  assert.ok(messages.some((m) => /check:b.*reason.*never names/.test(m)));
});
