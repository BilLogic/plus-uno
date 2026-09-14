#!/usr/bin/env node
/**
 * Retired-spelling sweep (#429, the contract step of an expand–contract).
 *
 * CONTEXT.md renamed the two maintenance severities: "Tier 1 / Tier 2
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
 * guidelines, the headless prompts and the workflows. What it leaves alone, by
 * rule: docs/plans/ and todos/ (a plan keeps the words it was written in),
 * docs/adr/ (a decision record keeps the spelling it decided in),
 * docs/knowledge/archive/ (the graveyard), generated artifacts (the bundle is
 * regenerated from the swept sources), and the glossary's own "Do NOT use"
 * column, which names the old spelling precisely so this sweep has something
 * to point at.
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
 * the actor row a cell sits on (CONTEXT.md § Two vocabularies, ADR-023), which
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

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');

/** Roots swept, relative to the repo. */
export const ROOTS = [
  'AGENTS.md',
  'README.md',
  'CONTEXT.md',
  'agents',
  'skills',
  'docs',
  'design-system/guidelines',
  'scripts/prompts',
  '.github/workflows',
];

/** Path prefixes left as written, relative to the repo. */
export const SKIP = [
  'docs/plans/',
  'docs/adr/',
  'docs/knowledge/archive/',
  'todos/',
  'agents/uno-bot/harness-bundle.md',
  'agents/uno-bot/src/',
  'agents/uno-bot/node_modules/',
];

/** The retired shapes. Every one names the maintenance meaning and no loading use. */
export const RETIRED = [
  { re: /\bTier[- ]?1\/2\b/g, why: 'the 1/2 slash form named the two severities together' },
  { re: /\bTier[- ]?[12] (?:fix|fixes|change|changes|digest|whitelist|pipeline|scope|apply)\b/g, why: 'a severity noun beside "Tier"' },
  { re: /\bTier[- ]?1 (?:only|auto-apply)\b/g, why: 'the direct-fix whitelist' },
  { re: /\bsuggested tier\b/gi, why: 'the intake field is "suggested severity"' },
  { re: /\btier it\b/g, why: '"classify its severity"' },
  { re: /\buno-tier1-digest\b/g, why: 'the headless skill is scripts/prompts/uno-direct-fix-digest' },
  { re: /\bweekly-tier1-digest\b/g, why: 'the workflow is weekly-direct-fix-digest.yml' },
  { re: /\bNO_TIER1_THIS_WEEK\b/g, why: 'the digest sentinel is NO_DIRECT_FIXES_THIS_WEEK' },
  // "lane" in the model-provider sense. Anchored on the provider word beside it,
  // so the blueprint's actor row — the only surviving meaning — always passes.
  {
    re: /\b(?:Gemini|Claude|Vertex-Claude|Anthropic|model|models|provider|providers|agent|agents|production|active|fallback|backup)[- ]lanes?\b/gi,
    why: 'the model-provider sense of "lane" is retired — say provider, ModelProvider or adapter ("lane" is the blueprint\'s actor row)',
  },
  {
    re: /\b(?:both|two|either|each|per)[- ](?:provider |model |agent )?lanes?\b/gi,
    why: 'there is one agent loop and two adapters behind the ModelProvider seam — count adapters or providers, not lanes',
  },
  {
    re: /\blanes?[- ](?:honours?|honors?|report|reports|run|runs|log|logs)\b/gi,
    why: 'an adapter honours/reports/runs — "lane" in the provider sense is retired',
  },
];

/**
 * The glossary rows that OWN a retired spelling: their "Do NOT use" cell names
 * it precisely so this sweep has something to point at, and so cannot be swept.
 * One row per retirement — the maintenance severities, and the ModelProvider
 * seam that retired the provider sense of "lane".
 */
const GLOSSARY_ROWS = [
  /^\| \*\*direct fix \/ gated change\*\* \|/,
  /^\| \*\*ModelProvider\*\* \|/,
];

/** The file types an agent reads. Tested against the name, as the walk hands it. */
const SWEPT = ['.md', '.mdx', '.yml', '.yaml', '.json'];

/**
 * Entries this sweep does not descend into or read.
 *
 * `node_modules` and the dot-directories are the usual exclusions. `__`-prefixed
 * is not: it is a test fixture another test is writing into the live tree RIGHT
 * NOW. `scripts/check-doc-identifiers.test.mjs` plants
 * `design-system/guidelines/__regression-*.md`, runs its checker against the real
 * repo root and deletes it in a `finally`; node's runner runs test files in
 * parallel, so this sweep could list the file and then find it gone. It took CI
 * down twice on changes that had nothing to do with either test. Fixtures are not
 * repo content, so skipping them is right on its own terms.
 */
const skipEntry = (name) => name === 'node_modules' || name.startsWith('.') || name.startsWith('__');

/** Sweep one file's text. Returns findings: { line, text, why }. */
export function findingsIn(text, rel = '') {
  const out = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (rel === 'CONTEXT.md' && GLOSSARY_ROWS.some((re) => re.test(line))) return;
    for (const { re, why } of RETIRED) {
      re.lastIndex = 0;
      const m = re.exec(line);
      if (m) out.push({ line: i + 1, text: m[0], why });
    }
  });
  return out;
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
    if (SKIP.some((p) => rel.startsWith(p))) continue;
    // A file can vanish between the walk and the read — the belt to the braces
    // above, because the next fixture somebody plants may not be `__`-prefixed.
    // A file that is gone carries no retired spelling.
    let text;
    try { text = readFileSync(abs, 'utf8'); } catch (err) { if (err.code === 'ENOENT') continue; throw err; }
    for (const f of findingsIn(text, rel)) findings.push({ file: rel, ...f });
  }
  return { files: files.length, findings };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { files, findings } = sweep();
  if (findings.length) {
    console.error(`[check:retired-spelling] ${findings.length} retired spelling(s) in ${files} swept files — CONTEXT.md § Harness & workflow terms names the current words:`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  "${f.text}" — ${f.why}`);
    process.exit(1);
  }
  console.log(`[check:retired-spelling] ${files} files swept, no retired maintenance spelling.`);
}
