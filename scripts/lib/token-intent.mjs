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
 *    `toPlusTerms` rewrites them into PLUS components before they ship.
 *
 * A token outside both plans (the legacy color, type and spacing groups) has
 * no source, so it has no intent: the views leave the field out, and the
 * check reports those groups as not planned rather than failing them.
 */

import { buildPlan } from './color/build.mjs';
import { dsName } from './color/emit.mjs';
import { ACTIVE_PLAN } from './color/plans.mjs';
import { TOKEN_LADDER } from './tokens/plan.mjs';

/** Reference wording -> PLUS wording, applied in order (the more specific phrase first). */
const PLUS_TERMS = [
  [/\(e\.g\. semantic badges, status pills, callout chips\)/g, '(e.g. a StatusTag or CountTag)'],
  [/\(e\.g\. status pills, callout chips\)/g, '(e.g. a StatusTag)'],
  [/lozenges and badges/g, 'status tags and count tags'],
  [/lozenges/g, 'status tags'],
  [/such as Jira cards in columns/g, 'such as cards in board columns'],
  [/such as Jira cards on a Kanban board/g, 'such as cards on a board'],
  [/selected Editor blocks/g, 'selected blocks in a RichTextEditor'],
  [/deletion of Editor block elements/g, 'deleting a block in a RichTextEditor'],
  [/close buttons on toasts, chips on bold fills/g, 'close buttons on flags, tags on bold fills'],
  [/Subject tag and chip fill/g, 'Subject tag fill'],
  [/subject chip/g, 'subject tag'],
  [/a filled badge/g, 'a filled tag'],
  [/modals, dialogs, dropdown menus/g, 'modals, dropdown menus'],
  [/modal dialogs/g, 'a Modal'],
  [/menus, popovers, tooltips/g, 'menus, popups, tooltips'],
  [/The Surface pattern's 1px edge/g, "A container's 1px edge"],
  [/visualisation/g, 'visualization'],
  [/'to-do' statues/g, "'to-do' statuses"],
  [/sit on top of they UI/g, 'sit on top of the UI'],
  [/used in error handing/g, 'used in error handling'],
  [/success section messaged/g, 'success section messages'],
  [/such in error/g, 'such as in error'],
  [/^For backgrounds/, 'Backgrounds'],
  [/^Vibrant for backgrounds/, 'Vibrant backgrounds'],
  [/^Use to (\w)/, (_, c) => c.toUpperCase()],
  // A dotted reference token name, written as the CSS name an agent types.
  [/\b(?:color|elevation)\.[a-z]+(?:\.[a-z0-9]+)*/g, (name) => dsName(name)],
];

/** Rewrite one reference description into PLUS words. */
export function toPlusTerms(text) {
  return PLUS_TERMS.reduce((out, [from, to]) => out.replace(from, to), text);
}

/** `--ds-*` name -> intent, for the active color plan's semantic, shadow and opacity tokens. */
export function colorIntents() {
  const { semantics } = buildPlan(ACTIVE_PLAN);
  const named = [...semantics.rows, ...semantics.shadows].map((r) => [dsName(r.name), r.use]);
  const opacity = semantics.opacity.map((o) => [`--ds-${o.name.replaceAll('.', '-')}`, o.use]);
  return new Map([...named, ...opacity].map(([name, use]) => [name, toPlusTerms(use ?? '').trim()]));
}

/** Every planned token name -> its intent (empty when the plan row has no `use` yet). Ladder first. */
export function plannedIntents() {
  const map = new Map(TOKEN_LADDER.map((row) => [row.new, row.use ?? '']));
  for (const [name, intent] of colorIntents()) if (!map.has(name)) map.set(name, intent);
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
