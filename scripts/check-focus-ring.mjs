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
 * readonly fields with the same grey they wear at rest. All 29 are fixed, and
 * `docs/evals/focus-ring.json` records the sweep with no exceptions.
 *
 * A RING ON A GROUND ITS CALLER PAINTS is measured, not excused. A rule can
 * declare the grounds it sits on with `// @grounds: --color-x --color-y` in
 * its block (`scripts/lib/declared-grounds.mjs`); it is then held to 3:1 on
 * EVERY declared ground instead of the page, and one ground under the bar fails
 * it. An empty list or an unknown token is an error. `CloseButton tone="inverse"`
 * is the first: its light ring is measured on the eight fills it is for.
 *
 * WHY THERE IS NO RATCHET HERE. `check:intent-roles` ratchets because the thing
 * it counts is a vocabulary, and vocabulary moves one call site at a time. This
 * counts a defect. A focus indicator nobody can see is not a preference to be
 * migrated at leisure, so the bar is zero. A ground the check cannot see is
 * DECLARED with `@grounds` and measured; an exception is for what cannot be
 * measured at all, and has to show the ring is still seen where it is used.
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
  declarationErrors,
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
export const MIN_FILES = 150;
export const MIN_RULES = 60;

export const REMEDY =
  `  -> A focus indicator is held to ${NON_TEXT}:1 against what it sits on (WCAG 1.4.11),\n` +
  '     and it is the only thing telling a keyboard user where they are. Use\n' +
  '     `var(--color-focus-ring)` — 5.02:1 on the page — rather than a state tint or\n' +
  '     an inverse colour meant for dark grounds. A ring drawn on a ground its caller\n' +
  '     paints declares that ground (`// @grounds: --color-…` in its block) and is\n' +
  '     measured on each one.';

// The sweep — the corpus walk, the token values and the measured rules — is the
// same for both questions, so it happens once per root.
const inputs = byRoot((repoRoot) => {
  const files = stylesheets(repoRoot);
  const values = colours(repoRoot);
  const rolesPath = path.join(repoRoot, ROLES_FILE);
  const raw = focusRules(files, repoRoot);
  return {
    files,
    rules: indicators(raw, values),
    declarations: declarationErrors(files, repoRoot, values),
    // A vanished roles file is the floor case, not a crash (#611).
    roles: fs.existsSync(rolesPath) ? fs.readFileSync(rolesPath, 'utf8') : '',
  };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files, rules, roles, declarations } = inputs(repoRoot);
  const found = [];

  // A `@grounds` list that names nothing, or a token nobody defines, measures
  // nothing — so it fails here rather than passing as a rule with no ground.
  found.push(...declarations.map((message) => ({ message })));

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

/**
 * The green line, which carries the narrowest ring the sweep measured among the
 * rules it holds to the bar. A recorded exception is counted apart: it is under
 * 3:1 on the page by definition, and naming it as the "worst" of rules that
 * are "all at or above 3:1" would contradict itself.
 */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { rules } = inputs(repoRoot);
  const under = invisible(rules);
  const held = rules.filter((entry) => !under.has(`${entry.file}:${entry.line}`));
  const worst = held.reduce((low, entry) => (entry.best.ratio < low.best.ratio ? entry : low), held[0]);
  const recorded = under.size ? `, ${under.size} recorded in ${RECORD}` : '';
  // Rules measured on declared `@grounds` rather than the page, with the ground
  // each one is weakest on — the number a reviewer of that declaration wants.
  const declared = rules
    .filter((entry) => entry.declared)
    .map((entry) => `${path.basename(entry.file)} on ${entry.grounds.length} declared ` +
      `ground${entry.grounds.length === 1 ? '' : 's'}, worst ` +
      `${entry.best.ratio.toFixed(2)}:1 on ${entry.best.ground}`);
  return (
    `${held.length} focus rules, all at or above ${NON_TEXT}:1 ` +
    `(worst ${worst.best.ratio.toFixed(2)}:1, ${worst.best.token} in ${path.basename(worst.file)})${recorded}` +
    (declared.length ? `; ${declared.join('; ')}` : '')
  );
}

main(import.meta.url, 'check:focus-ring', { run, summary, remedy: REMEDY });
