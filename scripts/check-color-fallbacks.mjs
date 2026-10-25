#!/usr/bin/env node
/**
 * `npm run check:color-fallbacks` — #268.
 *
 * What the defect is, and why one half of it is ratcheted and the other is not,
 * is written once in `scripts/token-fallbacks.mjs`. How a check of it reads the
 * tree is written once in `scripts/lib/fallback-check.mjs`, and how its RECORD
 * is read, compared and written is written once in `scripts/lib/ratchet.mjs`,
 * which both families reach through that same file (#600). This file is none of
 * the three: it is the color family's differences, and nothing else (#610).
 *
 * WHY IT COMPOSES INTO `check:harness` when `check:storybook` and
 * `check:docs-chrome` do not: it is static. No browser, no server, no `npm ci` —
 * it parses the token sources and the tree, and runs in well under a second.
 *
 * Usage:
 *   npm run check:color-fallbacks              hold the ratchet
 *   npm run check:color-fallbacks -- --update  re-record the baseline
 *   npm run check:color-fallbacks -- --report  print the whole audit, and gate
 */

import { COLOR_PREFIXES } from '../design-system/src/lib/tokens-node.mjs';
import { fallbackCheck } from './lib/fallback-check.mjs';
import { main } from './lib/findings.mjs';

/**
 * The color family. It is selected BY NAME — `--color-*` and `--ds-*`, the
 * legacy roles and the Atlassian-shaped tokens generated into `tokens/color/`,
 * read together while they coexist — and an undefined name here is a real
 * defect: there is no component-local population of them, so the fallback IS
 * the color and the token is fiction. A `--ds-*` token should carry no fallback
 * at all, which is `check:ds-fallbacks`' rule; this check still compares one
 * that slipped through, and still catches a misspelled `--ds-*` name.
 */
const COLOR = fallbackCheck({
  check: 'check:color-fallbacks',
  label: '[color]',
  baseline: 'scripts/baselines/color-fallback-baseline.json',
  noun: 'color',
  absent: '--color-* or --ds-*',
  prefix: COLOR_PREFIXES,
  reportUndefined: true,
  why:
    'Literal fallbacks that disagree with their own token (#268). Keyed on ' +
    '"<token> <literal>" rather than file and line, because a line number churns on ' +
    'every edit above it while the pair is the actual decision. The set may shrink ' +
    'and never grow; delete an entry when it is fixed and the check reports any that ' +
    'no longer disagree. `undefinedTokens` is a separate list with a different ' +
    'endpoint: those names have no definition at all, so the fallback IS the color, ' +
    'and the list should be driven to zero deliberately rather than shrinking as ' +
    'files are touched.',
});

export const { run, summary } = COLOR;

main(import.meta.url, COLOR.check, COLOR);
