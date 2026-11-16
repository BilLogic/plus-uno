/**
 * Contract tests for #2598:
 * - Button and Modal docs each carry a `## Footer actions` section teaching all 8 r5 rules,
 *   DoDontPair cards built from live component instances, and the 9-row Hug or Fill table.
 * - FooterActions is imported from `@/components` (never `@/patterns`), and docs do not
 *   reference a `narrow` prop (narrow containers are measured automatically).
 * - Button docs carry an Anatomy story and updated Parts covering soft neutral fill,
 *   spacings (32 / 24 / spacious 48) and shouldFitContainer.
 * - ButtonGroup selected-state docs show and name the 1px --ds-border-selected border.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

const BUTTON_MDX = 'design-system/src/components/forms-and-inputs/Button/Button.mdx';
const MODAL_MDX = 'design-system/src/components/messaging/Modal/Modal.mdx';
const BUTTON_GROUP_MDX = 'design-system/src/components/forms-and-inputs/ButtonGroup/ButtonGroup.mdx';

const HUG_OR_FILL_SURFACES = [
  'Page header',
  'Card or section header',
  'Table toolbar',
  'Table row',
  'Popup inline confirm',
  'Empty state',
  'Banner and Flag',
  'Button group',
  'Inline with a field',
];

function extractSection(mdx, heading) {
  const marker = `
## ${heading}
`;
  const start = mdx.indexOf(marker);
  if (start === -1) return null;
  const after = mdx.slice(start + marker.length);
  const next = after.indexOf(`
## `);
  return next === -1 ? after : after.slice(0, next);
}

for (const [label, file] of [
  ['Button.mdx', BUTTON_MDX],
  ['Modal.mdx', MODAL_MDX],
]) {
  test(`${label} carries a Footer actions section with all 8 r5 rules, DoDontPair cards, and the Hug or Fill table`, () => {
    const mdx = read(file);
    assert.doesNotMatch(mdx, /from ['"]@\/patterns['"]/, `${label} must import FooterActions from @/components, not @/patterns`);
    const section = extractSection(mdx, 'Footer actions');
    assert.ok(section, `${label} is missing "## Footer actions"`);

    // Rule 1: 4 tracks, spacious (48), shouldFitContainer
    assert.match(section, /four equal tracks|4 equal tracks/i, `${label}: rule 1 (4 tracks)`);
    assert.match(section, /spacious/i, `${label}: rule 1 (spacious spacing)`);
    assert.match(section, /48/, `${label}: rule 1 (48 height)`);
    assert.match(section, /shouldFitContainer/, `${label}: rule 1 (shouldFitContainer)`);

    // Rule 2: 1 button -> right half (tracks 3–4), no hallucinated `narrow` prop
    assert.match(section, /right half/i, `${label}: rule 2 (right half)`);
    assert.doesNotMatch(section, /`narrow`/, `${label}: must not reference removed narrow prop`);

    // Rule 3: 2 buttons -> 50/50 split, soft neutral fill secondary left, primary right
    assert.match(section, /50\/50/, `${label}: rule 3 (50/50 split)`);
    assert.match(section, /--ds-background-neutral|soft neutral fill/i, `${label}: rule 3 (soft neutral fill)`);

    // Rule 4: 3 buttons -> tracks 2, 3 and 4; rightmost primary
    assert.match(section, /tracks? [`']?2[`']?,\s*[`']?3[`']?\s*(?:and|–|-)\s*[`']?4[`']?|tracks 2–4/i, `${label}: rule 4 (tracks 2–4)`);

    // Rule 5: Leading text/subtle button hugs left content edge; filled buttons take tracks 3 and 4
    assert.match(section, /hugs the left/i, `${label}: rule 5 (hugs left edge)`);

    // Rule 6: Destructive dialogs -> danger primary, safer alternative secondary, 50/50
    assert.match(section, /danger/i, `${label}: rule 6 (destructive danger primary)`);
    assert.match(section, /safer alternative/i, `${label}: rule 6 (safer alternative secondary)`);

    // Rule 7: No Cancel in footers (× dismisses); Cancel only in popups (compact, subtle, right-aligned)
    assert.match(section, /never.*Cancel|no Cancel/i, `${label}: rule 7 (no Cancel in footers)`);
    assert.match(section, /popup/i, `${label}: rule 7 (Cancel only in popups)`);

    // Rule 8: Steps -> Back and Next split
    assert.match(section, /Back.*Next/s, `${label}: rule 8 (Back and Next split)`);

    // DoDontPair cards built from real components
    assert.match(section, /<DoDontPair\b/, `${label}: must include DoDontPair cards`);
    assert.match(section, /<FooterActions\b|<Modal\b/, `${label}: DoDontPair cards use real FooterActions/Modal instances`);

    // Hug or Fill rule & 9-row table
    assert.match(section, /Buttons fill in only two places|fill only in the footer slot/i, `${label}: Hug or Fill rule`);
    for (const surface of HUG_OR_FILL_SURFACES) {
      assert.ok(section.includes(surface), `${label}: Hug or Fill table missing "${surface}"`);
    }
    assert.match(section, /<DocsLink\b/, `${label}: Hug or Fill table links to Storybook pages`);
  });
}

test('Button.mdx includes Anatomy and updated Parts for soft neutral fill, heights and shouldFitContainer', () => {
  const mdx = read(BUTTON_MDX);
  assert.match(mdx, /ButtonStories\.Anatomy/, 'Button.mdx renders ButtonStories.Anatomy');
  const parts = extractSection(mdx, 'Parts');
  assert.ok(parts, 'Button.mdx has ## Parts');
  assert.match(parts, /--ds-background-neutral/, 'Parts names --ds-background-neutral');
  assert.match(parts, /shouldFitContainer/, 'Parts names shouldFitContainer');
  assert.match(parts, /spacious/, 'Parts names spacious spacing');
  assert.match(parts, /48/, 'Parts names 48 height');
});

test('ButtonGroup.mdx selected-state docs highlight the 1px --ds-border-selected border and hugging items', () => {
  const mdx = read(BUTTON_GROUP_MDX);
  assert.match(mdx, /--ds-border-selected/, 'ButtonGroup.mdx names --ds-border-selected');
  assert.match(mdx, /1px.*border|border.*1px/i, 'ButtonGroup.mdx names the 1px border in selected state');
  assert.match(mdx, /hug/i, 'ButtonGroup.mdx teaches that items hug their labels');
});
