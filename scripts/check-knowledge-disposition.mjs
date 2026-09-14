/**
 * Every file under docs/knowledge/ reaches a disposition.
 *
 * The folder became sediment because nothing forced the question. A lesson got
 * filed, nobody decided whether it was a rule, an ADR, or nothing, and it sat —
 * 15 live files with a median age of four months by the time #172 swept them.
 * This is the forcing function: a note may exist, but it may not exist
 * undecided.
 *
 * The rule and its rationale live in docs/knowledge/INDEX.md; this file is only
 * the enforcement. Frontmatter:
 *
 *   disposition: rule | adr | archive
 *   disposition-target: <repo path>   (required for rule and adr; must resolve)
 *
 * Two structural exclusions, both deliberate and both narrow:
 *
 *  - docs/knowledge/archive/ — the graveyard for superseded docs. Archiving IS a
 *    disposition, so its contents do not need to declare one. #172 answered this
 *    explicitly: the 30 archived files are out of scope and stay as they are.
 *  - INDEX.md and changelog.md — the folder's contract and its ledger. They
 *    govern the folder rather than sitting in it. Named here rather than
 *    exempted by a frontmatter value, so the exemption cannot spread to the next
 *    note that would rather not decide.
 *
 * Usage:
 *   node scripts/check-knowledge-disposition.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { documents, frontmatter } from './lib/corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const RELATIVE_ROOT = 'docs/knowledge';
const ROOT = path.join(REPO_ROOT, RELATIVE_ROOT);

const EXCLUDED_DIRS = ['archive'];
const GOVERNING_FILES = ['INDEX.md', 'changelog.md'];
const DISPOSITIONS = ['rule', 'adr', 'archive'];
/** `archive` names a destination inside the folder, so it needs no separate target. */
const TARGET_REQUIRED = ['rule', 'adr'];

/** Files in scope: everything below docs/knowledge/ that is not excluded. */
function inScope(root = REPO_ROOT) {
  return documents(RELATIVE_ROOT, { root, ext: null })
    .filter((rel) => {
      const within = rel.slice(RELATIVE_ROOT.length + 1);
      return within.includes('/')
        ? !EXCLUDED_DIRS.includes(within.slice(0, within.indexOf('/')))
        : !GOVERNING_FILES.includes(within);
    })
    .map((rel) => path.join(root, rel));
}

/**
 * Frontmatter as a flat key→value map, read through the corpus (#503).
 *
 * `allowLeadingComment` is why this could not simply call the shared reader
 * before: the house marker `<!-- Tier: 2 (on demand) -->` precedes the fence in
 * most of these files, and the corpus anchored at byte 0. The option moves that
 * one difference into the shared reader, where it is tested, rather than keeping
 * a whole second parser to hold it.
 *
 * @returns {Record<string, string>|null} null when there is no closed block.
 */
function dispositionMeta(abs) {
  const { meta, raw } = frontmatter(abs, { allowLeadingComment: true });
  return raw === null ? null : meta;
}

const rel = (abs) => path.relative(REPO_ROOT, abs).replace(/\\/g, '/');
const failures = [];

if (!fs.existsSync(ROOT)) {
  console.log('[knowledge] docs/knowledge/ does not exist — nothing to check');
  process.exit(0);
}

const files = inScope();

for (const abs of files) {
  const name = rel(abs);
  const fm = dispositionMeta(abs);

  if (!fm || !fm.disposition) {
    failures.push(
      `${name}\n    no disposition. Decide what this note became and record it:\n` +
        `      disposition: rule | adr | archive\n` +
        `      disposition-target: <path the content now lives at>\n` +
        `    Deleting is the fourth outcome and usually the right one — git keeps the trail.`,
    );
    continue;
  }

  if (!DISPOSITIONS.includes(fm.disposition)) {
    failures.push(`${name}\n    disposition: ${fm.disposition} — expected one of ${DISPOSITIONS.join(' | ')}`);
    continue;
  }

  // `archive` names a destination inside this folder, so it needs no target — but
  // it does need to be true. A live note declaring `archive` while sitting outside
  // archive/ is the cheapest way to pass this check without deciding anything,
  // which is exactly what the folder became sediment by doing.
  if (fm.disposition === 'archive') {
    failures.push(
      `${name}\n    disposition: archive, but the file is not under docs/knowledge/archive/.` +
        '\n    Move it there — archiving is a destination, not a label.',
    );
    continue;
  }

  if (!TARGET_REQUIRED.includes(fm.disposition)) continue;

  const target = fm['disposition-target'];
  if (!target) {
    failures.push(`${name}\n    disposition: ${fm.disposition} needs a disposition-target naming where the content landed`);
    continue;
  }
  if (!fs.existsSync(path.join(REPO_ROOT, target))) {
    failures.push(`${name}\n    disposition-target: ${target} does not resolve from the repo root`);
  }
}

if (failures.length) {
  console.error(
    `[knowledge] ${failures.length} of ${files.length} in-scope file(s) under docs/knowledge/ have not reached a disposition:\n\n` +
      failures.map((f) => `  ${f}`).join('\n\n') +
      `\n\n  The contract is docs/knowledge/INDEX.md. Work leaves behind a rule, an ADR,\n` +
      `  or nothing; this folder stages notes between those states and holds none.`,
  );
  process.exit(1);
}

console.log(
  `[knowledge] ${files.length} in-scope file(s) under docs/knowledge/, all dispositioned` +
    ` (archive/ excluded; ${GOVERNING_FILES.join(' + ')} govern the folder)`,
);
