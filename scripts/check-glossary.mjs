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
 * THE RECORD IS THE ONE WITH NO KEYED SET AT ALL — a single number on the
 * record, which is the `scalar` form in `scripts/lib/ratchet-shapes.mjs`. It is
 * read and written through `scripts/lib/ratchet.mjs` like every other baseline
 * in the repo (#601), so the direction, the absent-record error mode and the
 * `--update` write are the module's and the wording is this check's. There is
 * no keyed set, so there is no stale entry to report and no reason to require:
 * a number cannot go missing, and the argument for it is the note on the record
 * and the PR that moved it.
 *
 * Run: npm run check:glossary            (--update records the current prose count)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, frontmatter } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

export { REPO_ROOT };
export const SUBJECT = 'CONTEXT.md';
/** Repo-relative: also this record's key in the shape table, and what the registry row declares. */
export const BASELINE = 'docs/evals/glossary-baseline.json';

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

/**
 * The ratchet over the record, opened fresh on every call rather than memoised:
 * `--update` writes the record and then FALLS THROUGH to the gate, which reads
 * it back, and a cached record would answer with the one from before the write.
 */
const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

/** The record's one number. `scalar` keys its entries by field name. */
const recordedProse = (ratchet) => ratchet.entries.get('proseLines')?.counts.get('proseLines');

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { failures, prose } = measured(repoRoot);
  // The structural findings come first and alone: with fenced code or a
  // chapter heading in it the file is not a glossary yet, and the ratchet on
  // its prose is not the thing to say.
  if (failures.length) return failures.map((message) => ({ message }));

  const ratchet = ratchetFor(repoRoot);
  return ratchet.failures({ proseLines: prose }).map((failure) =>
    // A missing record arrives already worded: there is nothing check-specific
    // to say about a baseline that is not there.
    failure.kind === 'absent'
      ? { message: failure.message }
      : {
          message:
            `prose lines rose: ${failure.count} against a baseline of ${failure.recorded} ` +
            `(recorded ${ratchet.envelope('recorded')}).`,
        },
  );
}

/** The green line: the count, its baseline, and a nudge when it has fallen. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { prose } = measured(repoRoot);
  const recorded = recordedProse(ratchetFor(repoRoot));
  const fell = prose < recorded ? ` — fell from ${recorded}; record it with --update` : '';
  return `${prose} prose lines against a baseline of ${recorded}${fell}`;
}

/**
 * `--update` re-records the ratchet — a write, so it lives here and never in
 * `run`, which only measures. It FALLS THROUGH: the run then continues against
 * what was just written, which is how a deliberate fall is recorded and checked
 * in one go, so it belongs to the fall-through slot and not the terminal one.
 */
function record() {
  const { prose } = measured(REPO_ROOT);
  // A MERGE, through the ratchet: the number is replaced and the record's
  // envelope survives. `recorded` is seeded onto a record written from nothing
  // and never restated, which is why the line below asks for it by hand — the
  // day the count was argued about is not the day a tool re-recorded it. Before
  // #601 this rewrote the whole record, so an --update that moved nothing still
  // stamped today's date and churned the file.
  openRatchet({ file: BASELINE }).update(
    { proseLines: prose },
    {
      seed: {
        subject: SUBJECT,
        recorded: new Date().toISOString().slice(0, 10),
        note: 'Ratchet: the count may fall, never rise. Re-record with --update, set `recorded` to the day it was argued, and say why in the PR.',
      },
    },
  );
  console.log(`[check-glossary] baseline recorded: ${prose} prose lines (set \`recorded\` by hand)`);
}

main(import.meta.url, 'check:glossary', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
