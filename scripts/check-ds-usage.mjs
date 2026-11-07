#!/usr/bin/env node
/**
 * `npm run check:ds-usage [paths…]` — the one checker for escapes: places
 * where code outside the design system leaves it (a component the barrel does
 * not export, a deep import, an unknown prop or enum value, a raw literal, an
 * unknown or primitive token, a Font Awesome Pro icon). The rules live in
 * `scripts/lib/ds-usage.mjs` and are documented one per section in
 * `docs/engineering/ds-usage-rules.md`.
 *
 * Everything that judges design-system usage calls this: the post-edit hook,
 * `check:harness`, the uno-prototype exit, ds-lens and the usage eval. AI
 * review advises; this blocks.
 *
 * WHAT IT READS. Consumer code: tracked `.jsx .js .mjs .tsx .ts .scss .css
 * .html` files under `prototypes/` and `src/`, tests and stories skipped. The
 * facts come from the generated manifests
 * (`design-system/agent-views/components.json`, `tokens.json`), never from
 * component source. A custom property counts as defined when the manifest
 * lists it or any file under `design-system/src`, `prototypes` or `src`
 * declares it (a prototype's own `--x:`).
 *
 * THREE WAYS TO RUN IT.
 *   no paths     the files changed against main (committed, staged, unstaged
 *                and untracked), each held to zero.
 *   paths        those files, or every searched file under a directory, each
 *                held to zero. The hook and the prototype exit run this way.
 *   --all        the whole scope against the baseline: a `<rule> <path>`
 *                count may fall and never rise, and a file the baseline does
 *                not hold starts at zero. `check:harness` runs this way.
 *   --json       the same findings as data.
 *   --update     re-record the baseline from `--all`; refuses to write a rise.
 *
 * A warn-level rule prints and never fails, and the baseline does not hold it.
 *
 * Its CLI prints its own lines rather than going through `findings.mjs`'s
 * `main()`: a finding here carries a column, a rule ID, a fix and a doc link,
 * and the shared renderer prints a file, a line and a message. `run()` is on
 * the findings interface for the harness.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { CONSUMER_ROOTS, SOURCE_ROOTS, loadFacts } from './lib/ds-facts.mjs';
import { contextFrom, docLink, escapesIn, pagesOf } from './lib/ds-usage.mjs';
import { byRoot, isEntry } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { TOKEN_LADDER } from './lib/tokens/plan.mjs';
import { definitions } from './undefined-tokens.mjs';

export { REPO_ROOT };

export const BASELINE = 'scripts/baselines/ds-usage.json';
export const SCOPE = CONSUMER_ROOTS;
export const SEARCHED = /\.(jsx|js|mjs|tsx|ts|scss|css|html)$/;
const SKIPPED = /(?:^|\/)(?:node_modules|dist|build)\/|\.(?:test|spec|stories)\.[cm]?[jt]sx?$|\.d\.ts$/;
const DEFINITION_ROOTS = SOURCE_ROOTS;
const FA_METADATA = 'node_modules/@fortawesome/fontawesome-free/metadata/icons.json';
const FREE_REGULAR = 'design-system/src/lib/icon-regular.generated.js';

const git = (repoRoot, args) =>
  execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });

const lines = (out) => out.split('\n').map((l) => l.trim()).filter(Boolean);

/** Whether repoRoot is inside a git work tree (an archive copy is not). */
function inCheckout(repoRoot) {
  try {
    return git(repoRoot, ['rev-parse', '--is-inside-work-tree']).trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * The files under `roots`, repo-relative: tracked files by `git ls-files`, or,
 * outside a git checkout (an archive copy, as the usage eval builds in), every
 * file on disk under them, `node_modules` and dot folders skipped.
 */
export function filesUnder(repoRoot, roots) {
  if (inCheckout(repoRoot)) return lines(git(repoRoot, ['ls-files', ...roots]));
  const out = [];
  const walk = (rel) => {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const child = `${rel}/${entry.name}`; // repo-relative paths are POSIX, as git prints them
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) out.push(child);
    }
  };
  for (const root of roots) walk(root);
  return out.sort();
}

/** Whether a repo-relative path is one this check reads. */
export const inScope = (rel) => SCOPE.some((root) => rel.startsWith(`${root}/`)) && SEARCHED.test(rel) && !SKIPPED.test(rel);

