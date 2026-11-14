/**
 * Foundations › Expression › Sound's tables as plain rows, read from the generated sound
 * spec (`@/sound/spec.generated`), the motion registry's `sound` cells and the
 * always-silent list. Nothing here holds a value of its own: the spec is
 * drift-checked by `check:sound-spec`, the registry and the silent list by
 * `check:sound-registry`, so a table can only be as stale as its source.
 */
import { scoreFor, scoreLength } from '@/sound/score';
import { SOUND_MOMENTS, SOUND_SPEC } from '@/sound/spec.generated';
import { SOUND_SILENT } from '../../../../scripts/lib/tokens/sound-silence.mjs';

const tens = (seconds) => Math.round(seconds * 100) * 10;

/**
 * The sound sheet: one row per token, in plan order.
 * @returns {{name: string, token: string, family: string, notes: string, level: string, db: number, lengthMs: number, ai: boolean}[]}
 */
export function soundSheetOf(spec = SOUND_SPEC) {
  return Object.entries(spec.tokens).map(([name, t]) => ({
    name,
    token: `sound.${name}`,
    family: t.family,
    notes: t.summary,
    level: t.level,
    db: spec.levels[t.level],
    lengthMs: tens(scoreLength(scoreFor(name, spec))),
    ai: Boolean(t.ai),
  }));
}

/** Token names grouped by family, families in first-seen order. */
export function soundFamiliesOf(spec = SOUND_SPEC) {
  const families = [];
  for (const [name, t] of Object.entries(spec.tokens)) {
    let family = families.find((f) => f.family === t.family);
    if (!family) families.push((family = { family: t.family, names: [] }));
    family.names.push(name);
  }
  return families;
}

/** Every registry event that plays a sound, in registry order. */
export function soundCellsOf() {
  return SOUND_MOMENTS.map(({ spring, ...cell }) => cell);
}

/** The always-silent list grouped by its reason; a row reads `Row` or `Row · event`. */
export function silentGroupsOf(list = SOUND_SILENT) {
  const groups = [];
  for (const { row, event, why } of list) {
    let group = groups.find((g) => g.why === why);
    if (!group) groups.push((group = { why, rows: [] }));
    group.rows.push(event ? `${row} · ${event}` : row);
  }
  return groups;
}
