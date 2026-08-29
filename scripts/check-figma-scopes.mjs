#!/usr/bin/env node
/**
 * `npm run check:figma-scopes` — no Figma colour variable offers itself for a
 * role its contrast cannot carry, and no group disagrees with its peers.
 *
 * See `scripts/figma-scopes.mjs` for the convention and for the five variables
 * that sat outside it until 2026-08-29 — every one of them offerable as a
 * TEXT_FILL, including `_Warning/Warning Container` at 1.5:1 on white. That is
 * the same defect as the 108 CSS declarations painting a foreground from an
 * intent base (#368), reached from the designer's end.
 *
 * The convention is DERIVED from the majority across the twelve accent groups,
 * not declared here, so the finding is "this one disagrees with its peers"
 * rather than "this one disagrees with me". A new group that follows the
 * pattern needs no edit to this file; one that does not is the finding.
 *
 * Run: `npm run check:figma-scopes`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { convention, failures } from './figma-scopes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const RECORDING = 'design-system/figma/colour-values.json';

const recording = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, RECORDING), 'utf8'));
const scopes = recording.scopes ?? {};

const found = [];

/*
 * A recording with no scopes would pass everything. The floor is the count of
 * accent colour variables that carry a role, measured on 2026-08-29.
 */
const MIN_SCOPED = 75;
if (Object.keys(scopes).length < MIN_SCOPED) {
  found.push(
    `only ${Object.keys(scopes).length} variables have recorded scopes (floor ${MIN_SCOPED}). ` +
      'Re-read them from Figma; an empty recording agrees with everything.',
  );
}

const conventions = convention(scopes);
found.push(...failures(scopes, conventions));

/*
 * The convention has to have been FOUND. If the naming changed under
 * `classify`, every group would look unclassifiable, no majority would form,
 * and the check would pass by having nothing to say.
 */
const EXPECTED_ROLES = ['base', 'text', 'container', 'on', 'on-container', 'icon', 'border'];
for (const role of EXPECTED_ROLES) {
  if (!conventions.has(role)) {
    found.push(`no convention found for the \`${role}\` role — the names stopped matching classify().`);
  }
}

if (found.length) {
  console.error(`\n[figma-scopes] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error('✗ check:figma-scopes\n');
  console.error(
    '  -> Scopes are what the Figma picker OFFERS. Narrowing one changes nothing that\n' +
      '     already ships — an existing binding is untouched — so the fix is to narrow the\n' +
      '     variable in Figma and re-read the scopes into ' + RECORDING + '.',
  );
  process.exit(1);
}

const roles = [...conventions.entries()]
  .map(([role, r]) => `${role} ${r.agreeing}/${r.of}`)
  .join(' · ');
console.log(
  `✓ check:figma-scopes — ${Object.keys(scopes).length} variables, ` +
    `${conventions.size} roles in agreement (${roles})`,
);
