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
 *   control  the copy with the harness taken out of reach (CONTROL_REMOVED,
 *            controlAgents, and the project hooks). Component source stays:
 *            a repo without a harness still has code.
 *   current  the copy as it is on main (`--ref`, default origin/main), project hooks included.
 *
 * Everything but the agent and judge calls is deterministic: the copies, the
 * scoring, the ledger rows and the summary.
 *
 *   node scripts/eval-ds-usage.mjs run [--arms control,current] [--tasks a,b] [--runs 2] [--model sonnet] [--ref origin/main] [--scratch DIR]
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
  'design-system/figma',
  'docs/connectors/storybook-mcp.md',
  'docs/engineering/coding.md',
  'docs/engineering/ds-usage-rules.md',
  'scripts/check-ds-usage.mjs',
  'scripts/lib/ds-usage.mjs',
  'scripts/baselines/ds-usage.json',
  'skills',
  '.claude/skills',
  '.cursor',
  '.codex',
];

/**
 * The control arm's AGENTS.md: the title and the Identity section, without
 * the lines that route design-system claims. Everything after Identity (the
 * skills, agents, conventions, loading contract, hard rules and loading table)
 * is the harness, and the control arm has none.
 */
export function controlAgents(text) {
  const start = text.indexOf('\n## Identity');
  const next = text.indexOf('\n## ', start + 1);
  const title = text.match(/^# .*$/m)[0];
  // The opening paragraph says what the repo is; the bullets route claims to
  // the harness's sources, and those routes are what control lacks.
  const identity = text
    .slice(start, next === -1 ? undefined : next)
    .split('\n')
    .filter((line) => !(line.startsWith('- ') && /storybook|design-system|\bDS\b|blueprint|Roadmap|GLOSSARY|ADR-|agents\//i.test(line)))
    .join('\n');
  return `${title}\n${identity.trimEnd()}\n`;
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

/** The judge prompt and its hash; a changed prompt is a different judge. */
export function judgePrompt(repoRoot = REPO_ROOT) {
  const text = fs.readFileSync(path.join(repoRoot, SCENARIOS, 'judge.md'), 'utf8');
  return { text, sha: sha256(text).slice(0, 12) };
}

/** Every regular file under a folder, symlinks and `node_modules` skipped, sorted. */
function filesUnder(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (entry.name === 'node_modules' || entry.isSymbolicLink()) continue;
      const abs = path.join(d, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile()) out.push(abs);
    }
  };
  walk(dir);
  return out;
}

/** Hash of the scenarios as read: the briefs, template and judge come from the working tree. */
export function scenariosSha(repoRoot = REPO_ROOT) {
  const root = path.join(repoRoot, SCENARIOS);
  const hash = createHash('sha256');
  for (const file of filesUnder(root)) hash.update(path.relative(root, file)).update(fs.readFileSync(file));
  return hash.digest('hex').slice(0, 12);
}

function copyDir(from, to) {
  for (const file of filesUnder(from)) {
    const target = path.join(to, path.relative(from, file));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
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
    fs.writeFileSync(agents, controlAgents(fs.readFileSync(agents, 'utf8')));
    // `check:ds-usage` is the harness's definition of an escape; its script is gone.
    const pkg = path.join(into, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(pkg, 'utf8'));
    delete manifest.scripts?.['check:ds-usage'];
    fs.writeFileSync(pkg, `${JSON.stringify(manifest, null, 2)}\n`);
    // The project hooks are the uno-prototype gate, part of the harness; their
    // scripts went with `.cursor`, so the control arm drops the hooks too.
    const settings = path.join(into, '.claude/settings.json');
    if (fs.existsSync(settings)) {
      const parsed = JSON.parse(fs.readFileSync(settings, 'utf8'));
      delete parsed.hooks;
      fs.writeFileSync(settings, `${JSON.stringify(parsed, null, 2)}\n`);
    }
  }
  // The scenarios are the answer key's neighbors; neither arm sees them.
  fs.rmSync(path.join(into, 'docs/evals'), { recursive: true, force: true });
  const folder = path.join(into, 'prototypes', `eval-${task}`);
  copyDir(path.join(repoRoot, SCENARIOS, '_template'), folder);
  copyDir(path.join(repoRoot, SCENARIOS, task), folder);
  return { root: into, folder };
}

/**
 * Escapes in a built prototype, by rule, scored by this checkout's rules.
 * The template's own files are scored too; they carry none.
 */
export function score({ repoRoot = REPO_ROOT, folder, label }) {
  const ctx = contextOf(repoRoot);
  const findings = filesUnder(folder).flatMap((abs) =>
    escapesIn({ path: `${label}/${path.relative(folder, abs).split(path.sep).join('/')}`, text: fs.readFileSync(abs, 'utf8') }, ctx),
  );
  const fail = findings.filter((f) => f.level === 'fail');
  const byRule = {};
  for (const f of fail) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
  return { escapes: fail.length, warnings: findings.length - fail.length, byRule };
}

const DISALLOWED = ['Skill', 'Agent', 'Task', 'WebFetch', 'WebSearch'];

/**
 * Keeps the agent inside its copy: edits outside the working directory are
 * refused in `acceptEdits` mode with no one to approve them, and Bash runs in
 * the sandbox, which writes only inside the working directory.
 */
/**
 * Paths in this checkout an agent could read its way into (the copy's
 * `node_modules` link points here): the harness, and every worktree under
 * `.claude/`. Permission rules deny them to the Read, Grep and Glob tools.
 * A Bash read is not stopped (probed 2026-11-07: `head` on the checkout's
 * AGENTS.md succeeded under the sandbox), so `reachedCheckout` measures it
 * from the run's own tool calls instead, and the ledger flags the run.
 */
export const DENIED_READS = ['AGENTS.md', 'CLAUDE.md', 'design-system/agent-views', 'design-system/guidelines', 'design-system/figma', 'docs', 'skills', '.claude', '.cursor', '.codex', 'scripts'];

export function confined(repoRoot = REPO_ROOT) {
  const deny = DENIED_READS.flatMap((rel) => {
    const abs = path.join(repoRoot, rel);
    return [`Read(/${abs})`, `Read(/${abs}/**)`];
  });
  return JSON.stringify({
    permissions: { deny },
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      allowUnsandboxedCommands: false,
    },
  });
}

/** Each JSON line a `stream-json` run printed. */
const events = (stdout) =>
  String(stdout ?? '')
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((e) => e && typeof e === 'object');

/** The run's final result event, or an error record when it printed none. */
export function resultOf(out) {
  if (out.error) return { is_error: true, result: `spawn failed: ${out.error.message}` };
  const result = events(out.stdout).findLast((e) => e.type === 'result');
  if (result) return result;
  return { is_error: true, result: `exit ${out.status}: ${String(out.stderr || out.stdout || '').slice(-2000)}` };
}

/**
 * The tool calls of a run that name this checkout outside its `node_modules`:
 * an agent reading past its copy into the real harness. Empty for a clean run.
 */
export function reachedCheckout(stdout, repoRoot = REPO_ROOT) {
  const hits = [];
  for (const e of events(stdout)) {
    for (const part of e.type === 'assistant' ? e.message?.content ?? [] : []) {
      if (part.type !== 'tool_use') continue;
      const text = JSON.stringify(part.input ?? {});
      const named = new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[/"\\s']|$)(/[^"\\s']*)?`, 'g');
      const outside = [...text.matchAll(named)].some(([, rest = '']) => !/^\/(?:design-system\/)?node_modules(?:\/|$)/.test(rest));
      if (outside) hits.push(`${part.name}: ${text.slice(0, 200)}`);
    }
  }
  return hits;
}

/** One headless agent run in `cwd`; returns its result (tokens, turns, cost), any reach into the checkout, and wall time. */
function agent({ cwd, prompt, model, readOnly = false }) {
  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--model',
    model,
    '--permission-mode',
    readOnly ? 'default' : 'acceptEdits',
    '--settings',
    confined(),
    '--setting-sources',
    'project,local',
    '--strict-mcp-config',
    '--mcp-config',
    '{"mcpServers":{}}',
    '--disallowedTools',
    ...(readOnly ? [...DISALLOWED, 'Write', 'Edit', 'NotebookEdit', 'Bash'] : DISALLOWED),
  ];
  const started = Date.now();
  const out = spawnSync('claude', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 45 * 60 * 1000 });
  return { result: resultOf(out), reached: reachedCheckout(out.stdout), wallMs: Date.now() - started };
}

