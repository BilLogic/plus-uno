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
 *   lookup           current plus the copy's own `plus-ds` MCP, all five tools.
 *
 * Everything but the agent and judge calls is deterministic: the copies, the
 * scoring, the ledger rows and the summary.
 *
 *   node scripts/eval-ds-usage.mjs run [--arms control,current] [--tasks a,b] [--runs 2] [--allow-metered] [--model sonnet] [--ref origin/main] [--scratch DIR]
 *   --model gemini-* runs the builds and the judge on Gemini CLI over Vertex (lib/gemini-agent.mjs).
 *   node scripts/eval-ds-usage.mjs summary [--since YYYY-MM-DD]
 *   node scripts/eval-ds-usage.mjs compare [--baseline current] [--commit SHA]   the keep rule
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
import { escapesIn, pageRootOf, pagesOf } from './lib/ds-usage.mjs';
import { blankComments, jsxElementsOf } from './lib/jsx-scan.mjs';
import { isEntry } from './lib/findings.mjs';
import { estimateGeminiCost, GEMINI_PRICE, isGemini, runGemini, vertexBudget, vertexMissing } from './lib/gemini-agent.mjs';
import { headLinks } from './lib/registry.mjs';

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
  'triage-repair',
  'workflow-canvas',
  'session-review-queue',
];
/**
 * Tasks whose folder starts with code in it, escapes included: recorded debt
 * from a prototype, or a component written in retired names. Each row records
 * what the folder held before the agent began, so debt left reads against
 * debt seeded.
 */
export const SEEDED = ['debt-extend', 'migrate-retired', 'triage-repair'];
export const ARMS = ['control', 'current', 'hook-off', 'checker-removed', 'lookup'];
/** The arms that add the design-system lookup to current, and the tools each serves (by `ds` subcommand). */
export const LOOKUP_ARMS = ['lookup'];
const LOOKUP_TOOLS = ['find', 'get', 'tokens', 'guide', 'check'];
/**
 * The default run is small: three arms, four tasks, two runs, 24 builds. It
 * answers the first question (does the harness or the checker earn the
 * result) at a cost one subscription window absorbs. Widen it by flags only
 * when a small run leaves the answer unclear.
 */
export const DEFAULT_ARMS = ['control', 'current', 'checker-removed'];
export const DEFAULT_TASKS = ['page-from-prd', 'trap-missing-component', 'debt-extend', 'session-review-queue'];
/** Variables that send `claude -p` to metered billing instead of the subscription login. */
export const METERED = ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_BEDROCK'];

/** The metered-billing variables set in `env`; a run refuses to start on any of them unless `--allow-metered`. */
export function meteredIn(env) {
  return METERED.filter((name) => env[name]);
}
/** Durable copies of what each agent built, beside the ledger row that scores it. */
export const OUTPUTS = path.join(os.homedir(), 'Documents/Claude/Projects/PLUS/evals/ds-usage');

/** Paths the control arm removes: the harness's design-system surface. */
export const CONTROL_REMOVED = [
  'GLOSSARY.md',
  'docs/conventions/design-system-glossary.md',
  'scripts/check-ds-usage.test.mjs',
  'scripts/lib/ds-usage.test.mjs',
  'scripts/lib/__fixtures__/ds-usage',
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
export const CHECKER_REMOVED = ['scripts/check-ds-usage.test.mjs', 'scripts/lib/ds-usage.test.mjs', 'scripts/lib/__fixtures__/ds-usage', 'scripts/check-ds-usage.mjs', 'scripts/lib/ds-usage.mjs', 'scripts/baselines/ds-usage.json', '.cursor/hooks/ds-usage'];

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
  for (const file of filesUnder(root).filter((f) => !['expected.json', 'reference.png'].includes(path.basename(f)))) {
    hash.update(path.relative(root, file)).update(fs.readFileSync(file));
  }
  return hash.digest('hex').slice(0, 12);
}

/**
 * Inject the shared font and Font Awesome Free `<link>` tags from
 * `.storybook/preview-head.html` into an HTML document's `<head>`.
 */
export function withHeadLinks(html, repoRoot = REPO_ROOT) {
  const links = headLinks(repoRoot).filter((link) => !html.includes(link));
  if (!links.length) return html;
  const block = links.map((link) => `    ${link}`).join('\n');
  return /<\/head>/i.test(html) ? html.replace(/([ \t]*)<\/head>/i, (_, indent) => `${block}\n${indent}</head>`) : `${block}\n${html}`;
}

/** Ensure `folder/index.html` loads the shared fonts and Font Awesome Free links. */
export function ensureHeadLinks(folder, repoRoot = REPO_ROOT) {
  const index = path.join(folder, 'index.html');
  if (!fs.existsSync(index)) return;
  const current = fs.readFileSync(index, 'utf8');
  const next = withHeadLinks(current, repoRoot);
  if (next !== current) fs.writeFileSync(index, next);
}

/**
 * Load a task's answer key (`expected.json`), or `null` when the task has none.
 */
export function expectedFor(task, repoRoot = REPO_ROOT) {
  if (!task) return null;
  const file = path.join(repoRoot, SCENARIOS, task, 'expected.json');
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const key of ['screens', 'patterns', 'required_placements', 'against_placements']) {
    if (!Array.isArray(data[key])) throw new Error(`${task}/expected.json: missing ${key} array`);
    for (const item of data[key]) {
      if (!item?.id) throw new Error(`${task}/expected.json: item in ${key} missing id`);
      if (!item.page && !(Array.isArray(item.pages) && item.pages.length)) {
        throw new Error(`${task}/expected.json: item ${item.id} in ${key} missing page citation`);
      }
      if (!item.section || typeof item.section !== 'string') {
        throw new Error(`${task}/expected.json: item ${item.id} in ${key} missing section citation`);
      }
    }
  }
  return data;
}
export const loadExpected = expectedFor;

