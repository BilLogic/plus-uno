#!/usr/bin/env node
/**
 * Glossary-only check on GLOSSARY.md (#420).
 *
 * GLOSSARY.md is the glossary: one entry per term, and nothing else. The failure
 * this guards against has a shape: a rename map, an interface-to-schema table,
 * a rendering convention — each arrives as "just one more section", each is
 * read by every session that opens the glossary, and the two sibling repos
 * grew their glossaries to 40k and 18k chars that way before anyone noticed.
 * Reference belongs behind a pointer; a glossary that carries it is sprawl.
 *
 * The format is the mattpocock-skills plugin's: a `**Term**:` line, a one- or
 * two-sentence definition, an optional `_Avoid_:` line, grouped under `###`
 * clusters. What "glossary only" means here, mechanically:
 *   - no fenced code (a glossary defines words; code is reference);
 *   - no heading deeper than `###` (a cluster is a term group, not a chapter);
 *   - every `##` section and every `###` cluster holds at least one term entry
 *     (a heading with no terms under it is prose wearing a heading);
 *   - a term entry is exactly a definition line and an optional `_Avoid_:`
 *     line — anything more under a term is reference hiding from the ratchet;
 *   - a table row belongs only to the
 *     ONE section that is not a term group: § Two vocabularies, ADR-023's
 *     only statement, whose table is the rule itself and which pointers across
 *     the harness cite by that name. It is held to its table instead of terms;
 *   - prose lines — anything that is not a heading, a term entry, a table row,
 *     frontmatter or an HTML comment — are RATCHETED: the count may fall, never
 *     rise. A one-line pointer to where a convention now lives is prose and is
 *     allowed; the ratchet keeps it to one line.
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
export const SUBJECT = 'GLOSSARY.md';
/** The one section that holds a table rather than term entries (ADR-023). Matched on its name, before the dash gloss. */
export const TWO_VOCABULARIES = 'Two vocabularies';
/** Repo-relative: also this record's key in the shape table, and what the registry row declares. */
export const BASELINE = 'scripts/baselines/glossary-baseline.json';

export const REMEDY =
  '  -> a glossary defines terms; move the reference behind a pointer, or re-baseline with --update and say why.';

/**
 * `**Term**:` — or a paired term, `**ladder** / **disclosed**:`. The colon ends
 * the line. Exported so every reader of the glossary parses one grammar.
 */
export const TERM = /^\*\*[^*]+\*\*(?:\s*\/\s*\*\*[^*]+\*\*)*:$/;

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
  let entry = null; // the open term entry: { term, line, body } — body counts its lines
  let section = null; // the open `##` heading
  let cluster = null; // the open `###` heading
  const terms = new Map(); // `section` or `section › cluster` -> term entries under it
  const tables = new Map(); // `##` heading -> table rows under it
  const isTwoVocabularies = (h) => h !== null && h.startsWith(TWO_VOCABULARIES);
  const closeEntry = () => {
    if (entry && entry.body === 0) failures.push(`line ${entry.line}: term "${entry.term}" has no definition`);
    entry = null;
  };
  lines.forEach((raw, index) => {
    const i = index + offset;
    const l = raw.trimEnd();
    if (l.startsWith('```')) { closeEntry(); inFence = !inFence; if (inFence) failures.push(`line ${i + 1}: fenced code in the glossary`); return; }
    if (inFence) return;
    if (l.startsWith('<!--')) inComment = true;
    if (inComment) { if (l.includes('-->')) inComment = false; return; }
    if (l === '') { closeEntry(); return; }
    if (/^#{4,}\s/.test(l)) { closeEntry(); failures.push(`line ${i + 1}: heading "${l}" is deeper than a cluster — clusters are term groups, not chapters`); return; }
    if (/^###\s/.test(l)) { closeEntry(); cluster = `${section} › ${l.replace(/^###\s*/, '')}`; terms.set(cluster, 0); return; }
    if (/^##\s/.test(l)) { closeEntry(); section = l.replace(/^##\s*/, ''); cluster = null; terms.set(section, 0); tables.set(section, 0); return; }
    if (/^#\s/.test(l)) { closeEntry(); return; }
    if (TERM.test(l)) {
      closeEntry();
      entry = { term: l.slice(0, -1), line: i + 1, body: 0 };
      for (const h of [section, cluster]) if (h !== null) terms.set(h, terms.get(h) + 1);
      return;
    }
    if (entry) {
      // A term entry's body: its definition line, then at most its `_Avoid_:` line.
      entry.body += 1;
      const avoid = /^_Avoid_:/.test(l);
      if (entry.body === 1 && avoid) failures.push(`line ${i + 1}: term "${entry.term}" lists what to avoid before saying what it is`);
      else if (entry.body === 2 && !avoid) failures.push(`line ${i + 1}: term "${entry.term}" has a second definition line — one or two sentences, on one line`);
      else if (entry.body > 2) failures.push(`line ${i + 1}: term "${entry.term}" runs past its \`_Avoid_:\` line — reference belongs behind a pointer`);
      return;
    }
    if (l.startsWith('|')) {
      if (!isTwoVocabularies(section)) { failures.push(`line ${i + 1}: a table row outside § ${TWO_VOCABULARIES} — a term is a \`**Term**:\` entry`); return; }
      if (!/^\|\s*-+/.test(l)) tables.set(section, tables.get(section) + 1);
      return;
    }
    prose += 1;
  });
  closeEntry();
  for (const [h, n] of terms) {
    if (isTwoVocabularies(h)) { if (!tables.get(h)) failures.push(`section "${h}" has lost its table — it is ADR-023's only statement`); continue; }
    if (n === 0) failures.push(`section "${h}" holds no term entries — prose wearing a heading`);
  }
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
