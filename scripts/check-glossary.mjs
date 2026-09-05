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

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');
export const SUBJECT = 'CONTEXT.md';
export const BASELINE = path.join(REPO_ROOT, 'docs/evals/glossary-baseline.json');

export function measure(text) {
  const lines = text.split('\n');
  const failures = [];
  let inFront = false;
  let inFence = false;
  let inComment = false;
  let prose = 0;
  let section = null;
  const sections = new Map(); // heading -> table rows
  lines.forEach((raw, i) => {
    const l = raw.trimEnd();
    if (i === 0 && l === '---') { inFront = true; return; }
    if (inFront) { if (l === '---') inFront = false; return; }
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

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const update = process.argv.includes('--update');
  const text = readFileSync(path.join(REPO_ROOT, SUBJECT), 'utf8');
  const { failures, prose } = measure(text);
  let baseline = null;
  try { baseline = JSON.parse(readFileSync(BASELINE, 'utf8')); } catch { /* first run */ }
  if (update) {
    baseline = { subject: SUBJECT, proseLines: prose, recorded: new Date().toISOString().slice(0, 10), note: 'Ratchet: the count may fall, never rise. Re-record with --update and say why in the PR.' };
    writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n');
    console.log(`[check-glossary] baseline recorded: ${prose} prose lines`);
  }
  if (failures.length) {
    console.error(`[check-glossary] ${SUBJECT} is not a glossary:\n` + failures.map((f) => `  ${f}`).join('\n'));
    process.exit(1);
  }
  if (!baseline) { console.error('[check-glossary] no baseline; run with --update once'); process.exit(1); }
  if (prose > baseline.proseLines) {
    console.error(`[check-glossary] prose lines rose: ${prose} against a baseline of ${baseline.proseLines} (recorded ${baseline.recorded}).\n  -> a glossary defines terms; move the reference behind a pointer, or re-baseline with --update and say why.`);
    process.exit(1);
  }
  const fell = prose < baseline.proseLines ? ` — fell from ${baseline.proseLines}; record it with --update` : '';
  console.log(`[check-glossary] OK — ${prose} prose lines against a baseline of ${baseline.proseLines}${fell}`);
}
