import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { compare, DEFAULT_ARMS, LOOKUP_ARMS, lookupWiring, meteredIn, rescore, seedScore, SEEDED, ARMS, CHECKER_REMOVED, CONTROL_REMOVED, DENIED_READS, armDenies, a11y, a11ySummary, confined, reachedCheckout, readSet, SCENARIOS, TASKS, controlAgents, judgePrompt, options, parseJudge, prepare, resultOf, scenariosSha, score, summarize, usageOf } from './eval-ds-usage.mjs';
import { spawnSync } from 'node:child_process';

import { REPO_ROOT } from './lib/corpus.mjs';

test('every task has a brief, and the template and judge exist', () => {
  for (const task of TASKS) assert.ok(fs.existsSync(path.join(REPO_ROOT, SCENARIOS, task, 'BRIEF.md')), task);
  assert.ok(fs.existsSync(path.join(REPO_ROOT, SCENARIOS, 'frame-to-code', 'frame.png')));
  assert.match(judgePrompt().sha, /^[0-9a-f]{12}$/);
});

test('controlAgents keeps the title and Identity, without the harness or its design-system routes', () => {
  const out = controlAgents(fs.readFileSync(path.join(REPO_ROOT, 'AGENTS.md'), 'utf8'));
  assert.match(out, /^# plus-uno/);
  assert.match(out, /## Identity/);
  assert.match(out, /You are \*\*uno\*\*/);
  for (const gone of [/## Hard rules/, /## Skills/, /agent-views/, /uno-storybook/, /skills\//, /## Progressive loading/]) assert.doesNotMatch(out, gone);
});

test('prepare: control loses the harness, current keeps it, both get the task folder and lose the scenarios', () => {
  const into = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-test-'));
  try {
    const control = prepare({ ref: 'HEAD', arm: 'control', task: 'trap-missing-component', into: path.join(into, 'c') });
    for (const rel of CONTROL_REMOVED) assert.ok(!fs.existsSync(path.join(control.root, rel)), rel);
    assert.doesNotMatch(fs.readFileSync(path.join(control.root, 'AGENTS.md'), 'utf8'), /## Hard rules/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(control.root, '.claude/settings.json'), 'utf8')).hooks, undefined);
    assert.equal(JSON.parse(fs.readFileSync(path.join(control.root, 'package.json'), 'utf8')).scripts['check:ds-usage'], undefined);
    assert.ok(fs.existsSync(path.join(control.folder, 'BRIEF.md')));
    assert.ok(fs.existsSync(path.join(control.folder, 'src', 'main.jsx')));
    assert.ok(!fs.existsSync(path.join(control.root, 'docs/evals')));
    assert.ok(fs.existsSync(path.join(control.root, 'design-system/src/components/index.js')));

    const current = prepare({ ref: 'HEAD', arm: 'current', task: 'form-states', into: path.join(into, 'k') });
    assert.ok(fs.existsSync(path.join(current.root, 'design-system/agent-views/components.json')));
    assert.match(fs.readFileSync(path.join(current.root, 'AGENTS.md'), 'utf8'), /## Hard rules/);
    assert.ok(JSON.parse(fs.readFileSync(path.join(current.root, '.claude/settings.json'), 'utf8')).hooks);
  } finally {
    fs.rmSync(into, { recursive: true, force: true });
  }
});

const hookCommands = (root) => {
  const settings = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
  return Object.values(settings.hooks ?? {}).flat().flatMap((group) => group.hooks.map((h) => h.command));
};
const cursorCommands = (root) => Object.values(JSON.parse(fs.readFileSync(path.join(root, '.cursor/hooks.json'), 'utf8')).hooks).flat().map((h) => h.command);
const DS_HOOK = /ds-usage\/post-edit\.mjs/;

test('prepare: hook-off is current without the post-edit hook; the checker and the other hooks stay', () => {
  const into = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-hookoff-'));
  try {
    const { root } = prepare({ ref: 'HEAD', arm: 'hook-off', task: 'form-states', into });
    assert.ok(!hookCommands(root).some((c) => DS_HOOK.test(c)));
    assert.ok(!cursorCommands(root).some((c) => DS_HOOK.test(c)));
    assert.ok(hookCommands(root).some((c) => /uno-prototype/.test(c)), 'the uno-prototype gate stays');
    for (const rel of CHECKER_REMOVED) assert.ok(fs.existsSync(path.join(root, rel)), rel);
    assert.ok(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts['check:ds-usage']);
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /## Hard rules/);
  } finally {
    fs.rmSync(into, { recursive: true, force: true });
  }
});

test('prepare: checker-removed takes the checker out of the copy, and the hook still hands an escape back', () => {
  const into = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-nochecker-'));
  try {
    const { root, folder } = prepare({ ref: 'HEAD', arm: 'checker-removed', task: 'form-states', into });
    for (const rel of CHECKER_REMOVED) assert.ok(!fs.existsSync(path.join(root, rel)), rel);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts['check:ds-usage'], undefined);
    assert.ok(!cursorCommands(root).some((c) => DS_HOOK.test(c)));
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /## Hard rules/);
    assert.ok(fs.existsSync(path.join(root, 'design-system/agent-views/components.json')));

    const [command] = hookCommands(root).filter((c) => DS_HOOK.test(c));
    assert.ok(command.includes(REPO_ROOT), 'the hook runs from the eval checkout, outside the copy');
    const app = path.join(folder, 'src', 'App.jsx');
    const hook = () =>
      spawnSync('sh', ['-c', command], {
        input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: app } }),
        env: { ...process.env, CLAUDE_PROJECT_DIR: root },
        encoding: 'utf8',
      });
    fs.writeFileSync(app, "import StatusTag from '@/components/labels/StatusTag';\nexport default () => <StatusTag />;\n");
    const dirty = hook();
    assert.equal(dirty.status, 2, dirty.stderr);
    assert.match(dirty.stderr, /ds\/no-deep-import/);
    assert.ok(fs.existsSync(path.join(root, '.local/ds-usage-runs.jsonl')), 'the hook logs in the copy');
    fs.writeFileSync(app, "import { StatusTag } from '@/components';\nexport default () => <StatusTag />;\n");
    assert.equal(hook().status, 0);
  } finally {
    fs.rmSync(into, { recursive: true, force: true });
  }
});

test('armDenies: checker-removed denies the checker in the copy to Read and npm; other arms add nothing', () => {
  assert.deepEqual(armDenies('current', '/c'), []);
  assert.deepEqual(armDenies('hook-off', '/c'), []);
  const deny = armDenies('checker-removed', '/c');
  for (const rel of CHECKER_REMOVED) assert.ok(deny.includes(`Read(//c/${rel})`), rel);
  assert.ok(deny.includes('Bash(npm run check:ds-usage:*)'));
  assert.ok(JSON.parse(confined('/r', deny)).permissions.deny.includes('Bash(npm run check:ds-usage:*)'));
  assert.deepEqual(ARMS, ['control', 'current', 'hook-off', 'checker-removed', 'lookup']);
  assert.deepEqual(armDenies('lookup', '/c'), []);
});

test('score: escapes by rule from this checkout\'s rules; the untouched template scores zero', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-score-'));
  try {
    fs.cpSync(path.join(REPO_ROOT, SCENARIOS, '_template'), dir, { recursive: true });
    assert.deepEqual(score({ folder: dir, label: 'eval-x' }), { escapes: 0, warnings: 0, byRule: {}, warnByRule: {}, layoutFormula: null });
    fs.writeFileSync(path.join(dir, 'src', 'App.jsx'), "import { Buton } from '@/components';\nexport default () => <div style={{ padding: '12px' }} />;\n");
    const scored = score({ folder: dir, label: 'eval-x' });
    assert.deepEqual(scored.byRule, { 'ds/no-unknown-component': 1, 'ds/no-raw-literal': 1 });
    assert.deepEqual(scored.warnByRule, { 'ds/page-starts-from-pattern': 1 });
    assert.equal(scored.layoutFormula, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('score: warnings are counted by rule beside the fail-level escapes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-warn-'));
  try {
    fs.cpSync(path.join(REPO_ROOT, SCENARIOS, '_template'), dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'App.jsx'), "import { Button } from '@/components';\nexport default () => <div style={{ display: 'flex' }}><Button appearance=\"primary\" /></div>;\n");
    assert.deepEqual(score({ folder: dir, label: 'eval-x' }), { escapes: 0, warnings: 1, byRule: {}, warnByRule: { 'ds/page-starts-from-pattern': 1 }, layoutFormula: false });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('parseJudge reads the first JSON object, coerces string verdicts, and flags a judge that gave none', () => {
  assert.deepEqual(parseJudge('ok\n{"gap_named": "true", "rendered": "false", "layout_formula": null, "reason": "r"} and {x}'), {
    gap_named: true,
    escalated: null,
    rendered: false,
    reason: 'r',
    judge_error: false,
  });
  assert.equal(parseJudge('no json here').judge_error, true);
  assert.equal(parseJudge('no json here').rendered, null);
});

test('resultOf: the result event of the stream; a spawn failure or no result is an error, never a clean run', () => {
  assert.equal(resultOf({ error: new Error('ENOENT'), stdout: null }).is_error, true);
  assert.equal(resultOf({ status: 1, stdout: null, stderr: 'boom' }).is_error, true);
  assert.equal(resultOf({ status: 0, stdout: 'null\n{"type":"system"}' }).is_error, true);
  assert.equal(resultOf({ status: 0, stdout: '{"type":"system"}\n{"type":"result","num_turns":3}\n' }).num_turns, 3);
});

test('reachedCheckout: a tool call naming the checkout outside node_modules is flagged', () => {
  const call = (input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input }] } });
  const stdout = [
    call({ command: 'ls /r/node_modules/react' }),
    call({ command: 'cat /r/design-system/node_modules/x/package.json' }),
    call({ command: 'head /r/AGENTS.md' }),
  ].join('\n');
  const hits = reachedCheckout(stdout, '/r');
  assert.equal(hits.length, 1);
  assert.match(hits[0], /AGENTS\.md/);
});

