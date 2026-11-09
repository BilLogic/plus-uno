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
 * readonly fields with the same gray they wear at rest. All 29 are fixed, and
 * `scripts/baselines/focus-ring.json` records the sweep with no exceptions.
 *
 * A RING ON A GROUND ITS CALLER PAINTS is measured, not excused. A rule can
 * declare the grounds it sits on with `// @grounds: --color-x --color-y` as
 * the first thing in a rule (`scripts/lib/declared-grounds.mjs`, an AST walk
 * over postcss-scss). Walking out from a focus rule, the first rule with a
 * background or a `@grounds` decides its ground; a declared list is held to
 * 3:1 on EVERY ground, and one ground under the bar fails it. A misplaced,
 * duplicated, empty or unknown annotation is an error. `CloseButton tone="inverse"`
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
import path from 'node:path';

import { COLOR_TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import {
  REPO_ROOT,
  colors,
  failures,
  focusRules,
  indicators,
  invisible,
  stylesheets,
} from './focus-ring.mjs';
import { NON_TEXT, declarationErrors } from './lib/declared-grounds.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

const RECORD = 'scripts/baselines/focus-ring.json';

/**
 * The focus role a ring resolves through, and how it is known to be defined.
 * `--ds-border-focused` (ADR-035) is the one ring token since the legacy ring
 * names were retired, so it is asserted always.
 */
const FOCUS_ROLES = [
  { token: '--ds-border-focused', file: `${COLOR_TOKEN_DIR}/`, always: true, defined: ({ values }) => values.has('--ds-border-focused') },
];

/*
 * Floors. A resolver that stopped finding stylesheets, or a selector scan that
 * stopped recognizing `:focus`, would report a clean sweep — which is the one
 * result this check must never give by accident.
 */
// Lowered from 150 to 100 when the Specs code, the root app and the specs prototypes left main (kept on archive/legacy-ds).
export const MIN_FILES = 100;
// Lowered from 50 to 49: Collapse, Divider, NavPills, Navbar and Scrollspy
// were retired, taking their own focus rules with them.
// Lowered from 49 to 48: Dropdown was retired for DropdownMenu, whose
// trigger is a caller's own Button or IconButton — already counted there —
// rather than a themed toggle with a focus rule of its own.
// Lowered from 48 to 44: NavTabs (5 hand-written focus-visible rules) was
// retired for Tabs, which draws its ring through the state mixin
// (`design-system/src/styles/_state.scss`'s `plus-state`/`plus-ring`) like
// Accordion and Flag already do — a rule this scanner cannot see, since it
// reads each component's own source text rather than compiled CSS. Only
// Tabs.scss's one still-hand-written rule (the tab panel's own ring, a
// different width/offset pair the mixin cannot express in one call) survives
// the move and keeps counting.
// Lowered from 44 to 43: RichTextEditor's block menu moved from Bootstrap's
// dropdown to DropdownMenu, whose rows draw their ring in MenuGroup.scss —
// already counted there — so its own `.dropdown-item:focus-visible` rule is gone.
// Lowered from 43 to 40: the state-mixin migration folded hand-written ring
// rules into plus-state/plus-ring includes, which this source-text scanner
// does not see.
// Lowered from 40 to 39: AiLabel was deleted, and its explain button's ring
// rule went with it.
// Lowered from 39 to 34 when the Specs code, the root app and the specs prototypes left main (kept on archive/legacy-ds).
export const MIN_RULES = 34;

export const REMEDY =
  `  -> A focus indicator is held to ${NON_TEXT}:1 against what it sits on (WCAG 1.4.11),\n` +
  '     and it is the only thing telling a keyboard user where they are. Use\n' +
  '     `var(--ds-border-focused)`\n' +
  '     rather than a state tint or an inverse color meant for dark grounds. A ring\n' +
  '     drawn on a ground its caller paints declares that ground\n' +
  '     (`// @grounds: --ds-…` or `--color-…` in its block) and is measured on each one.';

// The sweep — the corpus walk, the token values and the measured rules — is the
// same for both questions, so it happens once per root.
const inputs = byRoot((repoRoot) => {
  const files = stylesheets(repoRoot);
  const values = colors(repoRoot);
  const raw = focusRules(files, repoRoot);
  return {
    files,
    raw,
    values,
    rules: indicators(raw, values),
    declarations: declarationErrors(files, repoRoot, values),
  };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files, rules, declarations, values, raw } = inputs(repoRoot);
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
        'A scan that stopped recognizing focus selectors reports every ring as fine.',
    });
  }

  /*
   * The roles must exist. A `var()` naming a token nobody defines paints
   * NOTHING — `border-color` falls back to currentColor, `box-shadow` to no
   * shadow at all. That failure is invisible to a check that measures token
   * VALUES, so it is asserted directly, once per role in `FOCUS_ROLES`.
   */
  for (const role of FOCUS_ROLES) {
    const uses = raw.filter((rule) => rule.tokens.includes(role.token));
    if ((role.always || uses.length) && !role.defined({ values })) {
      found.push({
        message:
          `${role.file} no longer defines ${role.token}, which ${uses.length} focus rule(s) resolve through` +
          (uses.length ? ` (first: ${uses[0].file}:${uses[0].line}).` : '.'),
      });
    }
  }

  /*
   * The record, through `scripts/lib/ratchet.mjs` (#600). Each exception is a
   * rule with the reason it stands, and the set requires one — so the module
   * reports a recorded rule that is no longer invisible as stale, and a
   * recorded rule whose reason says nothing as unreviewed. It is maintained BY HAND and offers no `--update`:
   * the bar here is zero, and a flag that recorded an invisible focus ring for
   * you would be the leisurely migration this check exists not to allow.
   */
  const gate = openRatchet({ file: RECORD, repoRoot });
  const under = invisible(rules);
  const side = [...under.keys()];
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
