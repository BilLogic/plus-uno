#!/usr/bin/env node
/**
 * `npm run check:focus-ring` — every focus rule has an affordance a sighted
 * keyboard user can actually see (#368).
 *
 * See `scripts/focus-ring.mjs` for the measurement and its four blind spots.
 * The finding it was written for: of 84 focus rules in this design system, 29
 * had no affordance reaching WCAG 1.4.11's 3:1 — `.plus-input:focus` announced
 * itself with a #84cfff border at 1.62:1, the AM/PM toggle and the file drop
 * zone with an 8% tint at 1.13:1, four textarea states at 2.22:1, and six
 * readonly fields with the same grey they wear at rest. All 29 are fixed;
 * `docs/evals/focus-ring.json` records the sweep and holds no exceptions.
 *
 * WHY THERE IS NO RATCHET HERE. `check:intent-roles` ratchets because the thing
 * it counts is a vocabulary, and vocabulary moves one call site at a time. This
 * counts a defect. A focus indicator nobody can see is not a preference to be
 * migrated at leisure, so the bar is zero and an exception has to argue that a
 * keyboard user does not need to see this particular thing.
 *
 * Run: `npm run check:focus-ring`.
 */
import fs from 'node:fs';
import path from 'node:path';

import { NON_TEXT, REPO_ROOT, colours, failures, focusRules, indicators, stylesheets } from './focus-ring.mjs';

const RECORD = 'docs/evals/focus-ring.json';
const ROLES_FILE = 'design-system/src/tokens/_color_roles.scss';

const record = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, RECORD), 'utf8'));
const files = stylesheets();
const values = colours();
const rules = indicators(focusRules(files), values);

const found = [];

/*
 * Floors. A resolver that stopped finding stylesheets, or a selector scan that
 * stopped recognising `:focus`, would report a clean sweep — which is the one
 * result this check must never give by accident.
 */
const MIN_FILES = 150;
const MIN_RULES = 60;
if (files.length < MIN_FILES) found.push(`only ${files.length} stylesheets scanned (floor ${MIN_FILES}).`);
if (rules.length < MIN_RULES) {
  found.push(
    `only ${rules.length} focus rules found (floor ${MIN_RULES}). ` +
      'A scan that stopped recognising focus selectors reports every ring as fine.',
  );
}

/*
 * The role must exist. 29 call sites resolve through it, and a `var()` naming a
 * token nobody defines paints NOTHING — `border-color` falls back to
 * currentColor, `box-shadow` to no shadow at all. That failure is invisible to
 * a check that measures token VALUES, so it is asserted directly.
 */
const roles = fs.readFileSync(path.join(REPO_ROOT, ROLES_FILE), 'utf8');
if (!/--color-focus-ring:/.test(roles)) {
  found.push(`${ROLES_FILE} no longer defines --color-focus-ring, which every fixed focus rule resolves through.`);
}

found.push(...failures(rules, record.exceptions ?? {}));

if (found.length) {
  console.error(`\n[focus-ring] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error('✗ check:focus-ring\n');
  console.error(
    `  -> A focus indicator is held to ${NON_TEXT}:1 against what it sits on (WCAG 1.4.11),\n` +
      '     and it is the only thing telling a keyboard user where they are. Use\n' +
      '     `var(--color-focus-ring)` — 5.02:1 on the page — rather than a state tint or\n' +
      '     an inverse colour meant for dark grounds.',
  );
  process.exit(1);
}

const worst = rules.reduce((low, entry) => (entry.best.ratio < low.best.ratio ? entry : low), rules[0]);
console.log(
  `✓ check:focus-ring — ${rules.length} focus rules, all at or above ${NON_TEXT}:1 ` +
    `(worst ${worst.best.ratio.toFixed(2)}:1, ${worst.best.token} in ${path.basename(worst.file)})`,
);