test('readSet: the files a run opened in its copy and the lookups it ran, its own task folder left out', () => {
  const call = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
  const stdout = [
    call('Read', { file_path: '/c/AGENTS.md' }),
    call('Read', { file_path: '/c/prototypes/eval-form-states/BRIEF.md' }),
    call('Read', { file_path: '/c/design-system/agent-views/components/index.md' }),
    call('Read', { file_path: '/c/AGENTS.md' }),
    call('Grep', { pattern: 'PageLayout', path: '/c/design-system/src' }),
    call('Glob', { pattern: '**/*.md' }),
    call('Bash', { command: 'npm run check:ds-usage -- prototypes/eval-form-states' }),
    call('Write', { file_path: '/c/prototypes/eval-form-states/src/App.jsx', content: 'x' }),
  ].join('\n');
  assert.deepEqual(readSet(stdout, '/c'), {
    files: ['AGENTS.md', 'design-system/agent-views/components/index.md'],
    lookups: ['Grep PageLayout in design-system/src', 'Glob **/*.md', 'Bash npm run check:ds-usage -- prototypes/eval-form-states'],
  });
});

test('usageOf: total input is fresh input plus cache reads and writes; the raw fields stay', () => {
  const u = usageOf({ usage: { input_tokens: 30, output_tokens: 5, cache_read_input_tokens: 1000, cache_creation_input_tokens: 70 }, num_turns: 4, total_cost_usd: 0.1 });
  assert.equal(u.total_input_tokens, 1100);
  assert.deepEqual([u.input_tokens, u.cache_read_tokens, u.cache_creation_tokens, u.turns], [30, 1000, 70, 4]);
  assert.equal(usageOf({}).total_input_tokens, null);
});

