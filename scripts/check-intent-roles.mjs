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
import { fileURLToPath } from 'node:url';

import { REPO_ROOT, edgeUses, failures, stylesheets } from './intent-roles.mjs';

const BASELINE = 'docs/evals/intent-role-adoption.json';
const ROLES_FILE = 'design-system/src/tokens/_color_roles.scss';

const baseline = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BASELINE), 'utf8'));
const files = stylesheets();
const uses = edgeUses(files);

const found = [];

/*
 * An empty corpus agrees with everything. The floor is the number of
 * stylesheets found on 2026-08-29; a resolver change that stopped finding them
 * would otherwise read as a clean sweep.
 */
const MIN_FILES = 150;
if (files.length < MIN_FILES) {
  found.push(
    `only ${files.length} stylesheets scanned (floor ${MIN_FILES}). ` +
      'A corpus that shrank silently reports every remaining use as fixed.',
  );
}

/*
 * The roles must EXIST. If `_color_roles.scss` were regenerated away — the
 * thing its own header warns about — every migrated call site would resolve to
 * nothing, and this check would still pass, because it counts base uses.
 */
const roles = fs.readFileSync(path.join(REPO_ROOT, ROLES_FILE), 'utf8');
for (const intent of ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info']) {
  if (!roles.includes(`--color-${intent}-border:`)) {
    found.push(`${ROLES_FILE} no longer defines --color-${intent}-border, which ${uses.length ? 'call sites' : 'the migration'} depend on.`);
  }
}

for (const [file, entry] of Object.entries(baseline.files ?? {})) {
  if (!entry.why || entry.why.length < 40) {
    found.push(`${file} is baselined without a reason. Say why the base is still right there, or migrate it.`);
  }
}

found.push(...failures(uses, baseline.files ?? {}));

if (found.length) {
  console.error(`\n[intent-roles] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error('✗ check:intent-roles\n');
  console.error(
    '  -> An intent colour on an edge names the role: `var(--color-danger-border)`,\n' +
      `     not \`var(--color-danger)\`. The roles are defined in ${ROLES_FILE}.\n` +
      `     If a call site genuinely needs the base, record it in ${BASELINE} with a reason.`,
  );
  process.exit(1);
}

const remaining = uses.length;
console.log(
  `✓ check:intent-roles — ${files.length} stylesheets, ${remaining} edge use(s) of an intent base remain, ` +
    `all recorded (${baseline.migrated} migrated ${baseline.recordedAt})`,
);
