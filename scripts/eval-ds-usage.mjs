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
 *   hook-off         current without the post-edit hook; the agent can still
 *                    run the checker.
 *   checker-removed  current without the checker (CHECKER_REMOVED); the
 *                    post-edit hook still runs, from this checkout.
 *
 * Everything but the agent and judge calls is deterministic: the copies, the
 * scoring, the ledger rows and the summary.
 *
 *   node scripts/eval-ds-usage.mjs run [--arms control,current] [--tasks a,b] [--runs 5] [--model sonnet] [--ref origin/main] [--scratch DIR]
 *   node scripts/eval-ds-usage.mjs summary [--since YYYY-MM-DD]
 *   node scripts/eval-ds-usage.mjs rescore   re-score every kept build with this checkout's rules
 */
import { createRequire } from 'node:module';
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
export const TASKS = [
  'page-from-prd',
  'form-states',
  'table-states',
  'overlay-flow',
  'frame-to-code',
  'trap-missing-component',
  'two-page-flow',
  'debt-extend',
  'migrate-retired',
  'forbidden-ask',
];
/**
 * Tasks whose folder starts with code in it, escapes included: recorded debt
 * from a prototype, or a component written in retired names. Each row records
 * what the folder held before the agent began, so debt left reads against
 * debt seeded.
 */
export const SEEDED = ['debt-extend', 'migrate-retired'];
export const ARMS = ['control', 'current', 'hook-off', 'checker-removed'];
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
 * What the checker-removed arm takes out of the copy: the checker, its rules,
 * its baseline and the copy's own post-edit hook, which could no longer load
 * a checker. The hook that runs instead lives in this checkout.
 */
export const CHECKER_REMOVED = ['scripts/check-ds-usage.mjs', 'scripts/lib/ds-usage.mjs', 'scripts/baselines/ds-usage.json', '.cursor/hooks/ds-usage'];

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

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const isDsHook = (hook) => /ds-usage\/post-edit\.mjs/.test(hook.command ?? '');

/** Drop the `check:ds-usage` script from a copy's package.json. */
function dropCheckerScript(root) {
  const pkg = path.join(root, 'package.json');
  const manifest = readJson(pkg);
  delete manifest.scripts?.['check:ds-usage'];
  writeJson(pkg, manifest);
}

/**
 * Rewrite the post-edit hook in a copy's Claude Code and Cursor wiring:
 * `swap(hook)` returns the hook to keep in its place, or null to drop it.
 * Every other hook stays as it was.
 */
function rewireDsHook(root, swap) {
  const settings = path.join(root, '.claude/settings.json');
  if (fs.existsSync(settings)) {
    const parsed = readJson(settings);
    for (const [event, groups] of Object.entries(parsed.hooks ?? {})) {
      parsed.hooks[event] = groups
        .map((group) => ({ ...group, hooks: group.hooks.map((h) => (isDsHook(h) ? swap(h) : h)).filter(Boolean) }))
        .filter((group) => group.hooks.length);
    }
    writeJson(settings, parsed);
  }
  // Cursor's wiring only logs and no eval run uses Cursor; it goes in both arms, so no copy points at a hook it lacks.
  const cursor = path.join(root, '.cursor/hooks.json');
  if (fs.existsSync(cursor)) {
    const parsed = readJson(cursor);
    for (const [event, hooks] of Object.entries(parsed.hooks ?? {})) parsed.hooks[event] = hooks.filter((h) => !isDsHook(h));
    writeJson(cursor, parsed);
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
    dropCheckerScript(into);
    // The project hooks are the uno-prototype gate, part of the harness; their
    // scripts went with `.cursor`, so the control arm drops the hooks too.
    const settings = path.join(into, '.claude/settings.json');
    if (fs.existsSync(settings)) {
      const parsed = JSON.parse(fs.readFileSync(settings, 'utf8'));
      delete parsed.hooks;
      fs.writeFileSync(settings, `${JSON.stringify(parsed, null, 2)}\n`);
    }
  }
  // hook-off: the checker stays in reach, and nothing runs it after an edit.
  if (arm === 'hook-off') rewireDsHook(into, () => null);
  // checker-removed: the agent cannot run the checker, and the hook still scores
  // each edit. The hook runs from this checkout (whose `scripts` and `.cursor`
  // are denied to Read) with the copy as the repo it checks.
  if (arm === 'checker-removed') {
    for (const rel of CHECKER_REMOVED) fs.rmSync(path.join(into, rel), { recursive: true, force: true });
    dropCheckerScript(into);
    const hook = path.join(repoRoot, '.cursor/hooks/ds-usage/post-edit.mjs');
    rewireDsHook(into, (h) => ({ ...h, command: `DS_USAGE_ROOT="$CLAUDE_PROJECT_DIR" node "${hook}"` }));
  }
  // The scenarios are the answer key's neighbors; neither arm sees them.
  fs.rmSync(path.join(into, 'docs/evals'), { recursive: true, force: true });
  const folder = path.join(into, 'prototypes', `eval-${task}`);
  copyDir(path.join(repoRoot, SCENARIOS, '_template'), folder);
  copyDir(path.join(repoRoot, SCENARIOS, task), folder);
  return { root: into, folder };
}