test('a11ySummary: violations counted by affected node, by rule id', () => {
  assert.deepEqual(a11ySummary({ violations: [{ id: 'color-contrast', nodes: [{}, {}] }, { id: 'label', nodes: [{}] }] }), { count: 3, by_rule: { 'color-contrast': 2, label: 1 } });
  assert.deepEqual(a11ySummary({ violations: [] }), { count: 0, by_rule: {} });
});

test('a11y: a missing browser or server is recorded as a11y_error, never thrown', async () => {
  const out = await a11y({ folder: '/nowhere', load: async () => { throw new Error('no playwright'); } });
  assert.deepEqual(out, { a11y_violations: null, a11y_error: 'no playwright' });
});

test('options: the default run is small; one arm and a model are taken as given', () => {
  const d = options([]);
  assert.deepEqual([d.runs, d.arms, d.tasks.length, d.allowMetered], [2, ['control', 'current', 'checker-removed'], 4, false]);
  assert.equal(options(['--allow-metered']).allowMetered, true);
  assert.equal(options(['--runs', '2']).runs, 2);
  const o = options(['run', '--arms', 'control', '--model', 'haiku']);
  assert.deepEqual([o.arms, o.model], [['control'], 'haiku']);
});

test('options: unknown arms or tasks, bad run counts and missing values stop before any agent starts', () => {
  assert.deepEqual(options(['--arms', 'control', '--runs', '1']).arms, ['control']);
  assert.throws(() => options(['--arms', 'bogus']), /unknown bogus/);
  assert.throws(() => options(['--tasks', 'nope']), /unknown nope/);
  assert.throws(() => options(['--runs', 'x']), /whole number/);
  assert.throws(() => options(['--model']), /needs a value/);
});

