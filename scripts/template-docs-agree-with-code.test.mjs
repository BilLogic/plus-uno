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
  const page = read('design-system/src/components/ai/AiChat/AiChat.mdx');
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
    'design-system/src/storybook-docs/patterns/Forms/Forms.mdx',
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

/** The keys of `<Name>.propTypes = { ... }`, each a public prop. */
const propTypeKeys = (source, name) => {
  const start = source.indexOf(`${name}.propTypes = {`);
  assert.ok(start >= 0, `${name}.propTypes is in the source`);
  const body = source.slice(start).split('\n};')[0];
  return [...body.matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]);
};

test('the Section Slots table lists every public prop', () => {
  const page = read('design-system/src/templates/Section/Section.mdx');
  const slots = page.slice(page.indexOf('## Slots'), page.indexOf('The bulk bar lives'));
  for (const prop of propTypeKeys(read('design-system/src/templates/Section/Section.jsx'), 'Section')) {
    assert.ok(new RegExp(`<code>${prop}[<="]`).test(slots), `the Slots table lists ${prop}`);
  }
});

test('the Section page states the narrow behavior the code has', () => {
  const page = read('design-system/src/templates/Section/Section.mdx');
  assert.match(page, /filters fold into one Filter button and the views scroll sideways/);
  assert.doesNotMatch(page, /Primary keeps only its icon|Search collapses|extra pills fold/);
});

test('Section carries no glossary avoid-word of its own: its hand-kept aliases and its summary', () => {
  const aliases = JSON.parse(read('design-system/agent-views/_aliases.json')).components.Section;
  assert.ok(!aliases.includes('toolbar'), 'toolbar is not a Section alias');
  assert.doesNotMatch(read('design-system/src/templates/Section/Section.jsx'), /with its header, toolbar and tabs/);
});

test('the Panel page places Details by width, credits Escape to the Frame and lists every part', () => {
  const page = read('design-system/src/templates/Panel/Panel.mdx');
  assert.doesNotMatch(page, /floating over the right of the Page/);
  assert.doesNotMatch(page, /footer, and Escape to close/);
  assert.match(page, /Docked from 1168; floating under it/);
  assert.match(page, /The Frame closes the Panel on Escape/);
  assert.match(page, /Inbox floating out of the Sidebar on the left is <PlannedTag \/> Planned/);
  const slots = page.slice(page.indexOf('<tr><th>Slot</th>'), page.indexOf('</DocsTable>', page.indexOf('<tr><th>Slot</th>')));
  for (const part of ['backAction', 'titleIcon', 'PanelSubheader', 'PanelDisclaimer']) assert.ok(slots.includes(part), `the Slots table lists ${part}`);
});

test('the Details demo puts Edit in the title row, where Common actions says, not in the body', () => {
  const demo = read('design-system/src/templates/Panel/panelDemo.jsx');
  assert.doesNotMatch(demo, /<div><Button text="Edit"/);
  assert.match(demo, /actions=\{\(\s*<>\s*\{!editing && onEdit \? <Button text="Edit"/);
});

test('the Table page names the footer gap its styles use and when the count shows', () => {
  const page = read('design-system/src/templates/Table/Table.mdx');
  assert.match(read('design-system/src/templates/Table/Table.scss'), /gap: var\(--table-inline\)/);
  assert.match(page, /gap between the table and the footer slot/);
  assert.doesNotMatch(page, /Gap between the table and footer, and inside/);
  assert.match(page, /once a filter is applied/);
  assert.doesNotMatch(page, /The count sits in the Section header,|Search, filters and the record count live/);
});

test('the Table and Dynamic table pages label the two footer gaps apart', () => {
  for (const file of ['design-system/src/templates/Table/Table.mdx', 'design-system/src/components/text-and-data-display/DynamicTable/DynamicTable.mdx']) {
    const page = read(file);
    assert.match(page, /Footer slot \(Table template\)/, file);
    assert.match(page, /Footer the shell draws \(Dynamic\/Tree\)/, file);
  }
});
