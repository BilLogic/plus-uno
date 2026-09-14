#!/usr/bin/env node
/**
 * Glossary-only check on CONTEXT.md (#420).
 *
 * CONTEXT.md is the glossary: one row per term, and nothing else. The failure
 * this guards against has a shape: a rename map, an interface-to-schema table,
 * a rendering convention — each arrives as "just one more section", each is
 * read by every session that opens the glossary, and the two sibling repos
 * grew their CONTEXT.md to 40k and 18k chars that way before anyone noticed.
 * Reference belongs behind a pointer; a glossary that carries it is sprawl.
 *
 * What "glossary only" means here, mechanically:
 *   - no fenced code (a glossary defines words; code is reference);
 *   - no third-level headings (sections are term groups, not chapters);
 *   - every second-level section holds at least one table row (a section with
 *     no terms in it is prose wearing a heading);
 *   - prose lines — anything that is not a heading, a table row, frontmatter or
 *     an HTML comment — are RATCHETED: the count may fall, never rise. A
 *     one-line pointer to where a convention now lives is prose and is allowed;
 *     the ratchet keeps it to one line.
 *
 * Same ratchet idiom as check-negation-ratchet.mjs: fails on a rise; a fall
 * passes with a nudge to record it with --update.
 *
 * Run: npm run check:glossary            (--update records the current prose count)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { frontmatter } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');
export const SUBJECT = 'CONTEXT.md';
export const BASELINE = path.join(REPO_ROOT, 'docs/evals/glossary-baseline.json');

export const REMEDY =
  '  -> a glossary defines terms; move the reference behind a pointer, or re-baseline with --update and say why.';

export function measure(text) {
  // The frontmatter is read off by the corpus, not by a second fence-finder
  // here (#504); `offset` puts the line numbers back on the whole file, which
  // is what a failure has to name.
  const { body } = frontmatter(text);
  const lines = body.split('\n');
  const offset = text.split('\n').length - lines.length;
  const failures = [];
  let inFence = false;
  let inComment = false;
  let prose = 0;
  let section = null;
  const sections = new Map(); // heading -> table rows
  lines.forEach((raw, index) => {
    const i = index + offset;
    const l = raw.trimEnd();
    if (l.startsWith('```')) { inFence = !inFence; if (inFence) failures.push(`line ${i + 1}: fenced code in the glossary`); return; }
    if (inFence) return;
    if (l.startsWith('<!--')) inComment = true;
    if (inComment) { if (l.includes('-->')) inComment = false; return; }
    if (/^###\s/.test(l)) { failures.push(`line ${i + 1}: third-level heading "${l}" — sections are term groups, not chapters`); return; }
    if (/^##\s/.test(l)) { section = l.replace(/^##\s*/, ''); sections.set(section, 0); return; }
    if (/^#\s/.test(l)) return;
    if (l === '') return;
    if (l.startsWith('|')) { if (section && !/^\|\s*-+/.test(l) && !/^\|\s*(Term|PLUS Term)\s*\|/i.test(l)) sections.set(section, sections.get(section) + 1); return; }
    prose += 1;
  });
  for (const [h, rows] of sections) if (rows === 0) failures.push(`section "${h}" holds no term rows — prose wearing a heading`);
  return { failures, prose };
}

/** One read and one measurement of the glossary, shared by both halves. */
const measured = byRoot((repoRoot) => measure(readFileSync(path.join(repoRoot, SUBJECT), 'utf8')));

const baselinePath = (repoRoot) =>
  repoRoot === REPO_ROOT ? BASELINE : path.join(repoRoot, 'docs/evals/glossary-baseline.json');

/**
 * The recorded prose count, or null on a first run. Read on each call rather
 * than memoised: `--update` writes it and then the run reads it back, and a
 * cached baseline would answer with the one from before the write.
 */
function baselineOf(repoRoot) {
  try {
    return JSON.parse(readFileSync(baselinePath(repoRoot), 'utf8'));
  } catch {
    return null; // first run
  }
}

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { failures, prose } = measured(repoRoot);
  // The structural findings come first and alone: with fenced code or a
  // chapter heading in it the file is not a glossary yet, and the ratchet on
  // its prose is not the thing to say.
  if (failures.length) return failures.map((message) => ({ message }));

  const baseline = baselineOf(repoRoot);
  if (!baseline) return [{ message: 'no baseline; run with --update once' }];
  if (prose > baseline.proseLines) {
    return [
      {
        message: `prose lines rose: ${prose} against a baseline of ${baseline.proseLines} (recorded ${baseline.recorded}).`,
      },
    ];
  }
  return [];
}

/** The green line: the count, its baseline, and a nudge when it has fallen. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { prose } = measured(repoRoot);
  const baseline = baselineOf(repoRoot);
  const fell = prose < baseline.proseLines ? ` — fell from ${baseline.proseLines}; record it with --update` : '';
  return `${prose} prose lines against a baseline of ${baseline.proseLines}${fell}`;
}

// `--update` re-records the ratchet — a write, so it lives here and never in
// `run`, which only measures. The run then continues against what was just
// written, which is how a deliberate fall is recorded and checked in one go.
if (process.argv.includes('--update') && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { prose } = measured(REPO_ROOT);
  writeFileSync(
    BASELINE,
    JSON.stringify(
      { subject: SUBJECT, proseLines: prose, recorded: new Date().toISOString().slice(0, 10), note: 'Ratchet: the count may fall, never rise. Re-record with --update and say why in the PR.' },
      null,
      2,
    ) + '\n',
  );
  console.log(`[check-glossary] baseline recorded: ${prose} prose lines`);
}

main(import.meta.url, 'check:glossary', { run, summary, remedy: REMEDY });
