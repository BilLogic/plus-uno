#!/usr/bin/env node
/**
 * `npm run check:size-fallbacks` — #268, the other half.
 *
 * `check:colour-fallbacks` holds the literal beside a COLOUR token to that
 * token's value. This holds the literal beside a DIMENSION token to its value,
 * over the same corpus, with the same ratchet, from the same modules:
 * `scripts/token-fallbacks.mjs` says what the defect is,
 * `scripts/lib/fallback-check.mjs` reads the tree for both, and
 * `scripts/lib/ratchet.mjs` owns both records — the comparison, the stale sweep
 * and the `--update` merge, reached through that same file (#600). What is left
 * here is the three ways this family differs (#610).
 *
 * IT IS THE BIGGER HALF. 546 disagreements inside `design-system/src` against
 * colour's 191 across the whole corpus, and the spread is worse: 61 uses of
 * `var(--size-section-gap-sm, 16px)` for a token that is `8px`, 52 of
 * `var(--size-element-pad-y-lg, 12px)` for a token that is `8px`. When the token
 * sheet is late — the Storybook docs iframe and six prototype pages carry none —
 * that is not a slightly-wrong shade, it is a different layout.
 *
 * WHICH TOKENS COUNT. Any token, from the same token sources, whose value
 * RESOLVES to a length. Not a name prefix: dimensions are spread across
 * `--size-*`, `--spacing-*`, `--font-size-*` and `--font-line-height-*`, and a
 * prefix list is a thing to forget to update. Selecting by value means a new
 * family is covered the day it is minted.
 *
 * WHY UNDEFINED NAMES ARE NOT REPORTED HERE, when they are for colour: 324 of
 * them are component-local custom properties — `var(--table-cell-x, 10px)`,
 * defined a few lines up in the component's own stylesheet, where the fallback
 * is the documented default and the whole construction is correct. Colour has no
 * equivalent population, so there the undefined name really is a defect. Putting
 * both under one exit code would bury one finding under 324 non-findings, which
 * is how a check stops being read.
 *
 * Usage:
 *   npm run check:size-fallbacks              hold the ratchet
 *   npm run check:size-fallbacks -- --update  re-record the baseline
 *   npm run check:size-fallbacks -- --report  print the whole audit, and gate
 */

import { dimensionKey } from '../design-system/src/lib/tokens-node.mjs';
import { fallbackCheck } from './lib/fallback-check.mjs';
import { main } from './lib/findings.mjs';

/**
 * Every custom-property name — the `--` prefix and nothing narrower, since the
 * dimension family is picked by VALUE and not by name. The grammar after the
 * prefix is the tokens module's (#507); this file used to spell it.
 */
const ANY_TOKEN = '--';

const SIZE = fallbackCheck({
  check: 'check:size-fallbacks',
  label: '[size]',
  baseline: 'docs/evals/size-fallback-baseline.json',
  noun: 'dimension',
  absent: 'dimension',
  census: 'dimension',
  prefix: ANY_TOKEN,
  normalise: dimensionKey,
  // The value-level half of "which tokens count": read every custom property,
  // then keep the ones whose resolved value is a length. The kind is read off
  // the VALUE and the answer is `tokens-node`'s (#620/#621) — which is the same
  // rule this file already argued for itself, now stated once.
  select: (tokens) => new Map([...tokens].filter(([, value]) => dimensionKey(value) !== null)),
  reportUndefined: false,
  why:
    'Literal fallbacks that disagree with their own DIMENSION token (#268). The colour ' +
    'half is docs/evals/colour-fallback-baseline.json; this is the bigger one. Keyed on ' +
    '"<token> <literal>" rather than file and line, because a line number churns on ' +
    'every edit above it while the pair is the actual decision. The set may shrink and ' +
    'never grow; delete an entry when it is fixed, and the check reports any recorded ' +
    'pair that no longer disagrees. There is no undefinedTokens list here: an ' +
    'undefined name in this family is almost always a component-local custom property ' +
    'with a documented default, which is correct code — see scripts/check-size-fallbacks.mjs.',
});

export const { run, summary } = SIZE;

main(import.meta.url, SIZE.check, SIZE);
