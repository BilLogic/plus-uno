import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CONTROL_REMOVED, SCENARIOS, TASKS, controlAgents, judgePrompt, options, parseJudge, prepare, resultOf, scenariosSha, score, summarize } from './eval-ds-usage.mjs';
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

test('score: escapes by rule from this checkout\'s rules; the untouched template scores zero', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-score-'));
  try {
    fs.cpSync(path.join(REPO_ROOT, SCENARIOS, '_template'), dir, { recursive: true });
    assert.deepEqual(score({ folder: dir, label: 'eval-x' }), { escapes: 0, warnings: 0, byRule: {} });
    fs.writeFileSync(path.join(dir, 'src', 'App.jsx'), "import { Buton } from '@/components';\nexport default () => <div style={{ padding: '12px' }} />;\n");
    const scored = score({ folder: dir, label: 'eval-x' });
    assert.deepEqual(scored.byRule, { 'ds/no-unknown-component': 1, 'ds/no-raw-literal': 1 });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('parseJudge reads the first JSON object, coerces string verdicts, and flags a judge that gave none', () => {
  assert.deepEqual(parseJudge('ok\n{"gap_named": "true", "layout_formula": null, "reason": "r"} and {x}'), {
    gap_named: true,
    layout_formula: null,
    reason: 'r',
    judge_error: false,
  });
  assert.equal(parseJudge('no json here').judge_error, true);
});

test('resultOf: a spawn failure or unparsable output is an error, never a clean run', () => {
  assert.equal(resultOf({ error: new Error('ENOENT'), stdout: null }).is_error, true);
  assert.equal(resultOf({ status: 1, stdout: null, stderr: 'boom' }).is_error, true);
  assert.equal(resultOf({ status: 0, stdout: 'null' }).is_error, true);
  assert.equal(resultOf({ status: 0, stdout: '{"num_turns": 3}' }).num_turns, 3);
});

test('options: unknown arms or tasks, bad run counts and missing values stop before any agent starts', () => {
  assert.deepEqual(options(['--arms', 'control', '--runs', '1']).arms, ['control']);
  assert.throws(() => options(['--arms', 'bogus']), /unknown bogus/);
  assert.throws(() => options(['--tasks', 'nope']), /unknown nope/);
  assert.throws(() => options(['--runs', 'x']), /whole number/);
  assert.throws(() => options(['--model']), /needs a value/);
});

test('scenariosSha is stable for the same tree', () => {
  assert.equal(scenariosSha(), scenariosSha());
});

test('summarize: escapes per completed run by arm, trap and layout rates; an errored run is counted apart', () => {
  const row = (arm, task, escapes, judge, agent_error = false) => ({ arm, task, escapes, by_rule: escapes ? { 'ds/no-raw-literal': escapes } : {}, judge, turns: 10, wall_ms: 60000, agent_error });
  const s = summarize([
    row('current', 'form-states', 0, { gap_named: null, layout_formula: null }, true),
    row('control', 'trap-missing-component', 4, { gap_named: false, layout_formula: true }),
    row('control', 'form-states', 6, { gap_named: null, layout_formula: null }),
    row('current', 'trap-missing-component', 1, { gap_named: true, layout_formula: true }),
    row('current', 'form-states', 0, { gap_named: null, layout_formula: null }),
  ]);
  assert.equal(s.control.escapes_per_run, 5);
  assert.equal(s.current.escapes_per_run, 0.5);
  assert.equal(s.control.trap_pass_rate, '0/1');
  assert.equal(s.current.trap_pass_rate, '1/1');
  assert.equal(s.current.layout_formula_rate, '1/1');
  assert.deepEqual(s.control.by_rule, { 'ds/no-raw-literal': 10 });
  assert.equal(s.current.errors, 1);
  assert.equal(s.current.runs, 3);
});
