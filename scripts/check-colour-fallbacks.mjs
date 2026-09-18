#!/usr/bin/env node
/**
 * `npm run check:colour-fallbacks` — #268.
 *
 * What the defect is, and why one half of it is ratcheted and the other is not,
 * is written once in `scripts/token-fallbacks.mjs`. How a check of it reads the
 * tree is written once in `scripts/lib/fallback-check.mjs`, and how its RECORD
 * is read, compared and written is written once in `scripts/lib/ratchet.mjs`,
 * which both families reach through that same file (#600). This file is none of
 * the three: it is the colour family's differences, and nothing else (#610).
 *
 * WHY IT COMPOSES INTO `check:harness` when `check:storybook` and
 * `check:docs-chrome` do not: it is static. No browser, no server, no `npm ci` —
 * it parses the token sources and the tree, and runs in well under a second.
 *
 * Usage:
 *   npm run check:colour-fallbacks              hold the ratchet
 *   npm run check:colour-fallbacks -- --update  re-record the baseline
 *   npm run check:colour-fallbacks -- --report  print the whole audit, and gate
 */

import { fallbackCheck } from './lib/fallback-check.mjs';
import { main } from './lib/findings.mjs';

/**
 * The colour family. It is selected BY NAME — `--color-*` is one namespace and
 * the whole of it — and an undefined name here is a real defect: there is no
 * component-local population of them, so the fallback IS the colour and the
 * token is fiction.
 */
const COLOUR = fallbackCheck({
  check: 'check:colour-fallbacks',
  label: '[colour]',
  baseline: 'docs/evals/colour-fallback-baseline.json',
  noun: 'colour',
  absent: '--color-*',
  reportUndefined: true,
  why:
    'Literal fallbacks that disagree with their own token (#268). Keyed on ' +
    '"<token> <literal>" rather than file and line, because a line number churns on ' +
    'every edit above it while the pair is the actual decision. The set may shrink ' +
    'and never grow; delete an entry when it is fixed and the check reports any that ' +
    'no longer disagree. `undefinedTokens` is a separate list with a different ' +
    'endpoint: those names have no definition at all, so the fallback IS the colour, ' +
    'and the list should be driven to zero deliberately rather than shrinking as ' +
    'files are touched.',
});

export const { run, summary } = COLOUR;

main(import.meta.url, COLOUR.check, COLOUR);