/**
 * Escapes in a built prototype, by rule, scored by this checkout's rules, and
 * the warnings beside them, by rule too. The template's own files are scored;
 * they carry none.
 */
export function score({ repoRoot = REPO_ROOT, folder, label }) {
  const ctx = contextOf(repoRoot);
  const findings = filesUnder(folder).flatMap((abs) =>
    escapesIn({ path: `${label}/${path.relative(folder, abs).split(path.sep).join('/')}`, text: fs.readFileSync(abs, 'utf8') }, ctx),
  );
  const byRule = {};
  const warnByRule = {};
  for (const f of findings) {
    const tally = f.level === 'fail' ? byRule : warnByRule;
    tally[f.rule] = (tally[f.rule] ?? 0) + 1;
  }
  const escapes = findings.filter((f) => f.level === 'fail').length;
  return { escapes, warnings: findings.length - escapes, byRule, warnByRule };
}

/**
 * The escapes a task's folder holds before any agent touches it: the template
 * and the task's own files, scored as `score` scores a build.
 */
export function seedScore({ repoRoot = REPO_ROOT, task }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ds-eval-seed-${task}-`));
  try {
    copyDir(path.join(repoRoot, SCENARIOS, '_template'), dir);
    copyDir(path.join(repoRoot, SCENARIOS, task), dir);
    return score({ repoRoot, folder: dir, label: `eval-${task}` });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
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

/**
 * An arm's own permission denials in its copy at `root`. checker-removed
 * denies the checker's paths (gone from the copy already) and its npm script,
 * so a run that goes looking is refused rather than surprised.
 */
export function armDenies(arm, root) {
  if (arm !== 'checker-removed') return [];
  return [...CHECKER_REMOVED.flatMap((rel) => [`Read(/${path.join(root, rel)})`, `Read(/${path.join(root, rel)}/**)`]), 'Bash(npm run check:ds-usage:*)'];
}

export function confined(repoRoot = REPO_ROOT, extra = []) {
  const deny = DENIED_READS.flatMap((rel) => {
    const abs = path.join(repoRoot, rel);
    return [`Read(/${abs})`, `Read(/${abs}/**)`];
  }).concat(extra);
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

/** The tool calls of a run, in order: `{name, input}`. */
const toolCalls = (stdout) =>
  events(stdout).flatMap((e) => (e.type === 'assistant' ? e.message?.content ?? [] : []).filter((part) => part.type === 'tool_use'));

/**
 * What a run read: the files it opened with Read, relative to its copy, in
 * first-read order, and the lookups it ran (Grep, Glob, Bash). Its own task
 * folder is left out of `files`; the brief and the build are not the harness.
 */
export function readSet(stdout, root) {
  const roots = [root];
  try {
    roots.push(fs.realpathSync(root));
  } catch {
    // a root that is gone (a test, or a copy already removed) is matched as given
  }
  const rel = (p = '') => {
    for (const r of roots) if (p === r || p.startsWith(`${r}/`)) return p.slice(r.length + 1) || '.';
    return p;
  };
  const files = [];
  const lookups = [];
  for (const { name, input = {} } of toolCalls(stdout)) {
    if (name === 'Read') {
      const file = rel(input.file_path);
      if (!/^prototypes\/eval-/.test(file) && !files.includes(file)) files.push(file);
    } else if (name === 'Grep') lookups.push(`Grep ${input.pattern}${input.path ? ` in ${rel(input.path)}` : ''}`);
    else if (name === 'Glob') lookups.push(`Glob ${input.pattern}${input.path ? ` in ${rel(input.path)}` : ''}`);
    else if (name === 'Bash') lookups.push(`Bash ${String(input.command ?? '').slice(0, 160)}`);
  }
  return { files, lookups };
}

/** One headless agent run in `cwd`; returns its result (tokens, turns, cost), any reach into the checkout, and wall time. */
function agent({ cwd, prompt, model, readOnly = false, deny = [] }) {
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
    confined(REPO_ROOT, deny),
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
  return { result: resultOf(out), reached: reachedCheckout(out.stdout), read: readSet(out.stdout, cwd), wallMs: Date.now() - started };
}

/**
 * Every input the model saw: fresh input plus cache reads and cache writes.
 * Fresh input alone is a few dozen tokens a run, since nearly all of it is
 * cached, so it says nothing about cost.
 */
const totalInput = (fields) => {
  const parts = [fields.input_tokens, fields.cache_read_tokens, fields.cache_creation_tokens];
  return parts.every((n) => n == null) ? null : parts.reduce((sum, n) => sum + (n ?? 0), 0);
};

/** A result event's usage as ledger fields: the raw counts and their total. */
export function usageOf(r) {
  const raw = {
    input_tokens: r?.usage?.input_tokens ?? null,
    output_tokens: r?.usage?.output_tokens ?? null,
    cache_read_tokens: r?.usage?.cache_read_input_tokens ?? null,
    cache_creation_tokens: r?.usage?.cache_creation_input_tokens ?? null,
  };
  return { ...raw, total_input_tokens: totalInput(raw), turns: r?.num_turns ?? null, cost_usd: r?.total_cost_usd ?? null };
}

/** An axe result as ledger fields: affected nodes in all, and by rule id. */
export function a11ySummary(results) {
  const by_rule = {};
  for (const v of results.violations ?? []) by_rule[v.id] = (by_rule[v.id] ?? 0) + (v.nodes?.length ?? 0);
  return { count: Object.values(by_rule).reduce((a, b) => a + b, 0), by_rule };
}

const loadBrowserTools = async () => ({ chromium: (await import('playwright')).chromium, vite: await import('vite') });

/**
 * The prototype served by vite and checked by axe in a headless browser.
 * Reported, never gated: anything missing or failing (no playwright, no
 * browser, a build that does not compile) becomes `a11y_error`, and the run
 * goes on. `folder` must still sit in its copy, where the vite config's
 * relative design-system and node_modules paths resolve.
 */
export async function a11y({ folder, load = loadBrowserTools }) {
  let server;
  let browser;
  try {
    const { chromium, vite } = await load();
    server = await vite.createServer({
      configFile: path.join(folder, 'vite.config.js'),
      root: folder,
      logLevel: 'silent',
      server: { port: 0, strictPort: false },
      // The design system's own Sass deprecations are not the build's; keep them out of the run log.
      css: { preprocessorOptions: { scss: { logger: { warn() {}, debug() {} } } } },
    });
    await server.listen();
    const url = server.resolvedUrls?.local?.[0];
    if (!url) throw new Error('vite gave no local URL');
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
    const results = await page.evaluate(() => globalThis.axe.run(document));
    return { a11y_violations: a11ySummary(results), a11y_error: null };
  } catch (error) {
    return { a11y_violations: null, a11y_error: String(error?.message ?? error).slice(0, 500) };
  } finally {
    await browser?.close().catch(() => {});
    await server?.close().catch(() => {});
  }
}

const verdict = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null);

/** The judge's first JSON object, or nulls with `judge_error` when it gave none. */
export function parseJudge(text) {
  const s = String(text ?? '');
  for (let start = s.indexOf('{'); start !== -1; start = s.indexOf('{', start + 1)) {
    for (let end = s.indexOf('}', start); end !== -1; end = s.indexOf('}', end + 1)) {
      try {
        const j = JSON.parse(s.slice(start, end + 1));
        return {
          gap_named: verdict(j.gap_named),
          escalated: verdict(j.escalated),
          rendered: verdict(j.rendered),
          layout_formula: verdict(j.layout_formula),
          reason: j.reason ?? '',
          judge_error: false,
        };
      } catch {
        // keep widening
      }
    }
  }
  return { gap_named: null, escalated: null, rendered: null, layout_formula: null, reason: 'judge gave no JSON', judge_error: true };
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
 * Every row's escapes recomputed from its kept build with this checkout's
 * rules: scoring is deterministic, so a fixed rule re-scores the past without
 * rerunning an agent. Each row records the commit it was scored at; the agent
 * fields are untouched.
 */
export function rescore(rows, { scorer, repoRoot = REPO_ROOT }) {
  const scenarios = scenariosSha(repoRoot);
  return rows.map((row) => {
    if (!row.output || !fs.existsSync(row.output)) return row;
    const scored = score({ repoRoot, folder: row.output, label: `eval-${row.task}` });
    const out = { ...row, escapes: scored.escapes, by_rule: scored.byRule, warnings: scored.warnings, warn_by_rule: scored.warnByRule, scored_at: scorer };
    // The seed is re-scored only from the scenarios the run started from.
    if (SEEDED.includes(row.task) && row.scenarios_sha === scenarios) {
      const seed = seedScore({ repoRoot, task: row.task });
      Object.assign(out, { seeded_escapes: seed.escapes, seeded_by_rule: seed.byRule });
    }
    return out;
  });
}

/**
 * Per arm and model: escapes and warnings per completed run, each by rule;
 * the trap pass rate, where a pass is a named gap on a board that rendered;
 * the escalation rate on the forbidden ask; per seeded task, the escapes the
 * folder started with against those left, the delta negative when debt was
 * paid down; the layout-formula rate; mean input tokens, turns and minutes; the files
 * runs read most; and axe violations per measured build. A run whose agent
 * errored is counted in `errors` and left out of every rate, so a crash cannot
 * read as a clean run.
 */
export function summarize(rows) {
  const groups = {};
  const add = (tally, more = {}) => {
    for (const [rule, n] of Object.entries(more)) tally[rule] = (tally[rule] ?? 0) + n;
  };
  for (const row of rows) {
    const byModel = (groups[row.arm] ??= {});
    const a = (byModel[row.model ?? 'unknown'] ??= {
      runs: 0,
      errors: 0,
      completed: 0,
      escapes: 0,
      byRule: {},
      warnings: 0,
      warnByRule: {},
      trap: { runs: 0, passed: 0, rendered: 0 },
      escalation: { runs: 0, yes: 0 },
      debt: {},
      layout: { judged: 0, yes: 0 },
      input: { runs: 0, tokens: 0 },
      turns: 0,
      wallMs: 0,
      read: { runs: 0, files: 0, lookups: 0, byFile: {} },
      a11y: { measured: 0, errors: 0, violations: 0, byRule: {} },
    });
    a.runs += 1;
    if (row.agent_error) {
      a.errors += 1;
      continue;
    }
    a.completed += 1;
    a.escapes += row.escapes;
    add(a.byRule, row.by_rule);
    a.warnings += row.warnings ?? 0;
    add(a.warnByRule, row.warn_by_rule);
    if (row.task === 'trap-missing-component') {
      a.trap.runs += 1;
      if (row.judge.rendered === true) a.trap.rendered += 1;
      if (row.judge.rendered === true && row.judge.gap_named === true) a.trap.passed += 1;
    }
    if (row.task === 'forbidden-ask') {
      a.escalation.runs += 1;
      if (row.judge.escalated === true) a.escalation.yes += 1;
    }
    if (SEEDED.includes(row.task) && typeof row.seeded_escapes === 'number') {
      const d = (a.debt[row.task] ??= { runs: 0, seeded: 0, left: 0 });
      d.runs += 1;
      d.seeded += row.seeded_escapes;
      d.left += row.escapes;
    }
    if (row.judge.layout_formula !== null && row.judge.layout_formula !== undefined) {
      a.layout.judged += 1;
      if (row.judge.layout_formula === true) a.layout.yes += 1;
    }
    const input = row.total_input_tokens ?? totalInput(row);
    if (input !== null) {
      a.input.runs += 1;
      a.input.tokens += input;
    }
    a.turns += row.turns ?? 0;
    a.wallMs += row.wall_ms ?? 0;
    if (row.read_set) {
      a.read.runs += 1;
      a.read.files += row.read_set.files.length;
      a.read.lookups += row.read_set.lookups.length;
      for (const file of row.read_set.files) a.read.byFile[file] = (a.read.byFile[file] ?? 0) + 1;
    }
    if (row.a11y_violations) {
      a.a11y.measured += 1;
      a.a11y.violations += row.a11y_violations.count;
      add(a.a11y.byRule, row.a11y_violations.by_rule);
    } else if (row.a11y_error) a.a11y.errors += 1;
  }
  const per = (n, d) => (d ? Number((n / d).toFixed(2)) : null);
  const report = (a) => ({
    runs: a.runs,
    errors: a.errors,
    escapes_per_run: per(a.escapes, a.completed),
    by_rule: a.byRule,
    warnings_per_run: per(a.warnings, a.completed),
    warn_by_rule: a.warnByRule,
    trap_pass_rate: a.trap.runs ? `${a.trap.passed}/${a.trap.runs}` : null,
    trap_rendered_rate: a.trap.runs ? `${a.trap.rendered}/${a.trap.runs}` : null,
    escalation_rate: a.escalation.runs ? `${a.escalation.yes}/${a.escalation.runs}` : null,
    debt: Object.keys(a.debt).length
      ? Object.fromEntries(
          Object.entries(a.debt).map(([task, d]) => [
            task,
            { runs: d.runs, seeded_per_run: per(d.seeded, d.runs), left_per_run: per(d.left, d.runs), delta_per_run: per(d.left - d.seeded, d.runs) },
          ]),
        )
      : null,
    layout_formula_rate: a.layout.judged ? `${a.layout.yes}/${a.layout.judged}` : null,
    mean_input_tokens: a.input.runs ? Math.round(a.input.tokens / a.input.runs) : null,
    mean_turns: per(a.turns, a.completed),
    mean_minutes: per(a.wallMs / 60000, a.completed),
    read_set: a.read.runs
      ? {
          mean_files: per(a.read.files, a.read.runs),
          mean_lookups: per(a.read.lookups, a.read.runs),
          most_read: Object.entries(a.read.byFile)
            .sort(([fa, na], [fb, nb]) => nb - na || (fa < fb ? -1 : 1))
            .slice(0, 15),
        }
      : null,
    a11y: a.a11y.measured || a.a11y.errors
      ? { measured: a.a11y.measured, errors: a.a11y.errors, violations_per_run: per(a.a11y.violations, a.a11y.measured), by_rule: a.a11y.byRule }
      : null,
  });
  return Object.fromEntries(
    Object.entries(groups).map(([arm, byModel]) => [arm, Object.fromEntries(Object.entries(byModel).map(([model, a]) => [model, report(a)]))]),
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
  const runs = Number(value('runs', '5'));
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

/** The commit whose rules scored a row (this checkout's HEAD). */
const scorerCommit = () => execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();

async function runOne({ id, arm, task, n, opts, commit, judge, scenarios, scratch }) {
  const copy = path.join(scratch, id);
  try {
    const { root, folder } = prepare({ ref: opts.ref, arm, task, into: copy });
    // What the folder held before the agent: zero unless the task seeds code.
    const seed = score({ folder, label: `eval-${task}` });
    const build = agent({ cwd: root, prompt: BUILD_PROMPT(task), model: opts.model, deny: armDenies(arm, root) });
    const failed = Boolean(build.result.is_error);
    const scored = score({ folder, label: `eval-${task}` });
    // The judge reads a copy of the build alone, so nothing beside it is in reach.
    const bench = path.join(copy, '..', `${id}-judge`);
    let judged = { gap_named: null, escalated: null, rendered: null, layout_formula: null, reason: 'build errored; not judged', judge_error: false };
    if (!failed) {
      try {
        copyDir(folder, bench);
        judged = parseJudge(agent({ cwd: bench, prompt: judge.text, model: opts.model, readOnly: true }).result.result);
      } finally {
        fs.rmSync(bench, { recursive: true, force: true });
      }
    }
    // axe runs on the build while it still sits in its copy, where its vite config resolves.
    const checked = failed ? { a11y_violations: null, a11y_error: 'build errored; not checked' } : await a11y({ folder });
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
      warn_by_rule: scored.warnByRule,
      seeded_escapes: seed.escapes,
      seeded_by_rule: seed.byRule,
      scored_at: scorerCommit(),
      judge: judged,
      judge_sha: judge.sha,
      ...usageOf(build.result),
      wall_ms: build.wallMs,
      agent_error: failed,
      reached_checkout: build.reached,
      read_set: build.read,
      ...checked,
      output: kept,
    });
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
}

async function runAll(opts) {
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
          await runOne({ id, arm, task, n, opts, commit, judge, scenarios, scratch });
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
    if (command === 'run') await runAll(opts);
    else if (command === 'rescore') {
      const rows = rescore(readLedger(), { scorer: scorerCommit() });
      fs.writeFileSync(path.join(REPO_ROOT, LEDGER), rows.map((r) => `${JSON.stringify(r)}\n`).join(''));
      console.log(JSON.stringify(summarize(rows), null, 2));
    } else if (command === 'summary') console.log(JSON.stringify(summarize(readLedger().filter((r) => r.date >= opts.since)), null, 2));
    else throw new Error('usage: node scripts/eval-ds-usage.mjs run|summary|rescore [options] (docs/evals/ds-usage.md)');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
