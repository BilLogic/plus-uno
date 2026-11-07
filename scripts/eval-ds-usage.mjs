#!/usr/bin/env node
/**
 * The design-system usage eval: does the harness help an agent stay inside
 * the design system? How to run it and read it: `docs/evals/ds-usage.md`.
 *
 * One run = one task, one arm, one fresh agent. The agent works in a plain
 * copy of the repo at a commit (`git archive`, outside this checkout, so no
 * parent AGENTS.md or project memory reaches it), builds the task's prototype,
 * and the result is scored by THIS checkout's `check:ds-usage` rules, so every
 * arm is held to the same law.
 *
 *   control  the copy with the harness taken out of reach: AGENTS.md's
 *            design-system rules and loading rows, `design-system/agent-views`,
 *            `design-system/guidelines`, the Storybook MCP doc and the skills.
 *            Component source stays: a repo without a harness still has code.
 *   current  the copy as it is at the commit.
 *
 * Everything but the agent and judge calls is deterministic: the copies, the
 * scoring, the ledger rows and the summary.
 *
 *   node scripts/eval-ds-usage.mjs run [--arms control,current] [--tasks a,b] [--runs 2] [--model sonnet] [--ref HEAD] [--scratch DIR]
 *   node scripts/eval-ds-usage.mjs summary [--since YYYY-MM-DD]
 */
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { contextOf } from './check-ds-usage.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';
import { escapesIn } from './lib/ds-usage.mjs';
import { isEntry } from './lib/findings.mjs';

export const SCENARIOS = 'docs/evals/scenarios/ds-usage';
export const LEDGER = 'docs/evals/ds-usage-ledger.jsonl';
export const TASKS = ['page-from-prd', 'form-states', 'table-states', 'overlay-flow', 'frame-to-code', 'trap-missing-component'];
export const ARMS = ['control', 'current'];
/** Durable copies of what each agent built, beside the ledger row that scores it. */
export const OUTPUTS = path.join(os.homedir(), 'Documents/Claude/Projects/PLUS/evals/ds-usage');

/** Paths the control arm removes: the harness's design-system surface. */
export const CONTROL_REMOVED = [
  'design-system/agent-views',
  'design-system/guidelines',
  'docs/connectors/storybook-mcp.md',
  'skills',
  '.claude/skills',
  '.cursor',
];

/**
 * AGENTS.md without its design-system rules: the Hard rules and code-authoring
 * rules, and every progressive-loading row that routes into the design system.
 */
