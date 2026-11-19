/**
 * Token intent: the one line saying where a token goes, for every token a plan
 * defines. The token agent views (`tokens.json`, `tokens.md`) carry it and
 * `check:token-intent` holds it complete.
 *
 * Two plans define tokens, so two sources feed it:
 *  - the ADR-038 ladder (`tokens/plan.mjs`): each row's `use`;
 *  - the ADR-035 color plan: each `--ds-*` semantic, shadow and opacity
 *    token's `use` from the semantic layer, which starts from the vendored
 *    reference descriptions. Those name another company's products, so
 *    `toPlusTerms` rewrites them into PLUS components before they ship, from the
 *    phrases the retirement list holds.
 *
 * A token outside both plans (the legacy color, type and spacing groups) has
 * no source, so it has no intent: the views leave the field out, and the
 * check reports those groups as not planned rather than failing them.
 */

import { buildPlan } from './color/build.mjs';
import { REPO_ROOT } from './corpus.mjs';
import { dsName } from './color/emit.mjs';
import { ACTIVE_PLAN } from './color/plans.mjs';
import { loadRetirement } from './retirement.mjs';
import { MOTION_SEMANTICS, TOKEN_LADDER } from './tokens/plan.mjs';

/**
 * Reference wording -> PLUS wording: the retirement list's `phrase:token-intent`
 * spelling rows, applied in order (the more specific phrase first).
 */
const PHRASES = loadRetirement(REPO_ROOT)
  .ofKind('spelling')
  .filter((row) => row.rule === 'phrase:token-intent')
  .map((row) => [new RegExp(row.pattern, 'g'), row.use[0]]);

/** What the rewrite does to a description whatever its words: a sentence starts capitalized, a dotted name becomes its CSS name. */
const SHAPE_TERMS = [
  [/^Use to (\w)/, (_, c) => c.toUpperCase()],
  // A dotted reference token name, written as the CSS name an agent types.
  [/\b(?:color|elevation)\.[a-z]+(?:\.[a-z0-9]+)*/g, (name) => dsName(name)],
];

/** Rewrite one reference description into PLUS words. */
export function toPlusTerms(text) {
  const reworded = PHRASES.reduce((out, [from, to]) => out.replace(from, () => to), text);
  return SHAPE_TERMS.reduce((out, [from, to]) => out.replace(from, to), reworded);
}

/** `--ds-*` name -> intent, for the active color plan's semantic, shadow and opacity tokens. */
export function colorIntents() {
  const { semantics } = buildPlan(ACTIVE_PLAN);
  const named = [...semantics.rows, ...semantics.shadows].map((r) => [dsName(r.name), r.use]);
  const opacity = semantics.opacity.map((o) => [`--ds-${o.name.replaceAll('.', '-')}`, o.use]);
  return new Map([...named, ...opacity].map(([name, use]) => [name, toPlusTerms(use ?? '').trim()]));
}

/** `--ds-motion-*` name -> intent, for each motion semantic and the settle time beside it (ADR-041). */
export function motionIntents() {
  const out = [];
  for (const { name, use } of MOTION_SEMANTICS) {
    const css = `--ds-motion-${name.replaceAll('.', '-')}`;
    out.push([css, use], [`${css}-duration`, `The settle time of ${css}. ${use}`]);
  }
  out.push(['--ds-motion-linear', 'Time and position that follow the work or the hand one to one: a progress fill, a spinner turn, a scroll-linked fade. No spring.']);
  return out;
}

/** Every planned token name -> its intent (empty when the plan row has no `use` yet). Ladder first. */
export function plannedIntents() {
  const map = new Map(TOKEN_LADDER.map((row) => [row.new, row.use ?? '']));
  for (const [name, intent] of colorIntents()) if (!map.has(name)) map.set(name, intent);
  for (const [name, intent] of motionIntents()) if (!map.has(name)) map.set(name, intent);
  return map;
}

/**
 * Hold a token manifest to the plans.
 *
 * @param {{tokens: {name: string, tier: string, group: string, intent?: string|null}[]}} manifest
 * @param {Map<string, string>} planned  from `plannedIntents`
 * @returns {{missing: string[], primitivesWithIntent: string[], notPlanned: Record<string, number>, withIntent: number}}
 */
export function auditIntent(manifest, planned) {
  const missing = [];
  const primitivesWithIntent = [];
  const notPlanned = {};
  let withIntent = 0;
  for (const t of manifest.tokens) {
    if (t.tier === 'primitive') {
      if ('intent' in t) primitivesWithIntent.push(t.name);
      continue;
    }
    if (planned.has(t.name)) {
      if (typeof t.intent === 'string' && t.intent.trim()) withIntent += 1;
      else missing.push(t.name);
    } else {
      notPlanned[t.group] = (notPlanned[t.group] ?? 0) + 1;
    }
  }
  return { missing, primitivesWithIntent, notPlanned, withIntent };
}