const usageOf = (r) => ({
  input_tokens: r?.usage?.input_tokens ?? null,
  output_tokens: r?.usage?.output_tokens ?? null,
  cache_read_tokens: r?.usage?.cache_read_input_tokens ?? null,
  cache_creation_tokens: r?.usage?.cache_creation_input_tokens ?? null,
  turns: r?.num_turns ?? null,
  cost_usd: r?.total_cost_usd ?? null,
});

const verdict = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null);

/** The judge's first JSON object, or nulls with `judge_error` when it gave none. */
export function parseJudge(text) {
  const s = String(text ?? '');
  for (let start = s.indexOf('{'); start !== -1; start = s.indexOf('{', start + 1)) {
    for (let end = s.indexOf('}', start); end !== -1; end = s.indexOf('}', end + 1)) {
      try {
        const j = JSON.parse(s.slice(start, end + 1));
        return { gap_named: verdict(j.gap_named), layout_formula: verdict(j.layout_formula), reason: j.reason ?? '', judge_error: false };
      } catch {
        // keep widening
      }
    }
  }
  return { gap_named: null, layout_formula: null, reason: 'judge gave no JSON', judge_error: true };
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

/**
 * Per arm: escapes per completed run, escapes by rule, the trap pass rate and
 * the layout-formula rate. A run whose agent errored is counted in `errors`
 * and left out of every rate, so a crash cannot read as a clean run.
 */
export function summarize(rows) {
  const arms = {};
  for (const row of rows) {
    const a = (arms[row.arm] ??= { runs: 0, errors: 0, completed: 0, escapes: 0, byRule: {}, trap: { runs: 0, named: 0 }, layout: { judged: 0, yes: 0 }, turns: 0, wallMs: 0 });
    a.runs += 1;
    if (row.agent_error) {
      a.errors += 1;
      continue;
    }
    a.completed += 1;
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
  const per = (n, d) => (d ? Number((n / d).toFixed(2)) : null);
  return Object.fromEntries(
    Object.entries(arms).map(([arm, a]) => [
      arm,
      {
        runs: a.runs,
        errors: a.errors,
        escapes_per_run: per(a.escapes, a.completed),
        by_rule: a.byRule,
        trap_pass_rate: a.trap.runs ? `${a.trap.named}/${a.trap.runs}` : null,
        layout_formula_rate: a.layout.judged ? `${a.layout.yes}/${a.layout.judged}` : null,
        mean_turns: per(a.turns, a.completed),
        mean_minutes: per(a.wallMs / 60000, a.completed),
      },
    ]),
  );
}

/** `--name value`, validated; a missing or unknown value stops the run before any agent starts. */
export function options(argv) {
  const value = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    if (i === -1) return fallback;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`--${name} needs a value`);
    return v;
  };
  const list = (name, fallback, allowed) => {
    const items = value(name, fallback.join(',')).split(',');
    const unknown = items.filter((x) => !allowed.includes(x));
    if (unknown.length) throw new Error(`--${name}: unknown ${unknown.join(', ')} (known: ${allowed.join(', ')})`);
    return items;
  };
  const runs = Number(value('runs', '2'));
  if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs takes a whole number from 1');
  return {
    arms: list('arms', ARMS, ARMS),
    tasks: list('tasks', TASKS, TASKS),
    runs,
    model: value('model', 'sonnet'),
    ref: value('ref', 'origin/main'),
    scratch: value('scratch', os.tmpdir()),
    since: value('since', ''),
  };
}

