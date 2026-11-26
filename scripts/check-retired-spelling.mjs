#!/usr/bin/env node
/**
 * Retired-spelling sweep (#429, the contract step of an expand–contract).
 *
 * The glossary renamed the two maintenance severities: "Tier 1 / Tier 2
 * (maintenance)" became **direct fix / gated change**, and *Tier* now means the
 * loading tiers and nothing else. The old spelling fanned across 33 files,
 * including a skill directory and a workflow file, so it was migrated in three
 * batches (#437, #435, #434) while both spellings resolved. This check is what
 * the contract leaves behind: the old spelling can fall out of live docs but
 * cannot come back, because a maintenance "Tier 1" now reads as a LOADING tier
 * to every agent that opens the glossary.
 *
 * What it sweeps: hand-authored docs an agent reads — the constitution, the
 * glossary, agents/, skills/, docs/ (minus history), the design-system
 * guidelines, the headless prompts and the workflows. What it leaves alone is the
 * retirement list's allowed places for a spelling (`design-system/agent-views/_inventions.json`):
 * decision records (a record keeps the words it was written in), the
 * changelog, the generated bundle and the Worker's source, and every `_Avoid_:` line, which names the old spelling
 * precisely so this sweep has something to point at.
 *
 * THE SPELLINGS ARE THE LIST'S. This check holds no list of retired shapes and
 * no list of places that may keep them; it reads the spelling rows and the
 * allowed places through `scripts/lib/retirement.mjs`, and sweeps the files.
 *
 * Each pattern is a MAINTENANCE-only shape: the word beside "Tier" is one only
 * the severity meaning ever took (fix, digest, whitelist, pipeline, apply,
 * "suggested tier", the 1/2 slash form, the old file names). A loading use —
 * "Tier 2 — loaded on demand", "## Tier-2 loads" — matches none of them.
 *
 * THE SECOND RETIREMENT: "lane" in the MODEL-PROVIDER sense (#497). uno-bot ran
 * two agent loops called the "Gemini lane" and the "Claude lane" until #495/#496
 * collapsed them into one loop behind the ModelProvider seam; the word is now
 * "provider" or "adapter". **lane** keeps one meaning and it is the blueprint's:
 * the actor row a cell sits on (GLOSSARY.md § Two vocabularies, ADR-023), which
 * is a CONTRACT name — `filter_lane_role`, a `lane` column, "| Lane | Step |".
 * So the shapes below are the provider PHRASES and never the bare word: "Gemini
 * lane", "model lane", "both lanes". A blueprint lane, a review lens that stays
 * "in its lane", AGENT.md § My lane and an intake with "no separate lane" match
 * none of them.
 *
 * Run: npm run check:retired-spelling
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { loadRetirement } from './lib/retirement.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');

export const REMEDY =
  '  -> GLOSSARY.md (**direct fix / gated change**) and agents/uno-bot/README.md\n' +
  '     (**ModelProvider**) name the current words. The old\n' +
  '     spelling may fall out of live docs and may not come back: a maintenance\n' +
  '     "Tier 1" now reads as a LOADING tier to every agent that opens the glossary.';

/** Roots swept, relative to the repo. */
export const ROOTS = [
  'AGENTS.md',
  'README.md',
  'GLOSSARY.md',
  'agents',
  'skills',
  'docs',
  'design-system/guidelines',
  'scripts/prompts',
  '.github/workflows',
];

/** The retirement list of a root; a fixture root that carries none is swept against this repo's. */
const retirementOf = byRoot((repoRoot) => {
  try {
    return loadRetirement(repoRoot);
  } catch (err) {
    if (err.code === 'ENOENT') return loadRetirement(REPO_ROOT);
    throw err;
  }
});

/** The file types an agent reads. Tested against the name, as the walk hands it. */
const SWEPT = ['.md', '.mdx', '.yml', '.yaml', '.json'];

/**
 * Entries this sweep does not descend into or read.
 *
 * `node_modules` and the dot-directories are the usual exclusions. `__`-prefixed
 * is not: it is the name shape of a test fixture planted in the live tree.
 * `scripts/check-doc-identifiers.test.mjs` used to plant
 * `design-system/guidelines/__regression-*.md`, run its checker against the real
 * repo root and delete it in a `finally`; node's runner runs test files in
 * parallel, so this sweep could list the file and then find it gone, and it took
 * CI down twice on changes that had nothing to do with either test. That test
 * now builds its root under `mkdtemp` (#469), and the skip stays anyway: it is
 * what catches the next test that plants a file somewhere it should not, and
 * fixtures are not repo content, so skipping them is right on its own terms.
 */
const skipEntry = (name) => name === 'node_modules' || name.startsWith('.') || name.startsWith('__');

/**
 * Sweep one file's text. Returns findings: { line, text, why }, one per spelling
 * per line. A file the list lets keep a retired spelling has none.
 */
export function findingsIn(text, rel = '', repoRoot = REPO_ROOT) {
  const retirement = retirementOf(repoRoot);
  if (retirement.allowed(rel, 'spelling')) return [];
  const out = new Map();
  for (const { row, match, index } of retirement.findIn(text, { kinds: ['spelling'], file: rel })) {
    if (row.rule) continue; // another check's family, not a maintenance spelling
    const line = text.slice(0, index).split('\n').length;
    const key = `${line}:${row.not}`;
    if (!out.has(key)) out.set(key, { line, text: match, why: row.why });
  }
  return [...out.values()].sort((a, b) => a.line - b.line);
}

export function sweep(root = REPO_ROOT) {
  // STRICT, because this check reports a number. The corpus's default walk
  // swallows an unreadable directory and the sweep then vouches for a corpus
  // one directory short; `strict` makes an unreadable directory throw and lets
  // an unresolvable ENTRY — a broken symlink, a file a parallel test just
  // deleted — cost only itself. Both halves were pinned by this file's own
  // tests before the walk moved, and they still are: measured at the time, one
  // broken symlink in a guidelines subfolder swept 324 files where the same
  // tree without it swept 325, losing exactly the entry after it, silently.
  // An ABSENT root stays normal — the fixture roots in the tests do not all exist.
  const files = ROOTS.flatMap((r) =>
    documents(r, { root, ext: SWEPT, skipEntry, strict: true }).map((rel) => path.join(root, rel)),
  );
  const findings = [];
  for (const abs of files) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    // A file can vanish between the walk and the read — the belt to the braces
    // above, because the next fixture somebody plants may not be `__`-prefixed.
    // A file that is gone carries no retired spelling.
    let text;
    try { text = readFileSync(abs, 'utf8'); } catch (err) { if (err.code === 'ENOENT') continue; throw err; }
    for (const f of findingsIn(text, rel, root)) findings.push({ file: rel, ...f });
  }
  return { files: files.length, findings };
}

/** One sweep of the tree, shared by the findings and the green line. */
const swept = byRoot((repoRoot) => sweep(repoRoot));

/**
 * Each retired spelling, located. The sweep already knows the file and the
 * line, so they travel as such rather than inside the sentence.
 *
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT } = {}) {
  return swept(repoRoot).findings.map((f) => ({
    file: f.file,
    line: f.line,
    message: `"${f.text}" — ${f.why}`,
  }));
}

/** The green line, which carries the size of the corpus the sweep vouches for. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${swept(repoRoot).files} files swept, no retired maintenance spelling.`;
}

main(import.meta.url, 'check:retired-spelling', { run, summary, remedy: REMEDY });