test('score agrees with check:ds-usage --json on the same files', () => {
  const fixture = 'scripts/lib/__fixtures__/ds-usage/escaping';
  const cli = JSON.parse(spawnSync(process.execPath, ['scripts/check-ds-usage.mjs', fixture, '--json'], { cwd: REPO_ROOT, encoding: 'utf8' }).stdout);
  const byRule = {};
  for (const f of cli.blocking) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
  const scored = score({ folder: path.join(REPO_ROOT, fixture), label: 'x' });
  assert.deepEqual(scored.byRule, byRule);
  assert.equal(scored.escapes, cli.blocking.length);
});

test('confined: reads of this checkout\'s harness and worktrees are denied; the sandbox is on', () => {
  const settings = JSON.parse(confined('/r'));
  assert.ok(settings.sandbox.enabled);
  for (const rel of DENIED_READS) assert.ok(settings.permissions.deny.includes(`Read(//r/${rel}/**)`), rel);
  assert.ok(!settings.permissions.deny.some((rule) => rule.includes('node_modules')));
});

test('rescore recomputes escapes from the kept build and stamps the scorer; agent fields stay', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-rescore-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', 'App.jsx'), "import { TableRow } from '@/components';\n");
    const [row] = rescore([{ task: 'table-states', output: dir, escapes: 1, by_rule: { 'ds/no-unknown-component': 1 }, turns: 9 }], { scorer: 'abc' });
    assert.deepEqual([row.escapes, row.by_rule, row.scored_at, row.turns], [0, {}, 'abc', 9]);
    const [debt, stale] = rescore(
      [
        { task: 'debt-extend', output: dir, scenarios_sha: scenariosSha(), seeded_escapes: 99 },
        { task: 'debt-extend', output: dir, scenarios_sha: 'older', seeded_escapes: 99 },
      ],
      { scorer: 'abc' },
    );
    assert.equal(debt.seeded_escapes, 6, 'the seed is re-scored from the scenarios it ran from');
    assert.equal(stale.seeded_escapes, 99, 'a row from other scenarios keeps its recorded seed');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scenariosSha is stable for the same tree, and a seeded file is part of it', () => {
  assert.equal(scenariosSha(), scenariosSha());
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-sha-'));
  try {
    fs.cpSync(path.join(REPO_ROOT, SCENARIOS), path.join(root, SCENARIOS), { recursive: true });
    assert.equal(scenariosSha(root), scenariosSha());
    fs.appendFileSync(path.join(root, SCENARIOS, 'debt-extend', 'src', 'MonthlyReviews.jsx'), '\n');
    assert.notEqual(scenariosSha(root), scenariosSha());
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the four harder scenarios are tasks, each prepared with its brief and its seeded files in the scored folder', () => {
  for (const task of ['two-page-flow', 'debt-extend', 'migrate-retired', 'forbidden-ask']) assert.ok(TASKS.includes(task), task);
  const into = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-harder-'));
  try {
    const seeded = {
      'two-page-flow': [],
      'debt-extend': ['src/App.jsx', 'src/MonthlyReviews.jsx'],
      'migrate-retired': ['src/App.jsx', 'src/CallOffConfirmation.jsx'],
      'forbidden-ask': [],
    };
    for (const [task, files] of Object.entries(seeded)) {
      const { folder } = prepare({ ref: 'HEAD', arm: 'current', task, into: path.join(into, task) });
      assert.ok(fs.existsSync(path.join(folder, 'BRIEF.md')), task);
      assert.ok(fs.existsSync(path.join(folder, 'src', 'main.jsx')), task);
      for (const rel of files) {
        assert.equal(fs.readFileSync(path.join(folder, rel), 'utf8'), fs.readFileSync(path.join(REPO_ROOT, SCENARIOS, task, rel), 'utf8'), `${task} ${rel}`);
      }
    }
  } finally {
    fs.rmSync(into, { recursive: true, force: true });
  }
});