const read = (repoRoot, rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') });

/**
 * The regular-weight icons Font Awesome Free ships, read from the generated
 * list as text: `design-system/` is not an ES-module package, so importing
 * the file from Node warns on every run.
 */
function freeRegular(repoRoot) {
  const text = fs.readFileSync(path.join(repoRoot, FREE_REGULAR), 'utf8');
  return new Set([...text.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));
}

/** Font Awesome Free's solid and brands names, when its metadata is installed or named. */
function freeIcons(repoRoot) {
  const source = process.env.FA_ICONS_JSON ?? path.join(repoRoot, FA_METADATA);
  if (!fs.existsSync(source)) return null;
  const icons = JSON.parse(fs.readFileSync(source, 'utf8'));
  const of = (style) => new Set(Object.entries(icons).filter(([, i]) => i.free?.includes(style)).map(([n]) => n));
  return { solid: of('solid'), brands: of('brands') };
}

/** The design-system facts and every declared custom property, read once per repo root. */
export const contextOf = byRoot((repoRoot) => {
  const facts = loadFacts(repoRoot);
  const declaring = filesUnder(repoRoot, DEFINITION_ROOTS)
    .filter((rel) => /\.(scss|css|jsx|tsx|js)$/.test(rel) && fs.existsSync(path.join(repoRoot, rel)))
    .map((rel) => read(repoRoot, rel));
  return contextFrom({
    components: facts.manifests.components,
    tokens: facts.manifests.tokens,
    defined: definitions(declaring),
    freeRegular: freeRegular(repoRoot),
    freeIcons: freeIcons(repoRoot),
    retired: facts.retired,
    promoted: new Set(TOKEN_LADDER.filter((row) => row.primitive).map((row) => row.new)),
    exported: facts.importable,
    barrels: facts.barrels,
  });
});

/** Every tracked file in scope. */
export const scopeFiles = (repoRoot) => filesUnder(repoRoot, SCOPE).filter(inScope);

/** Files changed against main: committed on this branch, staged, unstaged and untracked. */
export function changedFiles(repoRoot) {
  if (!inCheckout(repoRoot)) return []; // no git here: name the paths to check instead
  let base = null;
  for (const ref of ['origin/main', 'main']) {
    try {
      base = git(repoRoot, ['merge-base', ref, 'HEAD']).trim();
      break;
    } catch {
      // try the next ref
    }
  }
  const changed = new Set();
  if (base) for (const f of lines(git(repoRoot, ['diff', '--name-only', '--diff-filter=d', base]))) changed.add(f);
  for (const f of lines(git(repoRoot, ['ls-files', '--others', '--exclude-standard', ...SCOPE]))) changed.add(f);
  return [...changed].filter((f) => inScope(f) && fs.existsSync(path.join(repoRoot, f))).sort();
}

/** Paths as given: a file is read as is; a directory contributes every searched file under it. */
export function expandPaths(repoRoot, given) {
  const out = new Set();
  const walk = (abs) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const child = path.join(abs, entry.name);
      if (entry.isDirectory()) walk(child);
      else {
        const rel = path.relative(repoRoot, child).split(path.sep).join('/');
        if (SEARCHED.test(rel) && !SKIPPED.test(rel)) out.add(rel);
      }
    }
  };
  for (const p of given) {
    const abs = path.resolve(repoRoot, p);
    if (!fs.existsSync(abs)) throw new Error(`check:ds-usage: no such path: ${p}`);
    if (path.relative(repoRoot, abs).startsWith('..')) throw new Error(`check:ds-usage: ${p} is outside the repository`);
    if (fs.statSync(abs).isDirectory()) walk(abs);
    else out.add(path.relative(repoRoot, abs).split(path.sep).join('/'));
  }
  return [...out].sort();
}

/**
 * The app entries (`<root>/src/App.jsx`) beside the files, read but not
 * checked: a module an entry renders as its root is a page, even when the
 * entry itself is not among the files (the hook checks one file at a time).
 */
function entriesBeside(repoRoot, files) {
  const given = new Set(files);
  const entries = new Set();
  for (const rel of files) {
    const src = rel.match(/^(.*?(?:^|\/)src)\//)?.[1];
    if (!src) continue;
    for (const name of ['App.jsx', 'App.tsx']) {
      const entry = `${src}/${name}`;
      if (!given.has(entry) && fs.existsSync(path.join(repoRoot, entry))) entries.add(entry);
    }
  }
  return [...entries].map((rel) => read(repoRoot, rel));
}

/** Every escape in the files, fail and warn. */
export function escapes(repoRoot, files) {
  const ctx = contextOf(repoRoot);
  const texts = files.map((rel) => read(repoRoot, rel));
  const pages = pagesOf([...texts, ...entriesBeside(repoRoot, files)]);
  return texts.flatMap((file) => escapesIn({ ...file, page: pages.has(file.path) }, ctx));
}

const keyOf = (f) => `${f.rule} ${f.file}`;

/** `<rule> <path>` -> count of fail-level escapes. */
export function tally(found) {
  const counts = {};
  for (const f of found) if (f.level === 'fail') counts[keyOf(f)] = (counts[keyOf(f)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : 1)));
}

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

/**
 * Judge findings. Held files are held to zero; every other file is held to
 * its baseline count.
 * @returns {{blocking: object[], warnings: object[], stale: {key: string, recorded: number}[], absent: string|null}}
 */
