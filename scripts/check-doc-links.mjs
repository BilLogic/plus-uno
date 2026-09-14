#!/usr/bin/env node
/**
 * The link validator (#504), which was `scripts/validate-doc-links.sh`.
 *
 * WHY IT IS NO LONGER A SHELL SCRIPT. The old version extracted markdown links
 * with a sed + `rg`-or-`grep` pipeline of its own, which is the defect #503 and
 * #504 exist to delete: a second link grammar beside the corpus's. The two had
 * already drifted once — the shell had a hard `rg` dependency and silently
 * no-opped on machines without it, so the guard reported nothing for weeks
 * (docs/plans/2026-07-07-001 § 6) — and a repo with two link readers gets two
 * answers to "is this link broken?". Extraction now comes from
 * `scripts/lib/corpus.mjs`, the one reader, and every pass below keeps the
 * findings and the wording it had as shell.
 *
 * The SEVEN passes, in order, each with its own corpus and its own exemptions:
 *
 *  1. Relative markdown links resolve. A `transcripts/` folder is excluded:
 *     it holds VERBATIM agent output, so the paths inside are a record of what
 *     an agent said, not links this repo owns, and a record you must hand-edit
 *     to make CI green is not a record. `agents/uno-bot/harness-bundle.md` is
 *     GENERATED from the swept sources; its links are theirs, already checked
 *     at their own paths, and re-resolving them from the bundle's directory
 *     only invents misses.
 *  2. Backticked ROOTED paths resolve — `` `docs/conventions/writing.md` ``.
 *     The harness writes almost every path as inline code rather than as a
 *     link, so pass 1 sees ~none of them. A POINTER is not a link, which is
 *     why the corpus deliberately does not read one (its header says so) and
 *     why this pass carries its own token grammar rather than borrowing
 *     `links()`. `docs/adr/` is absent: an ADR's job includes naming a path
 *     that was retired, and rewriting those would erase the decision's own
 *     record. `design-system/guidelines/components/overview.md` carries its own
 *     staleness banner (#165/#166 own its rebuild) and the two vendored
 *     blueprint pages name their SOURCE repo's paths.
 *  3. Backticked BARE filenames name a file that exists somewhere. The rule is
 *     deliberately weak — `method.md`, `bot.md` and `SKILL.md` each name many
 *     real files — and weak still catches the class: a retired file resolves to
 *     nothing at all. That is how `figma-workspace.md` rotted for twelve days
 *     after moving to docs/connectors/figma.md (#408).
 *  4. AGENTS.md's skills table resolves to real `SKILL.md` files.
 *  5. The four required JSON indexes exist and parse.
 *  6. The repo paths INSIDE those indexes resolve — `scripts/validate-index-paths.mjs`,
 *     which owns that pass and prints its own line (#75, #76 both lived inside
 *     the very files pass 5 vouched for).
 *  7. No reference to a retired path shape survives in an active file.
 *
 * Run: npm run check:docs
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { documents, links } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** `find <dirs> -name '*.md' -not -path …`, plus the named root files, sorted. */
function markdownUnder(dirs, { exclude = [], plus = [], root = REPO_ROOT } = {}) {
  const found = dirs.flatMap((dir) =>
    documents(dir, {
      root,
      ext: ['.md'],
      ignore: new Set(['node_modules']),
      skipDotDirs: false,
    }),
  );
  return [...found, ...plus]
    .filter((rel) => !exclude.some((pattern) => pattern.test(rel)))
    .sort();
}

const TRANSCRIPTS = /(^|\/)transcripts\//;
const BUNDLE = /^agents\/uno-bot\/harness-bundle\.md$/;

/** The trees pass 1 reads: the router, the glossary, and what they point into. */
const LINK_DIRS = [
  'skills',
  'agents',
  'docs/connectors',
  'docs/engineering',
  'docs/conventions',
  'docs/adr',
  'docs/product-and-service',
  'design-system/guidelines',
  'docs/evals',
];

/** Passes 2 and 3 read the LIVE trees: an ADR names retired paths on purpose. */
const POINTER_DIRS = [
  'skills',
  'agents',
  'docs/connectors',
  'docs/engineering',
  'docs/conventions',
  'docs/product-and-service',
  'design-system/guidelines',
];

/** Only tokens rooted at a real top-level directory of this repo. */
const ROOTED = /^(AGENTS\.md|docs\/|skills\/|agents\/|scripts\/|design-system\/|prototypes\/|\.github\/)/;
/**
 * A code span, which is where this repo writes a pointer. Line-bounded: a span
 * whose backticks sit on two different lines is prose wrapping, not a path, and
 * reading across the newline turns `uno-bot-build-\nrecap.md` into a filename
 * nothing can resolve.
 */
