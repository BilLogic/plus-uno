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

/**
 * The registry row named `name`, or null. A template page and a component can
 * share a name (Panel, Popup, Modal), so `tier` picks one; without it the
 * component's row wins, then any row of that name.
 */
export function motionRowOf(name, registry = MOTION_REGISTRY, tier = null) {
  if (tier) return registry.find((r) => r.name === name && r.tier === tier) ?? null;
  return registry.find((r) => r.name === name && r.tier === 'component') ?? registry.find((r) => r.name === name) ?? null;
}

/** The order the Library groups rows in: the page-level moves first, then what they hold. */
export const MOTION_TIERS = ['template', 'pattern', 'component'];

/** The CSS custom property a semantic token name is read through: `spatial.fast` → `--ds-motion-spatial-fast`. */
export function motionVarOf(token) {
  return `--ds-motion-${token.replace(/\./g, '-')}`;
}

/**
 * A row's events as plain rows, in the order the row lists them:
 * `{ event, transition, tokens, note, sound }`. `sound` is the event's sound
 * cell with its defaults filled (`{ token, at: 'land', when: '' }`), or null.
 */
export function motionEventsOf(row) {
  return Object.entries(row.events).map(([event, e]) => ({
    event,
    transition: e.transition ?? '',
    tokens: [e.spatial, e.appearance].filter(Boolean),
    note: e.note ?? '',
    sound: e.sound ? { token: e.sound.token, at: e.sound.at ?? 'land', when: e.sound.when ?? '' } : null,
  }));
}

const code = (s) => `\`${s}\``;

/** A sound token's full name: `notify` → `sound.notify`. */
export const soundNameOf = (token) => `sound.${token}`;

/** A sound cell as one line of Markdown: `` `sound.notify` on land: outside a session ``; empty when silent. */
export function soundTextOf(sound) {
  if (!sound) return '';
  return `${code(soundNameOf(sound.token))} on ${sound.at}${sound.when ? `: ${sound.when}` : ''}`;
}

/** The one-line summary for the agent file's header facts: `enter spatial.fast + appearance.fast · exit …`. */
export function motionLineOf(row) {
  const parts = motionEventsOf(row).map((e) => `${e.event} ${e.tokens.map(code).join(' + ')}${e.sound ? `, sound ${code(soundNameOf(e.sound.token))}` : ''}`);
  return `**Motion:** ${parts.join(' · ')}. Read the tokens through ${code('--ds-motion-*')}; see Foundations › Expression › Motion.\n\n`;
}

/**
 * The `## Motion` section: what each event uses and does. A row with a sound
 * cell gains a Sound column; a silent row's table keeps four.
 */
export function motionSectionOf(row) {
  const events = motionEventsOf(row);
  const plays = events.some((e) => e.sound);
  let d = `## Motion\n\n`;
  d += `${row.name} reads these motion tokens and no literal duration or curve.\n\n`;
  d += plays
    ? `| Event | Transition | Tokens | What it does | Sound |\n| --- | --- | --- | --- | --- |\n`
    : `| Event | Transition | Tokens | What it does |\n| --- | --- | --- | --- |\n`;
  for (const e of events) {
    d += `| ${e.event} | ${e.transition} | ${e.tokens.map((t) => code(motionVarOf(t))).join(' · ')} | ${e.note} |${plays ? ` ${soundTextOf(e.sound)} |` : ''}\n`;
  }
  return `${d}\n`;
}


/**
 * Every registry row as plain data for the Motion · Library index, grouped by
 * tier (`MOTION_TIERS`) and sorted by name within a tier: `{ name, tier, events }`.
 * A token a row names that the plan does not declare throws, so the index can
 * never show a custom property nothing sets; so does a tier outside the three.
 */
export function motionLibraryOf(registry = MOTION_REGISTRY) {
  const valid = new Set([...MOTION_SEMANTICS.map((s) => s.name), 'linear']);
  for (const row of registry) {
    if (!MOTION_TIERS.includes(row.tier)) throw new Error(`motion registry row "${row.name}" has tier "${row.tier}", which is not one of ${MOTION_TIERS.join(', ')}`);
  }
  const rank = (row) => MOTION_TIERS.indexOf(row.tier);
  return [...registry]
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
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

/** The Library as one Markdown table: one line per event, grouped by row, with its sound, for the agent file. */
export function motionLibraryTableOf(registry = MOTION_REGISTRY) {
  let d = `| Name | Tier | Event | Transition | Tokens | Sound |\n| --- | --- | --- | --- | --- | --- |\n`;
  for (const r of motionLibraryOf(registry)) {
    for (const e of r.events) {
      d += `| ${r.name} | ${r.tier} | ${e.event} | ${e.transition} | ${e.tokens.map((t) => code(motionVarOf(t))).join(' · ')} | ${soundTextOf(e.sound)} |\n`;
    }
  }
  return d;
}

