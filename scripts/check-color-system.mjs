#!/usr/bin/env node
/**
 * `npm run check:color-system` — the color system keeps its promises, in every
 * plan and every mode.
 *
 * Builds each plan (`scripts/lib/color/plans/`) through the generator's own
 * pipeline and runs the checks in `scripts/lib/color/checks.mjs` over it:
 *
 *   contrast pairs      text, icons and edges on the grounds they are drawn on
 *   accent pairings     every accent family's tag text, bold fill and icon
 *   row-state grounds   meta text, links, focus and field edges on hovered, selected and overlay grounds
 *   collapsed states    base, hovered and pressed never share a value; the selection ladder stays ordered
 *   tint vs frame       status tints read as tints against the page and the sunken frame
 *   chart color vision  categorical series 1-4 stay apart under protan and deutan simulation
 *   teal vs Lagoon      the accent teal never reads as the brand
 *   plan parity         plans differ in primitive values only, never in a semantic mapping
 *
 * Light, dark and both increased-contrast modes; increased contrast raises the
 * bar to 7:1 for text and 4.5:1 for icons and borders. Each finding names the
 * check, the plan and the mode. Whether the committed files match the active
 * plan is `check:color-tokens`.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { buildAllPlans } from './lib/color/build.mjs';
import { colorFailures } from './lib/color/failures.mjs';
import { main } from './lib/findings.mjs';

export const REMEDY =
  '  -> A failure names a semantic token and the plan it failed in. Fix the plan\n' +
  '     (scripts/lib/color/plans/) when a primitive moved, or the mapping in\n' +
  '     scripts/lib/color/semantics.mjs when a role needs another step — in every\n' +
  '     plan at once, since plans may not map a token differently. Then run\n' +
  '     `npm run generate:color-tokens`.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export const run = ({ repoRoot = REPO_ROOT } = {}) => colorFailures({ root: repoRoot });

export const summary = ({ repoRoot = REPO_ROOT } = {}) => {
  const plans = buildAllPlans({ root: repoRoot });
  const tokens = Object.values(plans)[0].semantics.rows.length;
  return `${Object.keys(plans).length} plans x ${tokens} tokens x 4 modes pass every check, and map identically`;
};

main(import.meta.url, 'check:color-system', { run, summary, remedy: REMEDY });