const BUILD_PROMPT = (task) =>
  `Read prototypes/eval-${task}/BRIEF.md and build what it asks in prototypes/eval-${task}/. ` +
  'Work only in that folder. When it is built, stop.';

function runOne({ id, arm, task, n, opts, commit, judge, scenarios, scratch }) {
  const copy = path.join(scratch, id);
  try {
    const { root, folder } = prepare({ ref: opts.ref, arm, task, into: copy });
    const build = agent({ cwd: root, prompt: BUILD_PROMPT(task), model: opts.model });
    const failed = Boolean(build.result.is_error);
    const scored = score({ folder, label: `eval-${task}` });
    // The judge reads a copy of the build alone, so nothing beside it is in reach.
    const bench = path.join(copy, '..', `${id}-judge`);
    let judged = { gap_named: null, layout_formula: null, reason: 'build errored; not judged', judge_error: false };
    if (!failed) {
      try {
        copyDir(folder, bench);
        judged = parseJudge(agent({ cwd: bench, prompt: judge.text, model: opts.model, readOnly: true }).result.result);
      } finally {
        fs.rmSync(bench, { recursive: true, force: true });
      }
    }
    const kept = path.join(OUTPUTS, id);
    fs.rmSync(kept, { recursive: true, force: true });
    copyDir(folder, kept);
    fs.writeFileSync(path.join(kept, 'agent-result.json'), JSON.stringify(build.result, null, 2));
    append({
      date: new Date().toISOString(),
      model: opts.model,
      harness_commit: commit,
      scenarios_sha: scenarios,
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
      agent_error: failed,
      reached_checkout: build.reached,
      output: kept,
    });
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
}

function runAll(opts) {
  const commit = execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', '--short', opts.ref], { encoding: 'utf8' }).trim();
  const judge = judgePrompt();
  const scenarios = scenariosSha();
  fs.mkdirSync(opts.scratch, { recursive: true });
  const scratch = fs.mkdtempSync(path.join(opts.scratch, 'ds-usage-eval-'));
  try {
    for (let n = 1; n <= opts.runs; n += 1) {
      for (const task of opts.tasks) {
        for (const arm of opts.arms) {
          const id = `${new Date().toISOString().slice(0, 10)}-${commit}-${arm}-${task}-${n}`;
          console.log(`[ds-usage eval] ${id}`);
          runOne({ id, arm, task, n, opts, commit, judge, scenarios, scratch });
        }
      }
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
  console.log(JSON.stringify(summarize(readLedger().filter((r) => r.harness_commit === commit)), null, 2));
}

if (isEntry(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  try {
    const opts = options(rest);
    if (command === 'run') runAll(opts);
    else if (command === 'summary') console.log(JSON.stringify(summarize(readLedger().filter((r) => r.date >= opts.since)), null, 2));
    else throw new Error('usage: node scripts/eval-ds-usage.mjs run|summary [options] (docs/evals/ds-usage.md)');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