/** Every expected item in an answer key, in section order. */
export function expectedItems(expected) {
  if (!expected) return [];
  const withKind = (item, kind) => ({
    ...item,
    kind,
    page: item.page ?? item.pages?.[0] ?? null,
    section: item.section ?? kind,
    scoring: item.scoring ?? 'judge',
  });
  return [
    ...(expected.screens ?? []).map((s) => withKind(s, 'screen')),
    ...(expected.patterns ?? []).map((p) => withKind(p, 'pattern')),
    ...(expected.required_placements ?? []).map((r) => withKind(r, 'required_placement')),
    ...(expected.against_placements ?? []).map((a) => withKind(a, 'against_placement')),
  ];
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
  // Eval implementation and tests are answer-key material in every arm.
  for (const rel of ['scripts/eval-ds-usage.mjs', 'scripts/eval-ds-usage.test.mjs', 'scripts/lib/gemini-agent.mjs', 'scripts/lib/gemini-agent.test.mjs']) fs.rmSync(path.join(into, rel), { recursive: true, force: true });
  // The scenarios are the answer key's neighbors; neither arm sees them.
  fs.rmSync(path.join(into, 'docs/evals'), { recursive: true, force: true });
  const folder = path.join(into, 'prototypes', `eval-${task}`);
  copyDir(path.join(repoRoot, SCENARIOS, '_template'), folder);
  copyDir(path.join(repoRoot, SCENARIOS, task), folder);
  fs.rmSync(path.join(folder, 'expected.json'), { force: true });
  fs.rmSync(path.join(folder, 'reference.png'), { force: true });
  ensureHeadLinks(folder, repoRoot);
  return { root: into, folder };
}

/**
 * Escapes in a built prototype, by rule, scored by this checkout's rules, and
 * the warnings beside them, by rule too. The template's own files are scored;
 * they carry none.
 *
 * `layoutFormula` is `ds/page-starts-from-pattern` read as a verdict: true
 * when no page-level module of the build starts from a hand-styled container,
 * false when one does, null when no page-level module renders an element to
 * judge (an `App` that still returns `null`).
 */
export function score({ repoRoot = REPO_ROOT, folder, label }) {
  const ctx = contextOf(repoRoot);
  const files = filesUnder(folder).map((abs) => ({
    path: `${label}/${path.relative(folder, abs).split(path.sep).join('/')}`,
    text: fs.readFileSync(abs, 'utf8'),
  }));
  const pages = pagesOf(files);
  const findings = files.flatMap((file) => escapesIn({ ...file, page: pages.has(file.path) }, ctx));
  const judged = files.some((file) => pages.has(file.path) && /\.[jt]sx$/.test(file.path) && pageRootOf(blankComments(file.text)));
  const shells = findings.some((f) => f.rule === 'ds/page-starts-from-pattern');
  const byRule = {};
  const warnByRule = {};
  for (const f of findings) {
    const tally = f.level === 'fail' ? byRule : warnByRule;
    tally[f.rule] = (tally[f.rule] ?? 0) + 1;
  }
  const escapes = findings.filter((f) => f.level === 'fail').length;
  return { escapes, warnings: findings.length - escapes, byRule, warnByRule, layoutFormula: shells ? false : judged ? true : null };
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
    fs.rmSync(path.join(dir, 'expected.json'), { force: true });
    fs.rmSync(path.join(dir, 'reference.png'), { force: true });
    ensureHeadLinks(dir, repoRoot);
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
  const afterFiles = [];
  const afterLookups = [];
  let wrote = false;
  for (const { name, input = {} } of toolCalls(stdout)) {
    if (name === 'Write' || name === 'Edit' || name === 'NotebookEdit') {
      wrote = true;
    } else if (name === 'Read') {
      const file = rel(input.file_path);
      if (!/^prototypes\/eval-/.test(file) && !files.includes(file)) {
        files.push(file);
        if (wrote) afterFiles.push(file);
      }
    } else if (name === 'Grep') {
      const entry = `Grep ${input.pattern}${input.path ? ` in ${rel(input.path)}` : ''}`;
      lookups.push(entry);
      if (wrote) afterLookups.push(entry);
    } else if (name === 'Glob') {
      const entry = `Glob ${input.pattern}${input.path ? ` in ${rel(input.path)}` : ''}`;
      lookups.push(entry);
      if (wrote) afterLookups.push(entry);
    } else if (name === 'Bash') {
      const entry = `Bash ${String(input.command ?? '').slice(0, 160)}`;
      lookups.push(entry);
      if (wrote) afterLookups.push(entry);
    } else if (name.startsWith('mcp__plus-ds__')) {
      const entry = `${name.slice('mcp__plus-ds__'.length)} ${JSON.stringify(input).slice(0, 160)}`;
      lookups.push(entry);
      if (wrote) afterLookups.push(entry);
    }
  }
  return afterFiles.length || afterLookups.length
    ? { files, lookups, after_write: { files: afterFiles, lookups: afterLookups } }
    : { files, lookups };
}

const normPage = (p = '') =>
  String(p)
    .replace(/^\/+/, '')
    .replace(/^design-system\/agent-views\/pages\//, 'design-system/agent-views/');

const pageMatchesFile = (expectedPage, file) => {
  const exp = normPage(expectedPage);
  const got = normPage(file);
  if (exp === got) return true;
  // Also match the authored MDX source for the same template or pattern page.
  const patMdx = /^design-system\/agent-views\/patterns\/([A-Za-z0-9]+)\.md$/.exec(exp);
  if (patMdx && got === `design-system/src/storybook-docs/patterns/${patMdx[1]}/${patMdx[1]}.mdx`) return true;
  const tplMdx = /^design-system\/agent-views\/templates\/([A-Za-z0-9]+)\.md$/.exec(exp);
  if (tplMdx && (got === `design-system/src/storybook-docs/templates/${tplMdx[1]}.mdx` || got === `design-system/src/templates/${tplMdx[1]}/${tplMdx[1]}.mdx`)) return true;
  const compTpl = /^design-system\/src\/templates\/([A-Za-z0-9]+)\/index\.md$/.exec(exp);
  if (compTpl && got === `design-system/src/templates/${compTpl[1]}/${compTpl[1]}.mdx`) return true;
  return false;
};

const guideTopicsFromLookup = (lookup = '') => {
  const s = String(lookup);
  if (s.startsWith('ds_guide ')) {
    try {
      const arg = JSON.parse(s.slice('ds_guide '.length));
      if (arg?.topic) return [String(arg.topic).trim().toLowerCase()];
    } catch {
      const m = /"topic"\s*:\s*"([^"]+)"/.exec(s);
      if (m) return [m[1].trim().toLowerCase()];
    }
  }
  const bash = /^Bash\s+.*\b(?:ds(?:\.mjs)?|plus-ds)(?:\s+--)?\s+guide\s+["']?([a-z0-9-]+)["']?/i.exec(s);
  return bash ? [bash[1].toLowerCase()] : [];
};

