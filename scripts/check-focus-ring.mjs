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

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import {
  NON_TEXT,
  REPO_ROOT,
  colours,
  failures,
  focusRules,
  indicators,
  invisible,
  stylesheets,
} from './focus-ring.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

const RECORD = 'docs/evals/focus-ring.json';
const ROLES_FILE = `${TOKEN_DIR}/_color_roles.scss`;

/*
 * Floors. A resolver that stopped finding stylesheets, or a selector scan that
 * stopped recognising `:focus`, would report a clean sweep — which is the one
 * result this check must never give by accident.
 */
const MIN_FILES = 150;
const MIN_RULES = 60;

export const REMEDY =
  `  -> A focus indicator is held to ${NON_TEXT}:1 against what it sits on (WCAG 1.4.11),\n` +
  '     and it is the only thing telling a keyboard user where they are. Use\n' +
  '     `var(--color-focus-ring)` — 5.02:1 on the page — rather than a state tint or\n' +
  '     an inverse colour meant for dark grounds.';

// The sweep — the corpus walk, the token values and the measured rules — is the
// same for both questions, so it happens once per root.
const inputs = byRoot((repoRoot) => {
  const files = stylesheets(repoRoot);
  const values = colours(repoRoot);
  const rolesPath = path.join(repoRoot, ROLES_FILE);
  return {
    files,
    rules: indicators(focusRules(files, repoRoot), values),
    // A vanished roles file is the floor case, not a crash (#611).
    roles: fs.existsSync(rolesPath) ? fs.readFileSync(rolesPath, 'utf8') : '',
  };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files, rules, roles } = inputs(repoRoot);
  const found = [];

  if (files.length < MIN_FILES) {
    found.push({ message: `only ${files.length} stylesheets scanned (floor ${MIN_FILES}).` });
  }
  if (rules.length < MIN_RULES) {
    found.push({
      message:
        `only ${rules.length} focus rules found (floor ${MIN_RULES}). ` +
        'A scan that stopped recognising focus selectors reports every ring as fine.',
    });
  }

  /*
   * The role must exist. 29 call sites resolve through it, and a `var()` naming a
   * token nobody defines paints NOTHING — `border-color` falls back to
   * currentColor, `box-shadow` to no shadow at all. That failure is invisible to
   * a check that measures token VALUES, so it is asserted directly.
   */
  if (!/--color-focus-ring:/.test(roles)) {
    found.push({
      message: `${ROLES_FILE} no longer defines --color-focus-ring, which every fixed focus rule resolves through.`,
    });
  }

  /*
   * The record, through `scripts/lib/ratchet.mjs` (#600). Its exception map
   * keys a rule to THE REASON ITSELF, which is the shape declared for it in
   * `scripts/lib/ratchet-shapes.mjs` — so the module reports a recorded rule
   * that is no longer invisible as stale, and a recorded rule whose reason says
   * nothing as unreviewed. It is maintained BY HAND and offers no `--update`:
   * the bar here is zero, and a flag that recorded an invisible focus ring for
   * you would be the leisurely migration this check exists not to allow.
   */
  const gate = openRatchet({ file: RECORD, repoRoot });
  const under = invisible(rules);
  const side = Object.fromEntries([...under.keys()].map((key) => [key, '']));
  if (gate.absent) return [...found, ...gate.failures(side).map(({ message }) => ({ message }))];

  found.push(
    ...failures(under, {
      fresh: gate.failures(side).map((f) => f.key),
      stale: gate.stale(side).map((s) => s.key),
      unreviewed: gate.unreviewed().map((u) => u.key),
    }).map((message) => ({ message })),
  );
  return found;
}

/** The green line, which carries the narrowest ring the sweep measured. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { rules } = inputs(repoRoot);
  const worst = rules.reduce((low, entry) => (entry.best.ratio < low.best.ratio ? entry : low), rules[0]);
  return (
    `${rules.length} focus rules, all at or above ${NON_TEXT}:1 ` +
    `(worst ${worst.best.ratio.toFixed(2)}:1, ${worst.best.token} in ${path.basename(worst.file)})`
  );
}

main(import.meta.url, 'check:focus-ring', { run, summary, remedy: REMEDY });