const CODE_SPAN = /`([^`\n]+)`/g;

const VENDORED_POINTERS = [
  /^design-system\/guidelines\/components\/overview\.md$/,
  /^docs\/connectors\/supabase\/blueprint\.md$/,
  /^docs\/connectors\/supabase\/blueprint-direct-access\.md$/,
];

/** A bare filename: no slash, no space, and a `.md` tail. */
const BARE_MD = /^[^`/ ]+\.md$/;

const REQUIRED_INDEXES = [
  'design-system/guidelines/index-manifest.json',
  'design-system/guidelines/components/components-index.json',
  'skills/uno-research/references/foundations-index.json',
  'skills/uno-research/references/patterns-index.json',
];

/** Retired shapes. `design-system/docs/` went in #170, four homes into one. */
const OLD_PATTERNS = [
  'docs/project/',
  'docs/foundations/',
  'docs/design-system/',
  'docs/product-and-service/conventions/',
  '.agent/',
  'bot-skills/',
  '/uno:',
  'docs/product-and-service/design-system',
  'design-system/docs/',
];

/** History keeps the words it was written in; a build output is not authored. */
const NOT_ACTIVE = [
  'node_modules/',
  'docs/plans/',
  'docs/knowledge/',
  'docs/adr/',
  'todos/',
  'storybook-static/',
  'design-system/figma/knowledge-audit.json',
];

/**
 * All seven passes, run once per repo root.
 *
 * `notes` is what the script used to print AS it went — one line per pass, plus
 * the line pass 6's own script prints — and `found` is what it printed when a
 * pass failed. The runner imports this module, so neither is written to a
 * stream here: `summary` carries the notes on the green path and the renderer
 * carries the findings on the red one.
 */
