/**
 * Motion docs from the registry: the Motion section of a component's Usage and
 * the motion line of its agent file, both rendered from one registry row
 * (`motion-registry.mjs`), so a row edit is the only edit and the drift check
 * (`check:component-docs`) fails when either text is stale.
 *
 * Per row and generic: nothing here names a component. The agent file
 * (`scripts/lib/component-render.mjs`) writes `motionLineOf` and
 * `motionSectionOf`; the Storybook Usage tab reads `motionEventsOf` through
 * `design-system/src/storybook-docs/motion-section.jsx`.
 */

import { MOTION_REGISTRY } from './motion-registry.mjs';
import { MOTION_SEMANTICS } from './plan.mjs';

/** The registry row named `name`, or null. */
export function motionRowOf(name, registry = MOTION_REGISTRY) {
  return registry.find((r) => r.name === name) ?? null;
}

/** The CSS custom property a semantic token name is read through: `spatial.fast` → `--ds-motion-spatial-fast`. */
export function motionVarOf(token) {
  return `--ds-motion-${token.replace(/\./g, '-')}`;
}

/** A row's events as plain rows, in the order the row lists them: `{ event, transition, tokens, note }`. */
export function motionEventsOf(row) {
  return Object.entries(row.events).map(([event, e]) => ({
    event,
    transition: e.transition ?? '',
    tokens: [e.spatial, e.appearance].filter(Boolean),
    note: e.note ?? '',
  }));
}

const code = (s) => `\`${s}\``;

/** The one-line summary for the agent file's header facts: `enter spatial.fast + appearance.fast · exit …`. */
export function motionLineOf(row) {
  const parts = motionEventsOf(row).map((e) => `${e.event} ${e.tokens.map(code).join(' + ')}`);
  return `**Motion:** ${parts.join(' · ')}. Read the tokens through ${code('--ds-motion-*')}; see Foundations · Motion.\n\n`;
}

/** The `## Motion` section: what each event uses and does. */
export function motionSectionOf(row) {
  const events = motionEventsOf(row);
  let d = `## Motion\n\n`;
  d += `${row.name} reads these motion tokens and no literal duration or curve.\n\n`;
  d += `| Event | Transition | Tokens | What it does |\n| --- | --- | --- | --- |\n`;
  for (const e of events) {
    d += `| ${e.event} | ${e.transition} | ${e.tokens.map((t) => code(motionVarOf(t))).join(' · ')} | ${e.note} |\n`;
  }
  return `${d}\n`;
}


/**
 * Every registry row as plain data for the Motion · Library index, sorted by
 * name: `{ name, tier, events }`. A token a row names that the plan does not
 * declare throws, so the index can never show a custom property nothing sets.
 */
export function motionLibraryOf(registry = MOTION_REGISTRY) {
  const valid = new Set([...MOTION_SEMANTICS.map((s) => s.name), 'linear']);
  return [...registry]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => {
      const events = motionEventsOf(row);
      for (const e of events) {
        for (const t of e.tokens) {
          if (!valid.has(t)) throw new Error(`motion registry row "${row.name}" event "${e.event}" names "${t}", which is not a motion token`);
        }
      }
      return { name: row.name, tier: row.tier, events };
    });
}

/** The Library as one Markdown table: one line per event, grouped by row, for the agent file. */
export function motionLibraryTableOf(registry = MOTION_REGISTRY) {
  let d = `| Name | Tier | Event | Transition | Tokens |\n| --- | --- | --- | --- | --- |\n`;
  for (const r of motionLibraryOf(registry)) {
    for (const e of r.events) {
      d += `| ${r.name} | ${r.tier} | ${e.event} | ${e.transition} | ${e.tokens.map((t) => code(motionVarOf(t))).join(' · ')} |\n`;
    }
  }
  return d;
}