export function stripAgents(text) {
  const start = text.indexOf('\n## Hard rules');
  const end = text.indexOf('\n## Knowledge');
  let out = start !== -1 && end > start ? text.slice(0, start) + text.slice(end) : text;
  out = out
    .split('\n')
    .filter((line) => !(line.startsWith('|') && /design-system\/|storybook|Figma|tokens/i.test(line)))
    .join('\n');
  return out;
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

/** The judge prompt and its hash; a changed prompt is a different judge. */
export function judgePrompt(repoRoot = REPO_ROOT) {
  const text = fs.readFileSync(path.join(repoRoot, SCENARIOS, 'judge.md'), 'utf8');
  return { text, sha: sha256(text).slice(0, 12) };
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

/**
 * A plain copy of the repo at `ref` for one arm, with the task's starting
 * folder at `prototypes/eval-<task>/`. Returns the copy's root and the folder.
 */
export function prepare({ repoRoot = REPO_ROOT, ref, arm, task, into }) {
  fs.mkdirSync(into, { recursive: true });
  const tar = execFileSync('git', ['-C', repoRoot, 'archive', '--format=tar', ref], { maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', into], { input: tar });
  for (const link of ['node_modules', 'design-system/node_modules']) {
    const target = path.join(repoRoot, link);
    if (fs.existsSync(target)) fs.symlinkSync(fs.realpathSync(target), path.join(into, link));
  }
  if (arm === 'control') {
    for (const rel of CONTROL_REMOVED) fs.rmSync(path.join(into, rel), { recursive: true, force: true });
    const agents = path.join(into, 'AGENTS.md');
    fs.writeFileSync(agents, stripAgents(fs.readFileSync(agents, 'utf8')));
  }
  // The scenarios are the answer key's neighbors; neither arm sees the others.
  fs.rmSync(path.join(into, 'docs/evals'), { recursive: true, force: true });
  const folder = path.join(into, 'prototypes', `eval-${task}`);
  copyDir(path.join(repoRoot, SCENARIOS, '_template'), folder);
  copyDir(path.join(repoRoot, SCENARIOS, task), folder);
  return { root: into, folder };
}

/** Every file the agent wrote under the prototype folder, repo-relative to the copy. */
function builtFiles(folder) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(abs);
    }
  };
  walk(folder);
  return out;
}

/**
 * Escapes in a built prototype, by rule, scored by this checkout's rules.
 * The template's own files are scored too; they carry none.
 */
export function score({ repoRoot = REPO_ROOT, folder, label }) {
  const ctx = contextOf(repoRoot);
  const findings = builtFiles(folder).flatMap((abs) =>
    escapesIn({ path: `${label}/${path.relative(folder, abs).split(path.sep).join('/')}`, text: fs.readFileSync(abs, 'utf8') }, ctx),
  );
  const fail = findings.filter((f) => f.level === 'fail');
  const byRule = {};
  for (const f of fail) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
  return { escapes: fail.length, warnings: findings.length - fail.length, byRule };
}

const DISALLOWED = ['Skill', 'Agent', 'Task', 'WebFetch', 'WebSearch'];

/** One headless agent run in `cwd`; returns its JSON result (tokens, turns, cost, time). */
function agent({ cwd, prompt, model, readOnly = false }) {
  const args = [
    '-p',
    prompt,
    '--output-format',
    'json',
    '--model',
    model,
    '--permission-mode',
    'bypassPermissions',
    '--setting-sources',
    'project,local',
    '--strict-mcp-config',
    '--mcp-config',
    '{"mcpServers":{}}',
    '--disallowedTools',
    ...(readOnly ? [...DISALLOWED, 'Write', 'Edit', 'NotebookEdit'] : DISALLOWED),
  ];
  const started = Date.now();
  const out = spawnSync('claude', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 45 * 60 * 1000 });
  const wallMs = Date.now() - started;
  let result = null;
  try {
    result = JSON.parse(out.stdout);
  } catch {
    result = { is_error: true, result: (out.stderr || out.stdout || '').slice(-2000) };
  }
  return { result, wallMs };
}

const usageOf = (r) => ({
  input_tokens: r?.usage?.input_tokens ?? null,
  output_tokens: r?.usage?.output_tokens ?? null,
  cache_read_tokens: r?.usage?.cache_read_input_tokens ?? null,
  turns: r?.num_turns ?? null,
  cost_usd: r?.total_cost_usd ?? null,
});

/** The judge's JSON answer, or nulls when it gave none. */
export function parseJudge(text) {
  const m = String(text ?? '').match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(m[0]);
    return { gap_named: j.gap_named ?? null, layout_formula: j.layout_formula ?? null, reason: j.reason ?? '' };
  } catch {
    return { gap_named: null, layout_formula: null, reason: 'judge gave no JSON' };
  }
}

/** Append one row; the ledger is append-only and keeps losses. */
export function append(row, repoRoot = REPO_ROOT) {
  fs.appendFileSync(path.join(repoRoot, LEDGER), `${JSON.stringify(row)}\n`);
}