export function judge(repoRoot, found, { held }) {
  const warnings = found.filter((f) => f.level === 'warn');
  const failing = found.filter((f) => f.level === 'fail');
  if (held) return { blocking: failing, warnings, stale: [], absent: null };
  const ratchet = ratchetFor(repoRoot);
  const counts = tally(failing);
  const over = new Set();
  let absent = null;
  for (const failure of ratchet.failures(counts)) {
    if (failure.kind === 'absent') absent = failure.message;
    else over.add(failure.key);
  }
  return {
    blocking: failing.filter((f) => over.has(keyOf(f))),
    warnings,
    stale: ratchet.absent ? [] : ratchet.stale(counts).map((e) => ({ key: e.key, recorded: e.recorded })),
    absent,
  };
}

/** The findings interface `check:harness` calls: the whole scope against the baseline. */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const verdict = judge(repoRoot, escapes(repoRoot, scopeFiles(repoRoot)), { held: false });
  const findings = verdict.blocking.map((f) => ({
    file: f.file,
    line: f.line,
    message: `${f.rule}  ${f.message} -> ${f.fix} (${docLink(f.rule)})`,
  }));
  if (verdict.absent) findings.push({ message: verdict.absent });
  for (const { key, recorded } of verdict.stale) {
    findings.push({ message: `${key}: escapes fell (baseline held ${recorded}); record it with \`npm run check:ds-usage -- --update\`` });
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const files = scopeFiles(repoRoot);
  const found = escapes(repoRoot, files).filter((f) => f.level === 'fail');
  return `${found.length} recorded escape(s) across ${files.length} consumer file(s); none new`;
}

export const REMEDY =
  '  -> fix each escape as its line says, or read docs/engineering/ds-usage-rules.md for the rule.\n' +
  '     The baseline only falls: `npm run check:ds-usage -- --update` records a fall and refuses a rise.';

function record(repoRoot) {
  const counts = tally(escapes(repoRoot, scopeFiles(repoRoot)));
  const ratchet = ratchetFor(repoRoot);
  const rising = ratchet.absent ? [] : ratchet.failures(counts).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check:ds-usage] not recorded: ${rising.length} rule/file pair(s) rose or are new. Fix the escapes instead.`);
    process.exitCode = 1;
    return;
  }
  ratchet.update(counts, {
    seed: {
      why:
        'Escapes already in consumer code (prototypes/, src/) when check:ds-usage landed, as `<rule> <path>` -> count of fail-level findings. ' +
        'The record only falls; a file a change touches is held to zero when the check runs on changed files or named paths. ' +
        'Regenerate with `npm run check:ds-usage -- --update`; never edit by hand.',
    },
  });
  console.log(`[check:ds-usage] baseline recorded: ${Object.keys(counts).length} rule/file pair(s)`);
}

const print = (f) =>
  `${f.file}:${f.line}:${f.col}  ${f.rule}  ${f.message}\n    -> ${f.fix}\n    see ${docLink(f.rule)}`;

function cli(argv) {
  const given = argv.filter((a) => !a.startsWith('--'));
  if (argv.includes('--update')) return record(REPO_ROOT);

  const all = argv.includes('--all');
  const files = all ? scopeFiles(REPO_ROOT) : given.length ? expandPaths(REPO_ROOT, given) : changedFiles(REPO_ROOT);
  const found = escapes(REPO_ROOT, files);
  const verdict = judge(REPO_ROOT, found, { held: !all });
  const failed = verdict.blocking.length + verdict.stale.length + (verdict.absent ? 1 : 0);

  if (argv.includes('--json')) {
    console.log(JSON.stringify({ files: files.length, blocking: verdict.blocking, warnings: verdict.warnings, stale: verdict.stale, absent: verdict.absent }, null, 2));
    process.exitCode = failed ? 1 : 0;
    return;
  }

  for (const f of verdict.blocking) console.error(print(f));
  // On the whole scope the warnings are the estate's, not this change's: count them.
  if (!all) for (const f of verdict.warnings) console.log(`${print(f)}  (warning)`);
  for (const { key, recorded } of verdict.stale) console.error(`${key}: escapes fell (baseline held ${recorded}); run \`npm run check:ds-usage -- --update\``);
  if (verdict.absent) console.error(verdict.absent);

  const mode = all ? 'whole scope against the baseline' : given.length ? 'named paths, held to zero' : 'changed files, held to zero';
  const icons = contextOf(REPO_ROOT).freeIcons ? '' : '; solid and brands icon names unchecked (no Font Awesome metadata here)';
  const line = `check:ds-usage: ${files.length} file(s), ${mode}: ${verdict.blocking.length} escape(s), ${verdict.warnings.length} warning(s)${icons}`;
  if (failed) {
    console.error(`✗ ${line}\n${REMEDY}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${line}`);
}

if (isEntry(import.meta.url)) cli(process.argv.slice(2));

