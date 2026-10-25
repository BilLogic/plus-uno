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
 *   legacy map          every legacy color name used in design-system/ and prototypes/ has a
 *                       migration-map row, every alias in it names a token the generator emits,
 *                       and partners (a foreground and its grounds) are aliased together, to a
 *                       pair that passes 4.5:1 in light, or not at all
 *
 * Light, dark and both increased-contrast modes; increased contrast raises the
 * bar to 7:1 for text and 4.5:1 for icons and borders. Each finding names the
 * check, the plan and the mode. Whether the committed files match the active
 * plan is `check:color-tokens`.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { buildAllPlans, buildPlan } from './lib/color/build.mjs';
import { ACTIVE_PLAN } from './lib/color/plans.mjs';
import { colorFailures } from './lib/color/failures.mjs';
import { composite } from './lib/color/checks.mjs';
import { ALIASES, legacyCoverage, missingTargets, pairFailures } from './lib/color/legacy-map.mjs';
import { contrast } from './lib/color/oklch.mjs';
import { main } from './lib/findings.mjs';

export const REMEDY =
  '  -> A failure names a semantic token and the plan it failed in. Fix the plan\n' +
  '     (scripts/lib/color/plans/) when a primitive moved, or the mapping in\n' +
  '     scripts/lib/color/semantics.mjs when a role needs another step — in every\n' +
  '     plan at once, since plans may not map a token differently. Then run\n' +
  '     `npm run generate:color-tokens`. A legacy-map failure names a legacy\n' +
  '     color name: add its row to scripts/lib/color/legacy-map.mjs (the\n' +
  '     proposal\'s migration map) and regenerate.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const findings = colorFailures({ root: repoRoot });
  for (const [name, uses] of legacyCoverage({ root: repoRoot }).unmapped) {
    findings.push({ message: `legacy map: ${name} (${uses} use${uses === 1 ? '' : 's'}) has no migration-map row` });
  }
  const { semantics } = buildPlan(ACTIVE_PLAN, { root: repoRoot });
  const missing = missingTargets(semantics);
  for (const failure of missing) findings.push({ message: `legacy map: ${failure}` });
  if (!missing.length) {
    const names = legacyCoverage({ root: repoRoot }).used.keys();
    for (const failure of pairFailures(names, semantics, contrast, composite)) findings.push({ message: `legacy map: ${failure}` });
  }
  return findings;
}

export const summary = ({ repoRoot = REPO_ROOT } = {}) => {
  const plans = buildAllPlans({ root: repoRoot });
  const tokens = Object.values(plans)[0].semantics.rows.length;
  const { used } = legacyCoverage({ root: repoRoot });
  return (
    `${Object.keys(plans).length} plans x ${tokens} tokens x 4 modes pass every check, and map identically; ` +
    `${used.size} legacy color names in use all have a migration-map row, ${Object.keys(ALIASES).length} aliased`
  );
};

main(import.meta.url, 'check:color-system', { run, summary, remedy: REMEDY });
