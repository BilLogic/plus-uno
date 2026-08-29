/**
 * A Figma variable's SCOPES are what the picker offers it for, and nothing in
 * this repository was watching them.
 *
 * WHAT THE SWEEP FOUND, 2026-08-29. The ten accent groups carry the same five
 * roles, and eight of them scope those roles the same way:
 *
 *   base           EFFECT_COLOR, FRAME_FILL, SHAPE_FILL, STROKE_COLOR   not text
 *   (Text)         TEXT_FILL
 *   Container      FRAME_FILL, SHAPE_FILL, STROKE_COLOR                 not text
 *   On X Container ALL_FILLS, STROKE_COLOR
 *   On X           ALL_SCOPES
 *
 * Five variables sat outside it, and every one was offerable as a TEXT_FILL its
 * contrast cannot carry:
 *
 *   _Primary/Primary              ALL_SCOPES  — 4.31:1 and 4.08:1 on the two
 *                                               darkest surface steps
 *   _Relationship/Relationship    ALL_SCOPES
 *   _Warning/Warning Container    ALL_FILLS   — #ffe17a is 1.5:1 on white
 *   _Advocacy/Advocacy Container  ALL_FILLS   — the same shape
 *   _Warning/Warning (Text)       ALL_SCOPES  — the INVERSE error: the one
 *                                               warning value that passes as
 *                                               text was also offered as a ground
 *
 * That is the same defect as the 108 CSS declarations painting a foreground from
 * an intent base (#368), reached from the other end: a designer picking
 * `_Primary/Primary` for a label in Figma is doing exactly what the stylesheets
 * do, and the file was inviting it.
 *
 * WHY THE CONVENTION IS DERIVED AND NOT DECLARED. Hard-coding the five scope
 * sets would make this check an opinion. Reading the MAJORITY across the ten
 * groups makes it a measurement of what the library already does — so the
 * finding is "this one disagrees with its peers", which is checkable, rather
 * than "this one disagrees with me".
 */

/** `_Warning/Warning (Text)` -> `{group: 'Warning', role: 'text'}` */
export function classify(figmaName) {
  const parts = figmaName.split('/');
  if (parts.length !== 2) return null;
  const group = parts[0].replace(/^_/, '');
  if (group === 'Proposal') return null; // candidates are not the library yet
  const leaf = parts[1].trim();

  // The stray neutral filed under _Advocacy is not an Advocacy role.
  if (!leaf.toLowerCase().includes(group.toLowerCase())) return null;

  if (/\(Text\)$/.test(leaf)) return { group, role: 'text' };
  if (/^On .* Container$/.test(leaf)) return { group, role: 'on-container' };
  if (/^On /.test(leaf)) return { group, role: 'on' };
  if (/ Container$/.test(leaf)) return { group, role: 'container' };
  if (/ Icon$/.test(leaf)) return { group, role: 'icon' };
  if (/ Border$/.test(leaf)) return { group, role: 'border' };
  if (/^Inverse /.test(leaf)) return { group, role: 'inverse' };
  return { group, role: 'base' };
}

/**
 * The scope set each role carries in most groups, and how many groups agree.
 * A role held by fewer than `quorum` groups has no convention to enforce.
 */
export function convention(scopes, quorum = 4) {
  const byRole = new Map();
  for (const [key, value] of Object.entries(scopes)) {
    const name = key.split('::')[1] ?? key;
    const seat = classify(name);
    if (!seat) continue;
    if (!byRole.has(seat.role)) byRole.set(seat.role, new Map());
    const tally = byRole.get(seat.role);
    tally.set(value, (tally.get(value) ?? 0) + 1);
  }

  const out = new Map();
  for (const [role, tally] of byRole) {
    const total = [...tally.values()].reduce((a, b) => a + b, 0);
    if (total < quorum) continue;
    const [best, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    // A role whose groups do not actually agree has no majority worth calling one.
    if (count * 2 <= total) continue;
    out.set(role, { scopes: best, agreeing: count, of: total });
  }
  return out;
}

/** Roles that must never be offered as a text fill, and why. */
export const NEVER_TEXT = {
  base: 'the base is a GROUND — every group has a (Text) variable for text',
  container: 'a container is a ground; its On X Container partner is the text on it',
  icon: 'an icon is held to 3:1, text to 4.5:1 — offering it as text hides which bar applied',
  border: 'a border is held to 3:1, text to 4.5:1',
};

const OFFERS_TEXT = (value) =>
  value.split(',').some((s) => s === 'TEXT_FILL' || s === 'ALL_FILLS' || s === 'ALL_SCOPES');

/**
 * @returns {string[]} A line per variable that disagrees with its peers, or that
 *   offers itself for text in a role that cannot carry it.
 */
export function failures(scopes, conventions) {
  const found = [];
  for (const [key, value] of Object.entries(scopes)) {
    const name = key.split('::')[1] ?? key;
    const seat = classify(name);
    if (!seat) continue;

    if (NEVER_TEXT[seat.role] && OFFERS_TEXT(value)) {
      found.push(
        `${name}: scoped ${value}, which offers it as a TEXT_FILL — ${NEVER_TEXT[seat.role]}.`,
      );
      continue;
    }

    const rule = conventions.get(seat.role);
    if (rule && rule.scopes !== value) {
      found.push(
        `${name}: scoped ${value}, where ${rule.agreeing} of ${rule.of} groups scope their ` +
          `${seat.role} as ${rule.scopes}.`,
      );
    }
  }
  return found.sort();
}