export function readLedger(repoRoot = REPO_ROOT) {
  const file = path.join(repoRoot, LEDGER);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

/** Per-arm escape rate, escapes by rule, trap pass rate and mean cost. */
export function summarize(rows) {
  const arms = {};
  for (const row of rows) {
    const a = (arms[row.arm] ??= { runs: 0, escapes: 0, byRule: {}, trap: { runs: 0, named: 0 }, layout: { judged: 0, yes: 0 }, turns: 0, wallMs: 0, errors: 0 });
    a.runs += 1;
    if (row.agent_error) a.errors += 1;
    a.escapes += row.escapes;
    for (const [rule, n] of Object.entries(row.by_rule)) a.byRule[rule] = (a.byRule[rule] ?? 0) + n;
    if (row.task === 'trap-missing-component') {
      a.trap.runs += 1;
      if (row.judge.gap_named === true) a.trap.named += 1;
    }
    if (row.judge.layout_formula !== null) {
      a.layout.judged += 1;
      if (row.judge.layout_formula === true) a.layout.yes += 1;
    }
    a.turns += row.turns ?? 0;
    a.wallMs += row.wall_ms ?? 0;
  }
  return Object.fromEntries(
    Object.entries(arms).map(([arm, a]) => [
      arm,
      {
        runs: a.runs,
        errors: a.errors,
        escapes_per_run: Number((a.escapes / a.runs).toFixed(2)),
        by_rule: a.byRule,
        trap_pass_rate: a.trap.runs ? `${a.trap.named}/${a.trap.runs}` : null,
        layout_formula_rate: a.layout.judged ? `${a.layout.yes}/${a.layout.judged}` : null,
        mean_turns: Number((a.turns / a.runs).toFixed(1)),
        mean_minutes: Number((a.wallMs / a.runs / 60000).toFixed(1)),
      },
    ]),
  );
}

const option = (argv, name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const BUILD_PROMPT = (task) =>
  `Read prototypes/eval-${task}/BRIEF.md and build what it asks in prototypes/eval-${task}/. ` +
  'Work only in that folder. When it is built, stop.';

function runAll(argv) {
  const arms = option(argv, 'arms', ARMS.join(',')).split(',');
  const tasks = option(argv, 'tasks', TASKS.join(',')).split(',');
  const runs = Number(option(argv, 'runs', '2'));
  const model = option(argv, 'model', 'sonnet');
  const ref = option(argv, 'ref', 'HEAD');
  const commit = execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', '--short', ref], { encoding: 'utf8' }).trim();
  const judge = judgePrompt();
  // The throwaway copies live under --scratch (default: the OS temp dir) and are
  // removed run by run, and the folder itself at the end.
  const scratchRoot = option(argv, 'scratch', os.tmpdir());
  fs.mkdirSync(scratchRoot, { recursive: true });
  const scratch = fs.mkdtempSync(path.join(scratchRoot, 'ds-usage-eval-'));

  for (let n = 1; n <= runs; n += 1) {
    for (const task of tasks) {
      for (const arm of arms) {
        const id = `${new Date().toISOString().slice(0, 10)}-${commit}-${arm}-${task}-${n}`;
        console.log(`[ds-usage eval] ${id}`);
        const { folder } = prepare({ ref, arm, task, into: path.join(scratch, id) });
        const build = agent({ cwd: path.dirname(path.dirname(folder)), prompt: BUILD_PROMPT(task), model });
        const scored = score({ folder, label: `eval-${task}` });
        const verdict = agent({ cwd: folder, prompt: judge.text, model, readOnly: true });
        const judged = parseJudge(verdict.result?.result);
        const kept = path.join(OUTPUTS, id);
        copyDir(folder, kept);
        fs.writeFileSync(path.join(kept, 'agent-result.json'), JSON.stringify(build.result, null, 2));
        append({
          date: new Date().toISOString(),
          model,
          harness_commit: commit,
          arm,
          task,
          run: n,
          escapes: scored.escapes,
          by_rule: scored.byRule,
          warnings: scored.warnings,
          judge: judged,
          judge_sha: judge.sha,
          ...usageOf(build.result),
          wall_ms: build.wallMs,
          agent_error: Boolean(build.result?.is_error),
          output: kept,
        });
        fs.rmSync(path.join(scratch, id), { recursive: true, force: true });
      }
    }
  }
  fs.rmSync(scratch, { recursive: true, force: true });
  console.log(JSON.stringify(summarize(readLedger().filter((r) => r.harness_commit === commit)), null, 2));
}

if (isEntry(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  if (command === 'run') runAll(rest);
  else if (command === 'summary') {
    const since = option(rest, 'since', '');
    console.log(JSON.stringify(summarize(readLedger().filter((r) => r.date >= since)), null, 2));
  } else {
    console.error('usage: node scripts/eval-ds-usage.mjs run|summary [options] (docs/evals/ds-usage.md)');
    process.exitCode = 1;
  }
}
