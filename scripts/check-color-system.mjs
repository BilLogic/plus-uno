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

import { buildAllPlans } from './lib/color/build.mjs';
import { colorChecks, planParity } from './lib/color/checks.mjs';
import { main } from './lib/findings.mjs';

const REMEDY =
  '  -> A failure names a semantic token and the plan it failed in. Fix the plan\n' +
  '     (scripts/lib/color/plans/) when a primitive moved, or the mapping in\n' +
  '     scripts/lib/color/semantics.mjs when a role needs another step — in every\n' +
  '     plan at once, since plans may not map a token differently. Then run\n' +
  '     `npm run generate:color-tokens`.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function colorFailures() {
  const plans = buildAllPlans();
  const found = [];
  for (const [key, { semantics }] of Object.entries(plans)) {
    for (const [check, failures] of Object.entries(colorChecks(semantics))) {
      for (const failure of failures) found.push({ message: `${check}, Plan ${key}: ${failure}` });
    }
  }
  const semantics = Object.fromEntries(Object.entries(plans).map(([key, p]) => [key, p.semantics]));
  for (const failure of planParity(semantics)) found.push({ message: `plan parity: ${failure}` });
  return found;
}

export const run = () => colorFailures();

export const summary = () => {
  const plans = buildAllPlans();
  const tokens = Object.values(plans)[0].semantics.rows.length;
  return `${Object.keys(plans).length} plans x ${tokens} tokens x 4 modes pass every check, and map identically`;
};

main(import.meta.url, 'check:color-system', { run, summary, remedy: REMEDY });
