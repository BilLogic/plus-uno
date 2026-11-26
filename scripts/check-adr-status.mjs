/**
 * An ADR's body and its frontmatter agree about whether it was superseded.
 *
 * The status vocabulary lives in docs/adr/overview.md; this file is only the
 * enforcement. Two rules:
 *
 *   1. An ADR whose body says it is superseded (a `Status` line or a leading
 *      banner that starts "Superseded" or "Retired") carries `status: superseded`.
 *      Otherwise anything reading the frontmatter takes a retired decision as
 *      standing.
 *   2. A `status: superseded` ADR names what replaced it: "Superseded by" an ADR,
 *      a linked document, or a backticked path.
 *
 * Usage:
 *   node scripts/check-adr-status.mjs
 */

import path from 'path';
import { fileURLToPath } from 'url';

import { documents, frontmatter } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ADR_DIR = 'docs/adr';

/**
 * A `- **Status**:` line or a `> **` banner that opens with Superseded / Retired. A partial
 * supersession ("Superseded for motion") is a correction, not a retirement, and is left alone.
 */
const SAYS_SUPERSEDED = /^(?:-\s+\*\*Status\*\*:\s*|>\s*\*\*)(?:superseded|retired)\b(?!\s+(?:for|in part|partly|on)\b)/im;
/** "Superseded by X" / "Retired in full by X", capturing X to the end of the line. */
const SUCCESSOR = /\b(?:superseded|retired)(?:\s+in\s+full)?(?:\s*\([^)]*\))?\s+by\s+(.*)/gi;
/** What counts as naming a successor: an ADR number, a markdown link, or a backticked path. */
const NAMES_A_THING = /ADR-\d+|\]\([^)]+\)|`[^`]+`/;

export const REMEDY =
  '  Vocabulary: docs/adr/overview.md § Status vocabulary. `status:` in the frontmatter is what\n' +
  '  the index and agents read; the body must not contradict it.';

const inputs = byRoot((repoRoot) =>
  documents(ADR_DIR, { root: repoRoot, ext: ['.md'] })
    .filter((rel) => path.basename(rel) !== 'overview.md' && path.dirname(rel) === ADR_DIR)
    .map((rel) => ({ rel, abs: path.join(repoRoot, rel) })),
);

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const findings = [];
  for (const { rel, abs } of inputs(repoRoot)) {
    const { meta, body } = frontmatter(abs);
    const status = meta.status;

    if (status !== 'superseded' && SAYS_SUPERSEDED.test(body)) {
      findings.push({
        file: rel,
        message: `${rel}: the body says it is superseded but the frontmatter says status: ${status ?? '(none)'}. Set status: superseded.`,
      });
    }
    if (status === 'superseded') {
      const named = [...body.matchAll(SUCCESSOR)].some((m) => NAMES_A_THING.test(m[1]));
      if (!named) {
        findings.push({
          file: rel,
          message: `${rel}: status: superseded must name what supersedes it ("Superseded by ADR-NNN", a link, or a \`path\`).`,
        });
      }
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).length} ADR(s) under ${ADR_DIR}/, body and status agree`;
}

main(import.meta.url, 'check:adr-status', { run, summary, remedy: REMEDY });