/**
 * Deterministic reach from `read_set` against the task's answer key (`expected`):
 * did the run open (`Read`) or `ds guide` the expected Template and Pattern
 * pages, and was that before its first write. Returns `null` when no answer
 * key exists.
 */
export function reach(read, expected) {
  if (!expected || !read) return null;
  const files = read.files ?? [];
  const lookups = read.lookups ?? [];
  const afterFileSet = new Set(read.after_write?.files ?? []);
  const beforeFiles = read.before_write?.files ?? files.filter((f) => !afterFileSet.has(f));
  let beforeLookups;
  if (read.before_write?.lookups) {
    beforeLookups = read.before_write.lookups;
  } else if (read.after_write?.lookups) {
    const afterCount = read.after_write.lookups.length;
    beforeLookups = afterCount ? lookups.slice(0, Math.max(0, lookups.length - afterCount)) : lookups;
  } else {
    // Legacy rows without `after_write`: slice before the first build or inline-code check.
    const firstWriteIdx = lookups.findIndex((l) => /^Write\b|^Edit\b|\bvite build\b|\besbuild\b|^ds_check\s+\{.*"code"/.test(l));
    beforeLookups = firstWriteIdx === -1 ? lookups : lookups.slice(0, firstWriteIdx);
  }
  const allTopics = new Set(lookups.flatMap(guideTopicsFromLookup));
  const beforeTopics = new Set(beforeLookups.flatMap(guideTopicsFromLookup));

  const templateSpecs = [];
  for (const s of expected.screens ?? []) {
    const pages = s.pages ?? (s.page ? [s.page] : []);
    const guides = (s.guides ?? (s.guide ? [s.guide] : [])).map((g) => String(g).toLowerCase());
    for (const p of pages) {
      if (!templateSpecs.some((t) => t.page === p)) {
        const stem = path.basename(p, '.md') === 'index' ? path.basename(path.dirname(p)).replace(/^Pattern/, '').toLowerCase() : path.basename(p, '.md').toLowerCase();
        templateSpecs.push({ page: p, topics: [...new Set([stem, ...guides])] });
      }
    }
  }
  const patternSpecs = [];
  for (const p of expected.patterns ?? []) {
    if (!p.page) continue;
    const topics = [p.guide, ...(p.aliases ?? [])].filter(Boolean).map((g) => String(g).toLowerCase());
    if (!patternSpecs.some((x) => x.page === p.page)) patternSpecs.push({ page: p.page, topics });
  }

  const checkGroup = (specs) => {
    const exp = specs.map((s) => s.page);
    const hit = specs
      .filter((s) => files.some((f) => pageMatchesFile(s.page, f)) || s.topics.some((t) => allTopics.has(t)))
      .map((s) => s.page);
    const before = specs
      .filter((s) => beforeFiles.some((f) => pageMatchesFile(s.page, f)) || s.topics.some((t) => beforeTopics.has(t)))
      .map((s) => s.page);
    return { expected: exp, reached: hit, before_first_write: before };
  };

  const templates = checkGroup(templateSpecs);
  const patterns = checkGroup(patternSpecs);
  const allExpected = [...templates.expected, ...patterns.expected];
  const allReached = [...templates.reached, ...patterns.reached];
  const allBefore = [...templates.before_first_write, ...patterns.before_first_write];
  return {
    expected: allExpected,
    reached: allReached,
    before_first_write: allBefore,
    templates,
    patterns,
    hit: allReached.length > 0,
    all_before_write: allReached.length > 0 && allBefore.length === allReached.length,
  };
}

/**
 * An arm's MCP wiring in its copy at `root`: the `--mcp-config` the agent
 * starts with and the MCP tools it may call. A lookup arm runs the copy's own
 * `scripts/ds-mcp.mjs`, so the server answers from the commit under test;
 * every other arm gets no server. The `ds` command stays in every copy that
 * has it, as an npm script.
 */
export function lookupWiring(arm, root) {
  if (!LOOKUP_ARMS.includes(arm)) return { mcpConfig: '{"mcpServers":{}}', allowed: [] };
  const at = path.join(root, 'scripts/ds-mcp.mjs');
  if (!fs.existsSync(at)) throw new Error(`${arm}: the copy has no scripts/ds-mcp.mjs; pick a --ref that has the lookup`);
  // The real path: the server starts only when argv[1] is its own module URL, and the scratch dir is often a symlink (/var → /private/var).
  const server = fs.realpathSync(at);
  return {
    mcpConfig: JSON.stringify({ mcpServers: { 'plus-ds': { type: 'stdio', command: 'node', args: [server] } } }),
    allowed: LOOKUP_TOOLS.map((op) => `mcp__plus-ds__ds_${op}`),
  };
}

/** One headless agent run in `cwd`; returns its result (tokens, turns, cost), any reach into the checkout, and wall time. */
function agent({ cwd, prompt, model, readOnly = false, deny = [], mcp = lookupWiring('none', cwd) }) {
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
    mcp.mcpConfig,
    ...(mcp.allowed.length ? ['--allowedTools', ...mcp.allowed] : []),
    '--disallowedTools',
    ...(readOnly ? [...DISALLOWED, 'Write', 'Edit', 'NotebookEdit', 'Bash'] : DISALLOWED),
  ];
  const started = Date.now();
  const out = isGemini(model)
    ? runGemini({ cwd, prompt, model, readOnly, disallowed: DISALLOWED, deny, mcp, spawn: spawnSync })
    : spawnSync('claude', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 45 * 60 * 1000 });
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
export async function a11y({ folder, screenshotPath, load = loadBrowserTools }) {
  let server;
  let browser;
  try {
    const { chromium, vite, axePath } = await load();
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.setViewportSize?.({ width: 1440, height: 960 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.evaluate(() => document.fonts?.ready);
    if (screenshotPath) await page.screenshot?.({ path: screenshotPath });
    await page.addScriptTag({ path: axePath ?? createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
    const results = await page.evaluate(() => globalThis.axe.run(document));
    return { a11y_violations: a11ySummary(results), a11y_error: null };
  } catch (error) {
    return { a11y_violations: null, a11y_error: String(error?.message ?? error).slice(0, 500) };
  } finally {
    await browser?.close().catch(() => {});
    await server?.close().catch(() => {});
  }
}

/**
 * Render `folder` at 1440x960 with fonts loaded and write `screenshot.png`.
 * If `folder` is a standalone kept build outside a repo copy, stages it in a
 * temporary directory with `design-system` and `node_modules` linked from
 * `repoRoot` so its `vite.config.js` resolves.
 */
export async function screenshot({ folder, screenshotPath = path.join(folder, 'screenshot.png'), repoRoot = REPO_ROOT, load = loadBrowserTools }) {
  ensureHeadLinks(folder, repoRoot);
  const inCopy = fs.existsSync(path.resolve(folder, '../../design-system/src'));
  const stage = inCopy ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-shot-'));
  let server;
  let browser;
  try {
    let target = folder;
    if (stage) {
      for (const link of ['design-system', 'node_modules']) {
        const src = path.join(repoRoot, link);
        if (fs.existsSync(src)) fs.symlinkSync(fs.realpathSync(src), path.join(stage, link));
      }
      target = path.join(stage, 'prototypes', path.basename(folder));
      copyDir(folder, target);
      ensureHeadLinks(target, repoRoot);
    }
    const { chromium, vite } = await load();
    server = await vite.createServer({
      configFile: path.join(target, 'vite.config.js'),
      root: target,
      logLevel: 'silent',
      server: { port: 0, strictPort: false },
      css: { preprocessorOptions: { scss: { logger: { warn() {}, debug() {} } } } },
    });
    await server.listen();
    const url = server.resolvedUrls?.local?.[0];
    if (!url) throw new Error('vite gave no local URL');
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.setViewportSize?.({ width: 1440, height: 960 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.screenshot({ path: screenshotPath });
    return screenshotPath;
  } finally {
    await browser?.close().catch(() => {});
    await server?.close().catch(() => {});
    if (stage) fs.rmSync(stage, { recursive: true, force: true });
  }
}

export const FIT_VERDICTS = ['followed', 'partly', 'ignored', 'n/a'];

/** Closed-form fit score `(followed + 0.5 * partly) / applicable` and counts over per-item verdicts. */
export function fitScore(items) {
  if (!items || typeof items !== 'object') return null;
  const entries = items.items && typeof items.items === 'object' ? Object.values(items.items) : Object.values(items).filter((v) => v && typeof v === 'object' && 'verdict' in v);
  let followed = 0;
  let partly = 0;
  let ignored = 0;
  for (const item of entries) {
    if (item?.verdict === 'followed') followed += 1;
    else if (item?.verdict === 'partly') partly += 1;
    else if (item?.verdict === 'ignored') ignored += 1;
  }
  const applicable = followed + partly + ignored;
  const score = applicable ? Number(((followed + 0.5 * partly) / applicable).toFixed(2)) : null;
  return { score, followed, partly, ignored, applicable };
}

/**
 * Deterministic structural fit verdicts from the checker and JSX structure for
 * answer-key items with `scoring === 'checker'`.
 */
export function structuralFit({ folder, expected, repoRoot = REPO_ROOT }) {
  if (!expected || !folder || !fs.existsSync(folder)) return {};
  const ctx = contextOf(repoRoot);
  const files = filesUnder(folder)
    .filter((abs) => /\.[jt]sx$/.test(abs))
    .map((abs) => ({
      path: `eval-${expected.task ?? 'x'}/${path.relative(folder, abs).split(path.sep).join('/')}`,
      text: fs.readFileSync(abs, 'utf8'),
    }));
  const pages = pagesOf(files);
  const findings = files.flatMap((file) => escapesIn({ ...file, page: pages.has(file.path) }, ctx));
  const elements = files.flatMap((file) => jsxElementsOf(blankComments(file.text)).map((el) => ({ ...el, file })));
  const names = new Set(elements.map((el) => el.name.split('.')[0]));
  const hasBannerViolation = findings.some((f) => f.rule === 'ds/placement' && /page header|page message order/i.test(f.message));
  const hasShellViolation = findings.some((f) => f.rule === 'ds/page-starts-from-pattern');

  const out = {};
  for (const item of expectedItems(expected)) {
    if (item.scoring !== 'checker') continue;
    const check = item.check ?? {};
    let verdict = 'ignored';
    let reason = '';
    if (check.kind === 'template') {
      const comps = check.components ?? [];
      const present = comps.filter((c) => names.has(c));
      if (!hasShellViolation && present.length === comps.length && comps.length > 0) {
        verdict = 'followed';
        reason = `checker: page starts from template (${present.join(', ')})`;
      } else if (present.length > 0) {
        verdict = 'partly';
        reason = `checker: uses ${present.join(', ')}; missing ${comps.filter((c) => !names.has(c)).join(', ') || 'template page root'}`;
      } else {
        verdict = 'ignored';
        reason = `checker: missing expected template components (${comps.join(', ')})`;
      }
    } else if (check.kind === 'header-filters') {
      const accepts = check.accepts ?? ['FilterButton', 'FilterMenu'];
      const rejects = check.rejects ?? ['Select', 'PopupSelect'];
      const usedAccepted = accepts.filter((c) => names.has(c));
      const usedRejected = rejects.filter((c) => names.has(c));
      const filtersSlot = elements.some((el) => el.name === 'Section' && el.attributes.some((a) => a.name === 'filters'));
      if ((filtersSlot || usedAccepted.length > 0) && usedRejected.length === 0) {
        verdict = 'followed';
        reason = `checker: quick filters through ${filtersSlot ? "Section's filters prop" : usedAccepted.join(', ')}`;
      } else if (usedRejected.length > 0) {
        verdict = 'ignored';
        reason = `checker: uses ${usedRejected.join(', ')} instead of ${accepts.join(' or ')}`;
      } else {
        verdict = 'ignored';
        reason = `checker: no ${accepts.join(' or ')} found`;
      }
    } else if (check.kind === 'banner-placement') {
      const hasBanner = names.has('Banner');
      const pageSlot = elements.some((el) => el.name === 'Page' && el.attributes.some((a) => a.name === 'banner'));
      if (pageSlot || (hasBanner && !hasBannerViolation)) {
        verdict = 'followed';
        reason = pageSlot ? 'checker: Banner placed in Page.banner slot' : 'checker: Banner placed after PageHeader with no placement violation';
      } else if (hasBanner && hasBannerViolation) {
        verdict = 'ignored';
        reason = 'checker: ds/placement flagged Banner before PageHeader';
      } else {
        verdict = 'ignored';
        reason = 'checker: no Banner rendered on Page';
      }
    } else if (check.kind === 'no-banner-before-header') {
      if (!hasBannerViolation) {
        verdict = 'followed';
        reason = 'checker: Banner is not placed before PageHeader';
      } else {
        verdict = 'ignored';
        reason = 'checker: ds/placement flagged Banner before PageHeader';
      }
    } else if (check.kind === 'slot-use') {
      const owner = check.owner;
      const prop = check.prop;
      const hasSlot = elements.some((el) => el.name === owner && el.attributes.some((a) => a.name === prop))
        || (owner === 'Frame' && prop === 'panel' && files.some((f) => /\busePanelControl\b/.test(f.text)));
      const comps = check.components ?? [];
      const hasComp = !comps.length || comps.some((c) => names.has(c));
      if (hasSlot && hasComp) {
        verdict = 'followed';
        reason = `checker: ${owner}.${prop} slot wired with ${comps.filter((c) => names.has(c)).join(', ') || prop}`;
      } else if (hasSlot || hasComp) {
        verdict = 'partly';
        reason = `checker: partial ${owner}.${prop} wiring`;
      } else {
        verdict = 'ignored';
        reason = `checker: ${owner}.${prop} slot not used`;
      }
    } else if (check.kind === 'component-present') {
      const comps = check.components ?? [];
      const present = comps.filter((c) => names.has(c));
      if (present.length === comps.length && comps.length > 0) {
        verdict = 'followed';
        reason = `checker: uses ${present.join(', ')}`;
      } else if (present.length > 0) {
        verdict = 'partly';
        reason = `checker: uses ${present.join(', ')}; missing ${comps.filter((c) => !names.has(c)).join(', ')}`;
      } else {
        verdict = 'ignored';
        reason = `checker: missing ${comps.join(', ')}`;
      }
    }
    out[item.id] = { verdict, reason, scored_by: 'checker' };
  }
  return out;
}

/** Prompt for judging a build's semantic fit items from source against `expected.json`. */
export function fitPrompt(expected, { semanticOnly = false } = {}) {
  const all = expectedItems(expected);
  const items = semanticOnly ? all.filter((item) => item.scoring !== 'checker') : all;
  const ids = items.map((item) => item.id);
  return [
    'You are scoring one prototype an agent built against its task answer key (`expected.json`).',
    'Read `BRIEF.md`, `NOTES.md` (if present), `expected.json` and every file under `src/` in the current folder. Read source files only; do not read images.',
    'For every listed item id in `expected.json`, judge from the source code whether the build followed that expectation:',
    '- `"followed"`: the build implements the expected template, pattern variant or required placement (or, for `against_placements`, avoided the anti-pattern).',
    '- `"partly"`: the build partially follows the expectation but misses part of the variant or placement.',
    '- `"ignored"`: the build ignores the expected template, pattern variant or required placement (or, for `against_placements`, committed the anti-pattern).',
    '- `"n/a"`: the item does not apply.',
    `Reply with one JSON object keyed by item id (${ids.map((id) => `"${id}"`).join(', ')}) and nothing else:`,
    `{${ids.map((id) => `"${id}": {"verdict": "followed"|"partly"|"ignored"|"n/a", "reason": "<one sentence>"}`).join(', ')}}`,
  ].join('\n\n');
}

/** Parse the judge's per-item `fit` JSON against `expected` and merge any structural checker verdicts. */
export function parseFit(text, expected, structural = {}) {
  const items = expectedItems(expected);
  if (!items.length) return null;
  const s = String(text ?? '');
  let parsed = null;
  for (let start = s.indexOf('{'); start !== -1; start = s.indexOf('{', start + 1)) {
    for (let end = s.lastIndexOf('}'); end > start; end = s.lastIndexOf('}', end - 1)) {
      try {
        const j = JSON.parse(s.slice(start, end + 1));
        if (!j || typeof j !== 'object' || !items.some((item) => item.id in j)) continue;
        parsed = j;
        break;
      } catch {
        // keep narrowing
      }
    }
    if (parsed) break;
  }
  const byId = Object.fromEntries(
    items.map(({ id }) => {
      if (structural[id]) return [id, structural[id]];
      const entry = parsed?.[id];
      if (!parsed) return [id, { verdict: 'ignored', reason: 'judge gave no JSON' }];
      const v = FIT_VERDICTS.includes(entry?.verdict) ? entry.verdict : 'ignored';
      return [id, { verdict: v, reason: String(entry?.reason ?? '') }];
    }),
  );
  const summary = fitScore(byId);
  Object.defineProperty(byId, 'score', { value: summary.score, enumerable: false });
  Object.defineProperty(byId, 'followed', { value: summary.followed, enumerable: false });
  Object.defineProperty(byId, 'partly', { value: summary.partly, enumerable: false });
  Object.defineProperty(byId, 'ignored', { value: summary.ignored, enumerable: false });
  Object.defineProperty(byId, 'applicable', { value: summary.applicable, enumerable: false });
  return byId;
}

/** Judge a kept build folder against its task's answer key (`expected`): structural items by checker, semantic items by AI judge from source only. */
export function fitJudge({ folder, expected, model, repoRoot = REPO_ROOT, runAgent = agent }) {
  if (!expected) return { fit: null, fit_score: null, usage: null };
  const structural = structuralFit({ folder, expected, repoRoot });
  const semanticItems = expectedItems(expected).filter((item) => item.scoring !== 'checker');
  if (!semanticItems.length) {
    const fit = parseFit('{}', expected, structural);
    return { fit, fit_score: fitScore(fit), usage: null };
  }
  const bench = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-fit-judge-'));
  try {
    copyDir(folder, bench);
    // Gemini on Vertex rejects a turn that reads an image back ("Requests ending with a model turn"), so the judge reads source only.
    fs.rmSync(path.join(bench, 'screenshot.png'), { force: true });
    fs.rmSync(path.join(bench, 'reference.png'), { force: true });
    writeJson(path.join(bench, 'expected.json'), expected);
    const out = runAgent({ cwd: bench, prompt: fitPrompt(expected, { semanticOnly: true }), model, readOnly: true }).result;
    const fit = parseFit(out.result, expected, structural);
    return { fit, fit_score: fitScore(fit), usage: usageOf(out) };
  } finally {
    fs.rmSync(bench, { recursive: true, force: true });
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
          reason: j.reason ?? '',
          judge_error: false,
        };
      } catch {
        // keep widening
      }
    }
  }
  return { gap_named: null, escalated: null, rendered: null, reason: 'judge gave no JSON', judge_error: true };
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
    const expected = expectedFor(row.task, repoRoot);
    const out = {
      ...row,
      escapes: scored.escapes,
      by_rule: scored.byRule,
      warnings: scored.warnings,
      warn_by_rule: scored.warnByRule,
      layout_formula: scored.layoutFormula,
      reach: reach(row.read_set, expected),
      scored_at: scorer,
    };
    // The seed is re-scored only from the scenarios the run started from.
    if (SEEDED.includes(row.task) && row.scenarios_sha === scenarios) {
      const seed = seedScore({ repoRoot, task: row.task });
      Object.assign(out, { seeded_escapes: seed.escapes, seeded_by_rule: seed.byRule });
    }
    return out;
  });
}

/**
 * Re-score kept builds at `commit` (default `d4d96b1cb`): writes `reach`, a
 * 1440x960 `screenshot.png` with fonts loaded, and a per-item `fit` from the
 * task's answer key (`null` where no answer key exists) as new rows marked
 * `rejudge: true`. Only judge tokens are spent.
 */
export async function rejudge(
  rows,
  { commit = 'd4d96b1cb', scorer = scorerCommit(), repoRoot = REPO_ROOT, judgeFn = fitJudge, screenshotFn = screenshot } = {},
) {
  const targets = rows.filter((r) => r.harness_commit === commit && !r.rejudge && r.output && fs.existsSync(r.output));
  const out = [];
  for (const row of targets) {
    const scored = score({ repoRoot, folder: row.output, label: `eval-${row.task}` });
    const expected = expectedFor(row.task, repoRoot);
    const reachResult = reach(row.read_set, expected);
    const shotPath = path.join(row.output, 'screenshot.png');
    await screenshotFn({ folder: row.output, screenshotPath: shotPath, repoRoot });
    const { fit, usage } = expected ? await judgeFn({ folder: row.output, expected, model: row.model, repoRoot }) : { fit: null, usage: null };
    const fitSummary = fit ? fitScore(fit) : null;
    const judgeCost = isGemini(row.model) ? (usage ? estimateGeminiCost(usage) : 0) : null;
    out.push({
      ...row,
      date: new Date().toISOString(),
      rejudge: true,
      escapes: scored.escapes,
      by_rule: scored.byRule,
      warnings: scored.warnings,
      warn_by_rule: scored.warnByRule,
      layout_formula: scored.layoutFormula,
      scored_at: scorer,
      reach: reachResult,
      screenshot: shotPath,
      fit,
      fit_score: fitSummary,
      judge_usage: usage,
      ...(isGemini(row.model) ? { estimated_cost_usd: judgeCost } : {}),
    });
  }
  return out;
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
      reach: { runs: 0, hits: 0, expected: 0, reached: 0, beforeWrite: 0 },
      fit: { runs: 0, followed: 0, partly: 0, ignored: 0, applicable: 0 },
      clean: { runs: 0, inputRuns: 0, tokens: 0, turns: 0 },
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
    if (row.reach && Array.isArray(row.reach.expected)) {
      a.reach.runs += 1;
      if (row.reach.hit) a.reach.hits += 1;
      a.reach.expected += row.reach.expected.length;
      a.reach.reached += (row.reach.reached ?? []).length;
      a.reach.beforeWrite += (row.reach.before_first_write ?? []).length;
    }
    if (row.fit && typeof row.fit === 'object') {
      const items = row.fit.items && typeof row.fit.items === 'object' ? Object.values(row.fit.items) : Object.values(row.fit);
      a.fit.runs += 1;
      for (const item of items) {
        if (item?.verdict === 'followed') a.fit.followed += 1;
        else if (item?.verdict === 'partly') a.fit.partly += 1;
        else if (item?.verdict === 'ignored') a.fit.ignored += 1;
      }
      a.fit.applicable = a.fit.followed + a.fit.partly + a.fit.ignored;
    }
    if (['trap-missing-component', 'workflow-canvas'].includes(row.task)) {
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
    // The page rule's verdict; a row scored before the rule existed keeps its judge's.
    const layout = row.layout_formula !== undefined ? row.layout_formula : row.judge?.layout_formula;
    if (layout !== null && layout !== undefined) {
      a.layout.judged += 1;
      if (layout === true) a.layout.yes += 1;
    }
    const input = row.total_input_tokens ?? totalInput(row);
    if (input !== null) {
      a.input.runs += 1;
      a.input.tokens += input;
    }
    a.turns += row.turns ?? 0;
    a.wallMs += row.wall_ms ?? 0;
    if (row.escapes === 0) {
      a.clean.runs += 1;
      a.clean.turns += row.turns ?? 0;
      if (input !== null) {
        a.clean.inputRuns += 1;
        a.clean.tokens += input;
      }
    }
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
    clean_runs: a.clean.runs,
    escapes_per_run: per(a.escapes, a.completed),
    reach: a.reach.runs
      ? {
          runs: a.reach.runs,
          hit_rate: `${a.reach.hits}/${a.reach.runs}`,
          reached: `${a.reach.reached}/${a.reach.expected}`,
          before_first_write: `${a.reach.beforeWrite}/${a.reach.expected}`,
        }
      : null,
    fit: a.fit.runs
      ? {
          runs: a.fit.runs,
          score: per(a.fit.followed + 0.5 * a.fit.partly, a.fit.applicable),
          followed: a.fit.followed,
          partly: a.fit.partly,
          ignored: a.fit.ignored,
          applicable: a.fit.applicable,
        }
      : null,
    tokens_per_clean_build: a.clean.inputRuns ? Math.round(a.clean.tokens / a.clean.inputRuns) : null,
    turns_per_clean_build: per(a.clean.turns, a.clean.runs),
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

const KEEP_INPUT_DROP = 0.2;
const KEEP_TURNS_DROP = 3;

/**
 * The lookup's keep rule, per lookup arm and model, against a baseline arm at
 * the same harness commit (by default the latest commit a lookup arm ran at):
 * keep when fail-level escapes fall, or, at zero escapes on both sides, when
 * mean total input tokens fall by at least 20% or mean turns by at least 3.
 * Errored runs are left out. An arm is kept only when every model it ran on
 * keeps it; one delete deletes it; anything else is `no data`.
 */
export function compare(rows, { arms = LOOKUP_ARMS, baseline = 'current', commit } = {}) {
  const at =
    commit ??
    rows
      .filter((r) => arms.includes(r.arm) && !r.rejudge)
      .reduce((latest, r) => (!latest || r.date > latest.date ? r : latest), null)?.harness_commit ??
    null;
  const done = rows.filter((r) => r.harness_commit === at && !r.agent_error && !r.rejudge);
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const stats = (group) => {
    const input = group.map((r) => r.total_input_tokens ?? totalInput(r)).filter((n) => n !== null);
    const m = mean(input);
    const t = mean(group.map((r) => r.turns ?? 0));
    return { runs: group.length, mean_input_tokens: m === null ? null : Math.round(m), mean_turns: t === null ? null : Number(t.toFixed(2)), escapes: group.reduce((a, r) => a + r.escapes, 0) };
  };
  const models = [...new Set(done.filter((r) => r.arm === baseline || arms.includes(r.arm)).map((r) => r.model ?? 'unknown'))].sort();
  const verdictOf = (base, arm) => {
    if (!base.runs || !arm.runs) return { verdict: 'no data', input_drop: null, turns_drop: null, escapes: arm.escapes, reason: `no completed ${base.runs ? 'arm' : 'baseline'} runs` };
    const inputDrop = base.mean_input_tokens && arm.mean_input_tokens !== null ? Number(((base.mean_input_tokens - arm.mean_input_tokens) / base.mean_input_tokens).toFixed(4)) : null;
    const turnsDrop = Number((base.mean_turns - arm.mean_turns).toFixed(2));
    const cheaper = (inputDrop ?? 0) >= KEEP_INPUT_DROP || turnsDrop >= KEEP_TURNS_DROP;
    const fewer = arm.escapes < base.escapes;
    const reason = fewer
      ? `fail-level escapes fell ${base.escapes} -> ${arm.escapes}`
      : arm.escapes > 0
        ? `${arm.escapes} fail-level escape(s), not fewer than the baseline's ${base.escapes}`
        : cheaper
          ? `input ${inputDrop === null ? 'n/a' : `-${Math.round(inputDrop * 100)}%`}, turns -${turnsDrop}`
          : `input fell ${inputDrop === null ? 'n/a' : `${Math.round(inputDrop * 100)}%`} (< 20%) and turns ${turnsDrop} (< 3)`;
    return { verdict: fewer || (arm.escapes === 0 && cheaper) ? 'keep' : 'delete', input_drop: inputDrop, turns_drop: turnsDrop, escapes: arm.escapes, reason };
  };
  const out = {};
  for (const arm of arms) {
    const perModel = {};
    for (const model of models) {
      const of = (name) => done.filter((r) => r.arm === name && (r.model ?? 'unknown') === model);
      const base = stats(of(baseline));
      const own = stats(of(arm));
      perModel[model] = { ...verdictOf(base, own), baseline: base, arm: own };
    }
    const verdicts = Object.values(perModel).map((m) => m.verdict);
    const verdict = verdicts.includes('delete') ? 'delete' : verdicts.length && verdicts.every((v) => v === 'keep') ? 'keep' : 'no data';
    out[arm] = { verdict, models: perModel };
  }
  return { commit: at, baseline, rule: 'keep if fail-level escapes fall, or at 0 escapes mean total input tokens fall >= 20% or mean turns fall >= 3, on every model', arms: out };
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
    budgetUsd: Number(value('budget-usd', '45')),
    arms: list('arms', DEFAULT_ARMS, ARMS),
    tasks: list('tasks', DEFAULT_TASKS, TASKS),
    allowMetered: argv.includes('--allow-metered'),
    runs,
    model: value('model', 'sonnet'),
    ref: value('ref', 'origin/main'),
    scratch: value('scratch', os.tmpdir()),
    since: value('since', ''),
    baseline: list('baseline', ['current'], ARMS)[0],
    commit: value('commit', undefined),
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
    const build = agent({ cwd: root, prompt: BUILD_PROMPT(task), model: opts.model, deny: armDenies(arm, root), mcp: lookupWiring(arm, root) });
    const failed = Boolean(build.result.is_error);
    const scored = score({ folder, label: `eval-${task}` });
    // The judge reads a copy of the build alone, so nothing beside it is in reach.
    const bench = path.join(copy, '..', `${id}-judge`);
    let judged = { gap_named: null, escalated: null, rendered: null, reason: 'build errored; not judged', judge_error: false };
    let judgeUsage = null;
    if (!failed) {
      try {
        copyDir(folder, bench);
        const judgment = agent({ cwd: bench, prompt: judge.text, model: opts.model, readOnly: true }).result;
        judgeUsage = usageOf(judgment);
        judged = parseJudge(judgment.result);
      } finally {
        fs.rmSync(bench, { recursive: true, force: true });
      }
    }
    // axe runs on the build while it still sits in its copy, where its vite config resolves.
    const checked = failed
      ? { a11y_violations: null, a11y_error: 'build errored; not checked' }
      : await a11y({ folder, screenshotPath: path.join(folder, 'screenshot.png') });
    const kept = path.join(OUTPUTS, id);
    fs.rmSync(kept, { recursive: true, force: true });
    copyDir(folder, kept);
    fs.writeFileSync(path.join(kept, 'agent-result.json'), JSON.stringify(build.result, null, 2));
    const expected = expectedFor(task);
    const { fit, fit_score: fitSummary, usage: fitUsage } = !failed && expected ? fitJudge({ folder, expected, model: opts.model }) : { fit: null, fit_score: null, usage: null };
    const shotPath = path.join(kept, 'screenshot.png');
    const buildUsage = usageOf(build.result);
    const buildEstimate = isGemini(opts.model) ? estimateGeminiCost(buildUsage) : null;
    const judgeEstimate = (judgeUsage ? estimateGeminiCost(judgeUsage) : 0) + (fitUsage ? estimateGeminiCost(fitUsage) : 0);
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
      layout_formula: scored.layoutFormula,
      seeded_escapes: seed.escapes,
      seeded_by_rule: seed.byRule,
      scored_at: scorerCommit(),
      judge: judged,
      judge_sha: judge.sha,
      fit,
      fit_score: fitSummary,
      ...buildUsage,
      ...(isGemini(opts.model) ? { judge_usage: judgeUsage, fit_judge_usage: fitUsage, estimated_cost_usd: buildEstimate == null ? null : Number((buildEstimate + judgeEstimate).toFixed(8)), vertex_price: GEMINI_PRICE, protocol: 'gemini-r1-isolated-v1' } : {}),
      wall_ms: build.wallMs,
      agent_error: failed,
      reached_checkout: build.reached,
      read_set: build.read,
      reach: reach(build.read, expected),
      screenshot: fs.existsSync(shotPath) ? shotPath : null,
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
          if (isGemini(opts.model)) {
            const budget = vertexBudget(readLedger(), opts.budgetUsd);
            console.log('[vertex budget]', JSON.stringify(budget));
            if (!budget.can_start) throw new Error(`Vertex budget holds batch: ${JSON.stringify(budget)}`);
          }
          const id = `${new Date().toISOString().slice(0, 10)}-${commit}-${opts.model}-${arm}-${task}-${n}-${Date.now()}`;
          console.log(`[ds-usage eval] ${id}`);
          await runOne({ id, arm, task, n, opts: { ...opts, ref: commit }, commit, judge, scenarios, scratch });
          if (isGemini(opts.model)) console.log('[vertex budget after run]', JSON.stringify(vertexBudget(readLedger(), opts.budgetUsd)));
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
    if (command === 'run') {
      if (isGemini(opts.model)) {
        const missing = vertexMissing(process.env);
        if (missing.length) throw new Error(`${missing.join(', ')} unset: a Gemini run goes to Vertex (docs/evals/ds-usage.md § Run it on Gemini).`);
        if (!opts.allowMetered) throw new Error('A Gemini run bills Vertex per token; pass --allow-metered.');
      } else {
        const metered = meteredIn(process.env);
        if (metered.length && !opts.allowMetered) {
          throw new Error(`${metered.join(', ')} set: this run would bill per token. Unset it to run on the subscription login, or pass --allow-metered.`);
        }
      }
      await runAll(opts);
    }
    else if (command === 'rescore') {
      const rows = rescore(readLedger(), { scorer: scorerCommit() });
      fs.writeFileSync(path.join(REPO_ROOT, LEDGER), rows.map((r) => `${JSON.stringify(r)}\n`).join(''));
      console.log(JSON.stringify(summarize(rows), null, 2));
    } else if (command === 'rejudge') {
      const rows = await rejudge(readLedger(), { commit: opts.commit ?? 'd4d96b1cb', scorer: scorerCommit() });
      for (const row of rows) append(row);
      console.log(JSON.stringify(rows, null, 2));
    } else if (command === 'compare') {
      const arms = rest.includes('--arms') ? opts.arms : LOOKUP_ARMS;
      console.log(JSON.stringify(compare(readLedger(), { arms, baseline: opts.baseline, commit: opts.commit }), null, 2));
    } else if (command === 'summary') console.log(JSON.stringify(summarize(readLedger().filter((r) => r.date >= opts.since && (!opts.commit || r.harness_commit === opts.commit))), null, 2));
    else throw new Error('usage: node scripts/eval-ds-usage.mjs run|summary|rescore|rejudge|compare [options] (docs/evals/ds-usage.md)');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