const inputs = byRoot((repoRoot) => {
  const found = [];
  const notes = [];
  const fail = (line) => found.push(line);
  const exists = (rel) => existsSync(path.join(repoRoot, rel));
  const md = (dirs, opts) => markdownUnder(dirs, { ...opts, root: repoRoot });

  // ── 1. relative markdown links ────────────────────────────────────────────

  notes.push(
    '[check] validating markdown links in skills/ agents/ docs/ design-system/guidelines/ + root',
  );

  for (const file of md(LINK_DIRS, {
    exclude: [TRANSCRIPTS, BUNDLE],
    plus: ['AGENTS.md', 'CONTEXT.md', 'SETUP.md', 'README.md'],
  })) {
    for (const { target } of links(file, { root: repoRoot })) {
      if (/^(https?:\/\/|mailto:|#)/.test(target)) continue;
      const link = target.split('#')[0];
      if (!link || /[*{}]/.test(link)) continue;
      const resolved = link.startsWith('/')
        ? link.slice(1)
        : path.normalize(path.join(path.dirname(file), link));
      if (!exists(resolved)) {
        fail(`[missing] ${file} -> ${link} (resolved: ${resolved})`);
      }
    }
  }

  // ── 2. backticked rooted paths ────────────────────────────────────────────

  notes.push('[check] validating backticked repo paths resolve');

  const codeSpans = (file) => [
    ...readFileSync(path.join(repoRoot, file), 'utf8').matchAll(CODE_SPAN),
  ].map((m) => m[1]);

  for (const file of md(POINTER_DIRS, {
    exclude: [BUNDLE, ...VENDORED_POINTERS],
    plus: ['AGENTS.md', 'CONTEXT.md', 'SETUP.md'],
  })) {
    for (const raw of codeSpans(file)) {
      if (!ROOTED.test(raw)) continue;
      // Placeholders, globs, ranges, prose fragments, command lines.
      if (/[*{<\s$|]/.test(raw)) continue;
      if (raw.includes('…') || raw.includes('YYYY') || raw.includes('<name>')) continue;
      // Paths named in order to FORBID them. The doc is correct precisely because
      // the path does not exist; asserting otherwise would invert the rule.
      if (raw === 'docs/solutions' || raw.startsWith('docs/solutions/')) continue;

      // Trailing line/anchor references (src/net.ts:42, file.md#section), then
      // the punctuation that belongs to the sentence rather than to the path.
      const token = raw.split('#')[0].split(':')[0].replace(/[,.)]$/, '');
      if (!token) continue;
      if (!exists(token)) {
        fail(`[missing] ${file} -> \`${token}\``);
      }
    }
  }

  // ── 3. backticked bare filenames ──────────────────────────────────────────

  notes.push('[check] validating backticked bare filenames name a file that exists');

  // Tracked files PLUS the untracked ones git would offer to add — so a new page
  // counts, and anything ignored (every node_modules among them) still does not.
  // `find . -not -path './node_modules/*'` excluded only the ROOT install, so a
  // nested one answered for the repo; tracked-only then told an author their
  // brand-new page did not exist.
  const gitMd = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '*.md'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const KNOWN_MD_NAMES = new Set(
    gitMd.stdout
      .split('\n')
      .filter(Boolean)
      .map((p) => path.basename(p)),
  );

  for (const file of md(POINTER_DIRS, {
    exclude: [BUNDLE],
    plus: ['AGENTS.md', 'CONTEXT.md', 'SETUP.md'],
  })) {
    for (const raw of codeSpans(file)) {
      if (!BARE_MD.test(raw)) continue;
      // Template placeholders, the same ones the rooted pass skips.
      if (/[*<]/.test(raw) || raw.includes('YYYY') || raw.includes('…')) continue;
      if (!KNOWN_MD_NAMES.has(raw)) {
        fail(`[missing] ${file} -> \`${raw}\` (no file of that name exists)`);
      }
    }
  }

  // ── 4. the skills table ───────────────────────────────────────────────────

  notes.push('[check] validating AGENTS.md skills-table rows resolve to SKILL.md files');

  const agentsText = readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8');
  for (const ref of [...new Set([...agentsText.matchAll(/skills\/uno-[a-z-]+/g)].map((m) => m[0]))].sort()) {
    if (!exists(path.join(ref, 'SKILL.md'))) {
      fail(`[missing] AGENTS.md -> ${ref}/SKILL.md`);
    }
  }

  // ── 5. the JSON indexes ───────────────────────────────────────────────────

  notes.push('[check] validating JSON index files');

  for (const idx of REQUIRED_INDEXES) {
    const abs = path.join(repoRoot, idx);
    if (!existsSync(abs)) {
      fail(`[missing] required index: ${idx}`);
      continue;
    }
    try {
      JSON.parse(readFileSync(abs, 'utf8'));
    } catch {
      fail(`[invalid] invalid JSON: ${idx}`);
    }
  }

  // ── 6. the paths inside them ──────────────────────────────────────────────

  notes.push('[check] validating repo paths INSIDE the JSON indexes resolve');

  const indexPaths = spawnSync('node', ['scripts/validate-index-paths.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  // That script prints its own line, which is a note like the rest of them. Its
  // output travels WITH the finding when it fails, because it is the only place
  // that says which path inside which index did not resolve.
  if (indexPaths.status === 0) {
    if (indexPaths.stdout) notes.push(...indexPaths.stdout.replace(/\n$/, '').split('\n'));
  } else {
    const said = `${indexPaths.stdout ?? ''}${indexPaths.stderr ?? ''}`.replace(/\n$/, '');
    found.push(said ? `validate-index-paths\n${said}` : 'validate-index-paths');
  }

  // ── 7. retired path shapes ────────────────────────────────────────────────

  notes.push('[check] validating no old path remnants in active files');

  const activeFiles = documents('.', {
    root: repoRoot,
    ext: ['.md', '.jsx', '.json', '.mdc'],
    ignore: new Set(['node_modules', '.git', 'storybook-static']),
    skipDotDirs: false,
  });

  const activeLines = activeFiles.flatMap((rel) =>
    readFileSync(path.join(repoRoot, rel), 'utf8')
      .split('\n')
      .map((line) => `${rel}:${line}`),
  );

  for (const pattern of OLD_PATTERNS) {
    const hits = activeLines.filter(
      (line) => line.includes(pattern) && !NOT_ACTIVE.some((skip) => line.includes(skip)),
    );
    if (hits.length) fail(`[stale] ${hits.length} references to old path pattern: ${pattern}`);
  }

  return { found, notes };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  return inputs(repoRoot).found.map((message) => ({ message }));
}

/**
 * The green line, and under it the line each pass printed as it ran. The passes
 * are what this check's coverage IS — drop them and a pass that stopped running
 * would be invisible — so they are said on the way past rather than only when
 * something breaks.
 */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  return ['all validation checks passed', ...inputs(repoRoot).notes].join('\n');
}

main(import.meta.url, 'check:docs', { run, summary });