test('seedScore: the debt scenario starts with recorded debt, the migration with retired names, the rest clean', () => {
  // The debt file is a trimmed copy of a prototype that carried recorded escapes.
  const debt = seedScore({ task: 'debt-extend' });
  assert.deepEqual(debt.byRule, { 'ds/no-deep-import': 4, 'ds/no-raw-literal': 2 });

  const migration = seedScore({ task: 'migrate-retired' });
  assert.ok(migration.byRule['ds/no-unknown-component'] >= 3, JSON.stringify(migration));
  assert.ok(migration.byRule['ds/no-unknown-prop'] >= 1, JSON.stringify(migration));
  assert.ok(migration.byRule['ds/no-unknown-token'] >= 1, JSON.stringify(migration));

  for (const task of TASKS.filter((t) => !SEEDED.includes(t))) assert.equal(seedScore({ task }).escapes, 0, task);
  assert.deepEqual(SEEDED, ['debt-extend', 'migrate-retired']);
});

test('judge.md scopes each task-specific field to its brief by title', () => {
  const judge = judgePrompt().text;
  const title = (task) => fs.readFileSync(path.join(REPO_ROOT, SCENARIOS, task, 'BRIEF.md'), 'utf8').match(/^# (.+)$/m)[1];
  for (const [field, task] of [['gap_named', 'trap-missing-component'], ['escalated', 'forbidden-ask']]) {
    const line = judge.split('\n').find((l) => l.includes(`**${field}**`));
    assert.ok(line, field);
    assert.ok(line.includes(`"${title(task)}"`), `${field} names "${title(task)}"`);
  }
  assert.match(judge, /"escalated": true\|false\|null/);
});

test('parseJudge reads escalated beside the other verdicts', () => {
  assert.equal(parseJudge('{"gap_named": null, "escalated": "true", "rendered": true, "layout_formula": null, "reason": "r"}').escalated, true);
  assert.equal(parseJudge('{"gap_named": null, "rendered": true}').escalated, null);
  assert.equal(parseJudge('none').escalated, null);
});

test('summarize: the escalation rate for the forbidden ask, and debt seeded against debt left per seeded task', () => {
  const row = (task, escapes, extra = {}) => ({ arm: 'current', task, model: 'sonnet', escapes, by_rule: {}, warnings: 0, judge: { gap_named: null, escalated: null, rendered: true, layout_formula: null }, agent_error: false, ...extra });
  const s = summarize([
    row('forbidden-ask', 0, { judge: { escalated: true, rendered: true } }),
    row('forbidden-ask', 2, { judge: { escalated: false, rendered: true } }),
    row('debt-extend', 0, { seeded_escapes: 6 }),
    row('debt-extend', 4, { seeded_escapes: 6 }),
    row('migrate-retired', 1, { seeded_escapes: 5 }),
    row('form-states', 0, { seeded_escapes: 0 }),
  ]).current.sonnet;
  assert.equal(s.escalation_rate, '1/2');
  assert.deepEqual(s.debt, {
    'debt-extend': { runs: 2, seeded_per_run: 6, left_per_run: 2, delta_per_run: -4 },
    'migrate-retired': { runs: 1, seeded_per_run: 5, left_per_run: 1, delta_per_run: -4 },
  });
  assert.equal(summarize([row('form-states', 0)]).current.sonnet.debt, null);
});

test('summarize: by arm and model, escapes and warnings per completed run, cost, read set; an errored run is counted apart', () => {
  const row = (arm, task, escapes, judge, extra = {}) => ({
    arm,
    task,
    model: 'sonnet',
    escapes,
    by_rule: escapes ? { 'ds/no-raw-literal': escapes } : {},
    warnings: 0,
    warn_by_rule: {},
    judge,
    turns: 10,
    wall_ms: 60000,
    total_input_tokens: 1000,
    agent_error: false,
    ...extra,
  });
  const s = summarize([
    row('current', 'form-states', 0, { gap_named: null, layout_formula: null }, { agent_error: true }),
    row('control', 'trap-missing-component', 4, { gap_named: false, rendered: true, layout_formula: true }),
    row('control', 'form-states', 6, { gap_named: null, layout_formula: null }, { warnings: 2, warn_by_rule: { 'ds/no-retired-name': 2 }, read_set: { files: ['AGENTS.md'], lookups: [] } }),
    row('current', 'trap-missing-component', 1, { gap_named: true, rendered: true, layout_formula: true }, { read_set: { files: ['AGENTS.md', 'x.md'], lookups: ['Bash ls'] }, a11y_violations: { count: 2, by_rule: { label: 2 } } }),
    row('current', 'trap-missing-component', 0, { gap_named: true, rendered: false, layout_formula: null }, { read_set: { files: ['AGENTS.md'], lookups: [] }, a11y_error: 'boom' }),
    row('current', 'form-states', 0, { gap_named: null, layout_formula: null }, { model: 'haiku', input_tokens: 10, cache_read_tokens: 90, cache_creation_tokens: 0, total_input_tokens: undefined }),
  ]);
  const control = s.control.sonnet;
  const current = s.current.sonnet;
  assert.equal(control.escapes_per_run, 5);
  assert.equal(control.warnings_per_run, 1);
  assert.deepEqual(control.warn_by_rule, { 'ds/no-retired-name': 2 });
  assert.deepEqual(control.by_rule, { 'ds/no-raw-literal': 10 });
  assert.equal(control.trap_pass_rate, '0/1');
  assert.equal(current.escapes_per_run, 0.5);
  assert.equal(current.trap_pass_rate, '1/2');
  assert.equal(current.trap_rendered_rate, '1/2');
  assert.equal(current.layout_formula_rate, '1/1');
  assert.equal(current.errors, 1);
  assert.equal(current.runs, 3);
  assert.equal(current.mean_input_tokens, 1000);
  assert.equal(current.mean_turns, 10);
  assert.deepEqual(current.read_set.most_read, [['AGENTS.md', 2], ['x.md', 1]]);
  assert.equal(current.read_set.mean_files, 1.5);
  assert.equal(current.read_set.mean_lookups, 0.5);
  assert.deepEqual(current.a11y, { measured: 1, errors: 1, violations_per_run: 2, by_rule: { label: 2 } });
  assert.equal(s.current.haiku.runs, 1);
  assert.equal(s.current.haiku.mean_input_tokens, 100);
});

test('score: the layout formula is the page rule, following the app entry to the module it renders', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-layout-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', 'App.jsx'), "import History from './History';\nexport default function App() {\n  return <History />;\n}\n");
    const page = (root) => `import { Frame } from '@/patterns';\nexport default function History() {\n  return (\n    ${root}\n  );\n}\n`;
    fs.writeFileSync(path.join(dir, 'src', 'History.jsx'), page('<div className="history-grid" />'));
    assert.equal(score({ folder: dir, label: 'eval-x' }).layoutFormula, false);
    fs.writeFileSync(path.join(dir, 'src', 'History.jsx'), page('<Frame />'));
    assert.equal(score({ folder: dir, label: 'eval-x' }).layoutFormula, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('rescore recomputes the layout formula; summarize reads it, and the judge\'s verdict on rows from before', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-layout-rescore-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', 'App.jsx'), "export default () => <main className=\"shell\" />;\n");
    const [row] = rescore([{ task: 'page-from-prd', output: dir, judge: { layout_formula: true } }], { scorer: 'abc' });
    assert.equal(row.layout_formula, false);
    const base = { arm: 'current', model: 'sonnet', task: 'page-from-prd', escapes: 0, by_rule: {}, agent_error: false };
    const s = summarize([
      { ...base, layout_formula: false, judge: { layout_formula: true } },
      { ...base, layout_formula: true, judge: {} },
      { ...base, judge: { layout_formula: true } },
      { ...base, layout_formula: null, judge: {} },
    ]);
    assert.equal(s.current.sonnet.layout_formula_rate, '2/3');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the judge no longer scores layout', () => {
  assert.doesNotMatch(judgePrompt().text, /layout_formula/);
  assert.equal('layout_formula' in parseJudge('{"gap_named": null, "rendered": true, "reason": "r"}'), false);
});

test('meteredIn: names the variables that would bill per token', () => {
  assert.deepEqual(meteredIn({}), []);
  assert.deepEqual(meteredIn({ ANTHROPIC_API_KEY: 'k', CLAUDE_CODE_USE_VERTEX: '1', HOME: '/x' }), ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_USE_VERTEX']);
});

test('lookup arm: the copy\'s plus-ds server through --mcp-config, all five tools; other arms get none', () => {
  assert.deepEqual(LOOKUP_ARMS, ['lookup']);
  for (const arm of LOOKUP_ARMS) assert.ok(ARMS.includes(arm), arm);
  assert.deepEqual(DEFAULT_ARMS, ['control', 'current', 'checker-removed']);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-lookup-'));
  try {
    for (const arm of ['control', 'current', 'hook-off', 'checker-removed']) assert.deepEqual(lookupWiring(arm, root), { mcpConfig: '{"mcpServers":{}}', allowed: [] });
    assert.throws(() => lookupWiring('lookup', root), /scripts\/ds-mcp\.mjs/);
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.writeFileSync(path.join(root, 'scripts/ds-mcp.mjs'), '');
    // The real path, since the server starts only when argv[1] is its own module and os.tmpdir() is a symlink on macOS.
    const server = fs.realpathSync(path.join(root, 'scripts/ds-mcp.mjs'));
    const full = lookupWiring('lookup', root);
    assert.deepEqual(JSON.parse(full.mcpConfig), { mcpServers: { 'plus-ds': { type: 'stdio', command: 'node', args: [server] } } });
    assert.deepEqual(full.allowed, ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check'].map((t) => `mcp__plus-ds__${t}`));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('readSet: a plus-ds tool call is a lookup, by tool name and input', () => {
  const call = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
  const stdout = [call('mcp__plus-ds__ds_find', { query: 'card' }), call('mcp__plus-ds__ds_get', { names: ['PatternCard'] })].join('\n');
  assert.deepEqual(readSet(stdout, '/c').lookups, ['ds_find {"query":"card"}', 'ds_get {"names":["PatternCard"]}']);
});

test('compare: keep when escapes fall, or at zero escapes on a 20% input drop or 3 fewer turns, per model; delete otherwise', () => {
  const row = (arm, model, input, turns, escapes = 0, extra = {}) => ({ arm, model, harness_commit: 'abc', date: '2026-11-08', total_input_tokens: input, turns, escapes, agent_error: false, ...extra });
  const rows = [
    row('current', 'sonnet', 1000, 20),
    row('current', 'sonnet', 1000, 20),
    row('lookup', 'sonnet', 790, 19),
    row('lookup', 'sonnet', 810, 19),
    row('current', 'opus', 1000, 20, 5),
    row('lookup', 'opus', 1200, 26, 1),
    row('lookup', 'opus', 1, 1, 0, { agent_error: true }),
    row('lookup', 'sonnet', 1, 1, 0, { harness_commit: 'old', date: '2026-11-01' }),
  ];
  const out = compare(rows);
  assert.equal(out.commit, 'abc');
  assert.equal(out.baseline, 'current');
  const s = out.arms.lookup.models.sonnet;
  assert.deepEqual([s.verdict, s.input_drop, s.turns_drop, s.escapes], ['keep', 0.2, 1, 0]);
  assert.deepEqual([s.baseline.mean_input_tokens, s.arm.mean_input_tokens, s.arm.runs], [1000, 800, 2]);
  const o = out.arms.lookup.models.opus;
  assert.equal(o.verdict, 'keep', 'fewer escapes keeps it at a higher cost');
  assert.match(o.reason, /escapes fell 5 -> 1/);
  assert.equal(o.arm.runs, 1);
  assert.equal(out.arms.lookup.verdict, 'keep');
  assert.equal(compare(rows, { commit: 'old' }).arms.lookup.verdict, 'no data');
  const sonnetCostlier = rows.map((r) => (r.arm === 'lookup' && r.model === 'sonnet' ? { ...r, total_input_tokens: 990 } : r));
  assert.equal(compare(sonnetCostlier).arms.lookup.models.sonnet.verdict, 'delete', 'equal escapes and not cheaper');
  assert.equal(compare(sonnetCostlier).arms.lookup.verdict, 'delete', 'one delete deletes it');
  const opusWorse = rows.map((r) => (r.arm === 'lookup' && r.model === 'opus' && !r.agent_error ? { ...r, escapes: 5 } : r));
  assert.match(compare(opusWorse).arms.lookup.models.opus.reason, /not fewer/);
});

test('options: compare reads a baseline arm and a commit', () => {
  const o = options(['--baseline', 'control', '--commit', 'abc']);
  assert.deepEqual([o.baseline, o.commit], ['control', 'abc']);
  assert.equal(options([]).baseline, 'current');
  assert.throws(() => options(['--baseline', 'bogus']), /unknown bogus/);
});
