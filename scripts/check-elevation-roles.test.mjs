/**
 * The surface ROLES and the elevation mapping table must name the same level.
 *
 * WHY THIS EXISTS. `design-system/guidelines/figma/token-mapping.md` has carried
 * a five-row table for a long time — Light/1 subtle, Light/2 cards and
 * dropdowns, Light/3 popovers and toasts, Light/4 modals, Light/5 dialogs — and
 * the components follow it: `PatternCard.scss` sets `--elevation-light-2` and
 * cites the row in the rule.
 *
 * The role layer added for #268 then shipped `--surface-raised-shadow:
 * var(--elevation-light-1)`. A token whose entire purpose is to answer "which
 * shadow does a card get?" answered it differently from the document that had
 * already answered it, in the same repository, and nothing noticed — because
 * the two live in different file types and no check read both.
 *
 * WHAT IS ASSERTED. The level in the table row for a role is the level the role
 * token points at. Both sides are parsed from source, so this fails whichever
 * side moves: re-pointing the token fails it, and so does editing the table.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. WHETHER THE TABLE IS RIGHT. If Light/2 is the wrong shadow for a card,
 *     this passes happily. It checks agreement, not judgement.
 *  2. COMPONENTS THAT USE A LEVEL DIRECTLY. `PatternModal.scss` names
 *     `--elevation-light-4` and does not go through a role — correctly, since
 *     no `modal` role exists. Auditing every `box-shadow` against the table is
 *     a different check with a much larger corpus.
 *  3. ROLES WITH NO ROW. `--surface-container` carries no shadow and appears in
 *     no elevation row; it is simply not covered here.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ELEVATION = path.join(REPO_ROOT, 'design-system/src/tokens/_elevation.scss');
const MAPPING = path.join(REPO_ROOT, 'design-system/guidelines/figma/token-mapping.md');

/**
 * Which table row each shadow role answers.
 *
 * The role is matched to a row by the row's own words rather than by position,
 * so re-ordering the table is not a failure and re-labelling it is.
 */
const ROLES = [
  { token: '--surface-raised-shadow', rowMatches: /cards/i },
  { token: '--surface-overlay-shadow', rowMatches: /popovers/i },
];

/** `Elevation Light/2 (cards, dropdowns) | var(--elevation-light-2)` → level per row. */
export function mappingLevels(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    const match = /^\|\s*Elevation Light\/(\d)\s*\(([^)]*)\)\s*\|\s*`var\(--elevation-light-(\d)\)`/.exec(line.trim());
    if (!match) continue;
    // The row states the level twice — once as the Figma style, once as the
    // CSS token. They disagreeing would be its own bug, so it is asserted here
    // rather than silently preferring one.
    assert.equal(match[1], match[3], `token-mapping.md row "${line.trim()}" names two different levels`);
    rows.push({ level: Number(match[1]), uses: match[2] });
  }
  return rows;
}

/** `--surface-raised-shadow: var(--elevation-light-2);` → 2 */
export function roleLevel(scss, token) {
  const match = new RegExp(`^\\s*${token}:\\s*var\\(--elevation-light-(\\d)\\);`, 'm').exec(scss);
  return match ? Number(match[1]) : null;
}

const scss = fs.readFileSync(ELEVATION, 'utf8');
const rows = mappingLevels(fs.readFileSync(MAPPING, 'utf8'));

test('the mapping table is still parseable', () => {
  // A table that stopped matching would make every assertion below vacuous —
  // the shape of green that means nothing was checked at all.
  assert.equal(rows.length, 5, `expected 5 elevation rows in token-mapping.md, parsed ${rows.length}`);
});

for (const role of ROLES) {
  test(`${role.token} points at the level the mapping table assigns`, () => {
    const row = rows.find((r) => role.rowMatches.test(r.uses));
    assert.ok(row, `no row in token-mapping.md matches ${role.rowMatches} — the table was relabelled`);

    const actual = roleLevel(scss, role.token);
    assert.ok(actual !== null, `${role.token} is not a var(--elevation-light-N) in _elevation.scss`);
    assert.equal(
      actual,
      row.level,
      `${role.token} points at --elevation-light-${actual}, but token-mapping.md assigns ` +
        `Light/${row.level} to "${row.uses}". One of the two moved; both are source, so pick which.`,
    );
  });
}

test('the row that mentions modals is NOT claimed by a role', () => {
  // The overlay role deliberately stops short of modals: the table separates
  // popovers/toasts from modals from dialogs, and `PatternModal.scss` names
  // Light/4 directly. If someone later points `--surface-overlay-shadow` at
  // the modal level, that collapses a distinction the system has shipped, and
  // it should be a decision rather than an edit that slips through.
  const modalRow = rows.find((r) => /modals/i.test(r.uses));
  assert.ok(modalRow, 'token-mapping.md no longer has a modal row');
  for (const role of ROLES) {
    assert.notEqual(
      roleLevel(scss, role.token),
      modalRow.level,
      `${role.token} now points at the modal level (Light/${modalRow.level}). ` +
        'Collapsing overlay and modal is a #268 decision, not a re-point.',
    );
  }
});
