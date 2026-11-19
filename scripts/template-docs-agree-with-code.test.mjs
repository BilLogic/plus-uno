/**
 * The template pages state what the template code does. Each test holds a
 * rule the code enforces to the pages that teach it, so a page cannot drift
 * back to a placement or an action the template rules out.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('AI chat docks or floats its Panel and never sits on a Blanket', () => {
  const page = read('design-system/src/templates/AiChat/AiChat.mdx');
  assert.doesNotMatch(page, /on a Blanket|#blanket/);
  assert.match(page, /docks it, or floats it over the Page/);
});

test('a long task with steps names the Sidebar inner mode and FooterActions, not a ProgressTracker', () => {
  const row = read('design-system/src/storybook-docs/templates/TemplatesOverview.mdx')
    .split('\n').find((line) => line.includes('A long task with steps'));
  assert.ok(row, 'the overview has the row');
  assert.match(row, /Sidebar<\/code> \(inner mode\)/);
  assert.match(row, /FooterActions/);
  assert.doesNotMatch(row, /ProgressTracker/);
});

test('no page keeps a form or a Cancel in a Popup', () => {
  const pages = [
    'design-system/src/templates/Form/Form.mdx',
    'design-system/src/storybook-docs/patterns/CommonActions/CommonActions.mdx',
    'design-system/src/components/forms-and-inputs/FooterActions/FooterActions.mdx',
    'design-system/src/components/forms-and-inputs/Button/Button.mdx',
  ];
  for (const file of pages) {
    const text = read(file);
    assert.doesNotMatch(text, /page forms? (and|or) popups?/i, `${file} pairs a page form with a popup`);
    assert.doesNotMatch(text, /Cancel[^.\n]{0,40}\bin (a|an inline) popup/i, `${file} puts Cancel in a popup`);
    assert.doesNotMatch(text, /Popup inline confirm/, `${file} keeps a Popup confirm row`);
  }
});
