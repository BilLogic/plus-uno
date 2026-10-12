// The vendored Storybook id, pinned against ids the live Storybook's
// index.json carries (plus-uno.netlify.app/storybook/index.json, read
// 2026-10-11, where all 68 registry components' docs ids resolved).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { storybookId } from './storybook-id.mjs';

test('a docs entry id is the title and the docs name, each sanitized the way Storybook does', () => {
  const live = [
    ['Components/Actions/Button', 'Docs', 'components-actions-button--docs'],
    [
      'Components/Status and loading/Status, Count & Tag/Status/Deprecated/Badge',
      'Docs',
      'components-status-and-loading-status-count-tag-status-deprecated-badge--docs',
    ],
    ['Specs/Toolkit/Post-Session/Elements/Option Chip', 'Toolkit Docs — OptionChip', 'specs-toolkit-post-session-elements-option-chip--toolkit-docs-optionchip'],
    ['Components/Forms and inputs/Label & caption', 'Docs', 'components-forms-and-inputs-label-caption--docs'],
    ['Components/Forms and inputs/Date & time picker', 'Docs', 'components-forms-and-inputs-date-time-picker--docs'],
  ];
  for (const [title, name, id] of live) assert.equal(storybookId(title, name), id);
});

test('a title that sanitizes to nothing is refused, as Storybook refuses it', () => {
  assert.throws(() => storybookId('///', 'Docs'), /kind/);
});
