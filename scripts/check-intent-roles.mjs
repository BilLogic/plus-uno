#!/usr/bin/env node
/**
 * `npm run check:intent-roles` — an edge painted from an intent colour names the
 * `-border` ROLE, not the base (#368).
 *
 * See `scripts/intent-roles.mjs` for what is scanned and for the three things
 * the scan cannot see. The short version: `--color-danger` and
 * `--color-danger-border` are the same bytes today and not the same statement,
 * and the role is what lets warning's border move on its own — which it must,
 * since #9f8205 falls to 2.87:1 on the darkest surface step, under even the
 * 3:1 bar WCAG 1.4.11 sets for a non-text edge.
 *
 * A RATCHET, IN BOTH DIRECTIONS. 111 of the 137 uses were migrated on
 * 2026-08-29; the 26 that remain are recorded in
 * `docs/evals/intent-role-adoption.json` with a reason each. A count above its
 * record is a regression. A count BELOW its record is also a finding: the
 * baseline is the document that says why a remainder is allowed to remain, and
 * one that describes code that no longer exists has stopped being readable.
 *
 * EVERY ENTRY CARRIES A `why`. A baseline is a list of exceptions, and an
 * exception without a reason is just a number nobody can argue with.
 *
 * Run: `npm run check:intent-roles`.
 */
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, counts, edgeUses, failures, stylesheets } from './intent-roles.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { isUnreviewed, openRatchet } from './lib/ratchet.mjs';

const BASELINE = 'docs/evals/intent-role-adoption.json';
const ROLES_FILE = 'design-system/src/tokens/_color_roles.scss';

/*
 * An empty corpus agrees with everything. The floor is the number of
 * stylesheets found on 2026-08-29; a resolver change that stopped finding them
 * would otherwise read as a clean sweep.
 */
const MIN_FILES = 150;

const INTENTS = ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info'];

export const REMEDY =
  '  -> An intent colour on an edge names the role: `var(--color-danger-border)`,\n' +
  `     not \`var(--color-danger)\`. The roles are defined in ${ROLES_FILE}.\n` +
  `     If a call site genuinely needs the base, record it in ${BASELINE} with a reason.`;

// The corpus walk, the edge uses and the roles file are the same read for both
// questions, so they happen once per root.
const inputs = byRoot((repoRoot) => {
  const files = stylesheets(repoRoot);
  return {
    files,
    uses: edgeUses(files),
    roles: fs.readFileSync(path.join(repoRoot, ROLES_FILE), 'utf8'),
  };
});

/**
 * The record, through `scripts/lib/ratchet.mjs` (#600). Its row declares an
 * entry of TWO ratcheted counts with the reason in the entry's own `why`, and a
 * direction of BOTH — so the module reports a rise, a fall, a file the record
 * has stopped describing, and an entry whose reason says nothing, and this file
 * only words them.
 *
 * NO `--update`, by its row's `command: null`. The record is the document that
 * says why each remainder is allowed to remain, and every line of that is a
 * person's: a flag that re-recorded the counts and stamped the reasons
 * UNREVIEWED would produce a record the check immediately fails on, which is
 * the honest outcome and still not a thing worth offering.
 */
const gate = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

/**
 * A REASON THAT IS TOO SHORT TO BE ONE. The module's own test is that a reason
 * is not blank and not one of the four words people type instead of thinking;
 * this check has always held its own to 40 characters as well, because every
 * entry here has to name a decision and nothing that short does. The two are
 * unioned rather than one replacing the other.
 */
const reasonless = (ratchet) => {
  const keys = new Set(ratchet.unreviewed().map((entry) => entry.key));
  for (const [key, entry] of ratchet.entries) {
    if (isUnreviewed(entry.reason) || entry.reason.length < 40) keys.add(key);
  }
  return [...keys];
};

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files, uses, roles } = inputs(repoRoot);
  const found = [];

  if (files.length < MIN_FILES) {
    found.push({
      message:
        `only ${files.length} stylesheets scanned (floor ${MIN_FILES}). ` +
        'A corpus that shrank silently reports every remaining use as fixed.',
    });
  }

  /*
   * The roles must EXIST. If `_color_roles.scss` were regenerated away — the
   * thing its own header warns about — every migrated call site would resolve to
   * nothing, and this check would still pass, because it counts base uses.
   */
  for (const intent of INTENTS) {
    if (!roles.includes(`--color-${intent}-border:`)) {
      found.push({
        message: `${ROLES_FILE} no longer defines --color-${intent}-border, which ${uses.length ? 'call sites' : 'the migration'} depend on.`,
      });
    }
  }

  const ratchet = gate(repoRoot);
  const side = counts(uses);
  if (ratchet.absent) return [...found, ...ratchet.failures(side).map(({ message }) => ({ message }))];

  found.push(
    ...failures(uses, {
      failures: ratchet.failures(side),
      stale: ratchet.stale(side),
      unreviewed: reasonless(ratchet),
    }).map((message) => ({ message })),
  );
  return found;
}

/** The green line, which carries the remainder and what the baseline records. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { files, uses } = inputs(repoRoot);
  const remaining = uses.length;
  // `migrated` and `recordedAt` are ENVELOPE, not set: the ratchet does not own
  // them, and `envelope()` is how a check reads the record's unowned half (#601).
  // This line used to open the file a second time, which is the one thing
  // `scripts/lib/ratchet.mjs` says no check does — the record is opened once.
  const record = gate(repoRoot);
  return (
    `${files.length} stylesheets, ${remaining} edge use(s) of an intent base remain, ` +
    `all recorded (${record.envelope('migrated')} migrated ${record.envelope('recordedAt')})`
  );
}

main(import.meta.url, 'check:intent-roles', { run, summary, remedy: REMEDY });
