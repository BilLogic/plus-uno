/**
 * The design-system lookup through its interface, against the real repo:
 * what the `ds` command and the local MCP server answer.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './corpus.mjs';
import { ORIENTATION, PATHS_REFUSAL, PathsRefused, createLookup, render } from './ds-lookup.mjs';

const lookup = createLookup(REPO_ROOT);

test('check refuses paths when built with readPaths off, and still checks code', () => {
  const closed = createLookup(REPO_ROOT, { readPaths: false });
  assert.throws(() => closed.check({ paths: ['package.json'] }), (err) => err instanceof PathsRefused && err.message === PATHS_REFUSAL);
  assert.ok(Array.isArray(closed.check({ code: '<div />', path: 'prototypes/a.jsx' }).findings));
  assert.doesNotThrow(() => createLookup(REPO_ROOT).check({ paths: ['package.json'] }));
});

test('the hosted check reads the committed Free lists, so solid and brands names are checked without Font Awesome installed', () => {
  const hosted = createLookup(REPO_ROOT, { readPaths: false });
  const rules = (cls) => hosted.check({ code: `export const X = () => <i className="${cls}" />;`, path: 'prototypes/a.jsx' }).findings.map((f) => f.rule);
  assert.deepEqual(rules('fa-solid fa-grid-2'), ['ds/fa-free-only']);
  assert.deepEqual(rules('fa-brands fa-not-a-brand'), ['ds/fa-free-only']);
  assert.deepEqual(rules('fa-solid fa-house'), []);
  assert.deepEqual(rules('fa-brands fa-figma'), []);
});

test('a JSDoc that opens "<Name>: …" or "<Name> — …" keeps that line as its summary', () => {
  const summary = (n) => lookup.get([n], 'props').records[0].summary;
  assert.match(summary('PageHeader'), /^PageHeader: a page's title row/);
  assert.match(summary('Banner'), /^Banner: a prominent message/);
  assert.match(summary('Checkbox'), /^Checkbox — single boolean control/);
});

test('find answers "card" with Card as not here and PatternCard with its import', () => {
  const { results, next } = lookup.find('card');
  assert.equal(results[0].kind, 'not-here');
  assert.equal(results[0].name, 'Card');
  assert.equal(results[0].use[0].import, "import { PatternCard } from '@/patterns';");
  assert.ok(results.some((r) => r.kind === 'pattern' && r.name === 'PatternCard'));
  assert.match(next, /ds_get/);
});

test('find ranks a task in words, resolves a Figma name, and flags a Pro icon', () => {
  assert.equal(lookup.find('a table of students').results[0].name, 'PatternTable');
  const figma = lookup.find('Form Switch Button').results[0];
  assert.deepEqual([figma.name, figma.figma], ['Toggle', 'Form Switch Button']);
  const pro = lookup.find('fa-light fa-house').results[0];
  assert.deepEqual([pro.kind, pro.status], ['icon', 'pro']);
  assert.ok(lookup.find('house icon').results.some((r) => r.name === 'fa-regular fa-house'));
});

test('icons answer only when the query asks for an icon', () => {
  assert.equal(lookup.find('house').results.some((r) => r.kind === 'icon'), false);
  assert.equal(lookup.find('check that it saved').results.some((r) => r.kind === 'icon'), false);
  assert.ok(lookup.find('house icon').results.some((r) => r.kind === 'icon'));
});

test('the icon lane drops stopwords before it joins the words into a name', () => {
  const names = lookup.find('an icon for calendar').results.filter((r) => r.kind === 'icon').map((r) => r.name);
  assert.ok(names.includes('fa-regular fa-calendar') && names.includes('fa-solid fa-calendar'), names.join(', '));
  assert.equal(lookup.find('an icon for calendar').results[0].name, lookup.find('calendar icon').results[0].name);
});

test('a bare Pro family word gives the Pro row first, then the Free match on the other words', () => {
  // Font Awesome metadata may not be installed; a stub set stands in for it.
  const stubbed = createLookup(REPO_ROOT, { iconMetadata: { 'graduation-cap': { free: ['solid'] }, house: { free: ['solid', 'regular'] } } });
  const { results } = stubbed.find('duotone graduation cap icon');
  assert.deepEqual([results[0].kind, results[0].status], ['icon', 'pro']);
  assert.match(results[0].why, /duotone/);
  assert.equal(results[1].name, 'fa-solid fa-graduation-cap');
  assert.equal(stubbed.find('graduation-cap').results[0].name, 'fa-solid fa-graduation-cap');
  assert.equal(stubbed.find('light background color').results.some((r) => r.status === 'pro'), false);
});

test('tokens answer only on token vocabulary, and then lead', () => {
  assert.equal(lookup.find('confirm before deleting').results.some((r) => r.kind === 'token'), false);
  assert.equal(lookup.find('selected').results.some((r) => r.kind === 'token'), false);
  assert.equal(lookup.find('purple color token').results[0].kind, 'token');
  assert.equal(lookup.find('brand text color').results[0].name, '--ds-text-brand');
  assert.equal(lookup.find('--ds-text-brand').results[0].name, '--ds-text-brand');
});

test('an everyday token word alone never opens the token lane; beside a strong one it narrows', () => {
  for (const q of ['fill out a form', 'brand logo', 'surface of the page', 'space between', 'neutral tone', 'stroke width', 'palette']) {
    assert.equal(lookup.find(q).results.some((r) => r.kind === 'token'), false, q);
  }
  assert.equal(lookup.find('brand logo').results[0].name, 'Logo');
  assert.equal(lookup.find('brand background color').results[0].kind, 'token');
  assert.match(lookup.find('brand background color').results[0].name, /brand/);
  // stopwords do not score a step through its intent
  assert.deepEqual(
    lookup.find('the color of the brand text').results.filter((r) => r.kind === 'token').map((r) => r.name),
    lookup.find('brand text color').results.filter((r) => r.kind === 'token').map((r) => r.name),
  );
});

test('constants answer only to their exact name; other exports follow the components', () => {
  assert.equal(lookup.find('BUTTON_APPEARANCES').results[0].name, 'BUTTON_APPEARANCES');
  assert.equal(lookup.find('button appearances').results.some((r) => /^[A-Z0-9_]+$/.test(r.name)), false);
  const table = lookup.find('table').results;
  const firstExport = table.findIndex((r) => r.kind === 'export');
  const lastRanked = table.findLastIndex((r) => r.kind === 'component' || r.kind === 'pattern');
  assert.ok(firstExport === -1 || firstExport > lastRanked, table.map((r) => r.name).join(', '));
});

test('a query that names a guideline topic ends with a guide row', () => {
  const { results } = lookup.find('icon');
  assert.deepEqual(results.at(-1), { kind: 'guide', name: 'iconography', next: 'ds_guide("iconography")' });
  assert.equal(lookup.find('heading text typography').results.at(-1).name, 'typography');
  assert.equal(lookup.find('confirm before deleting').results.some((r) => r.kind === 'guide'), false);
  for (const q of ['color palette', 'layout of the page', 'accessibility of a modal', 'a11y']) assert.equal(lookup.find(q).results.at(-1).kind, 'guide', q);
  assert.match(render('find', { results: [results.at(-1)], next: '' }), /^guide {5}iconography {2}→ ds_guide\("iconography"\)/);
});

test('an everyday topic word gives a guide row only beside a cue or another topic word', () => {
  const guide = (q) => lookup.find(q).results.filter((r) => r.kind === 'guide').map((r) => r.name);
  assert.deepEqual(guide('copy to clipboard'), []);
  assert.deepEqual(guide('grid of cards'), []);
  assert.deepEqual(guide('an icon for calendar'), []);
  assert.deepEqual(guide('copy guidelines'), ['content']);
  assert.deepEqual(guide('grid rules'), ['grid']);
  // another topic word seconds it: the row names the first topic the query carries
  assert.deepEqual(guide('grid layout'), ['grid']);
  assert.deepEqual(guide('grid'), ['grid']);
});

test('find names the tool to call instead on a miss', () => {
  const miss = lookup.find('xyzzy');
  assert.deepEqual(miss.results, []);
  assert.match(miss.next, /ds_tokens|ds_guide/);
});

test('get returns props, one section at a time, and the replacement for a retired name', () => {
  const [button] = lookup.get(['Button'], 'props').records;
  assert.equal(button.import, "import { Button } from '@/components';");
  assert.ok(button.props.find((p) => p.name === 'appearance').values.includes('primary'));
  assert.equal('usage' in button, false);

  const [card] = lookup.get(['PatternCard']).records;
  assert.match(card.a11y, /^## Accessibility/);
  assert.match(card.usage, /^## Usage/);
  assert.equal(card.figma.sets[0].name, 'Pattern/Card');

  const [alert] = lookup.get(['Alert']).records;
  assert.equal(alert.status, 'not-here');
  assert.deepEqual(alert.use.map((u) => u.name), ['SectionMessage', 'Flag']);

  const [unknown] = lookup.get(['Nope']).records;
  assert.match(unknown.next, /ds_find/);
});

test('tokens returns steps with intent and leaves primitives out', () => {
  const { steps } = lookup.tokens('stack');
  assert.ok(steps.length > 0);
  assert.ok(steps.every((t) => t.tier !== 'primitive' && t.intent));
  const primitives = lookup.tokens('palette');
  assert.deepEqual(primitives.steps, []);
  assert.match(primitives.next, /primitives/);
});

test('guide returns the orientation, a guideline and a rule section', () => {
  assert.equal(lookup.guide().text, ORIENTATION);
  assert.equal(lookup.guide('layout formulas').path, 'design-system/guidelines/composition/layout.md');
  assert.equal(lookup.guide('a11y').path, 'design-system/guidelines/foundations/accessibility.md');
  assert.match(lookup.guide('no-raw-literal').text, /^## ds\/no-raw-literal/);
  assert.ok(lookup.guide('nope').topics.includes('layout'));
});

test('check runs check:ds-usage in-process on code, with rule ids and fixes', () => {
  const r = lookup.check({ code: "import { Alert } from '@/components';\nexport const X = () => <div style={{ color: '#fff' }}><Alert /></div>;" });
  assert.deepEqual(
    r.findings.map((f) => f.rule),
    ['ds/no-unknown-component', 'ds/no-raw-literal'],
  );
  assert.ok(r.findings.every((f) => f.fix && f.see));
  assert.equal(lookup.check({ code: "import { Button } from '@/components';\nexport const X = () => <Button text=\"Save\" />;" }).failing, 0);
  assert.match(render('check', r), /ds\/no-raw-literal/);
});

test('get returns the generated doc byte for byte, for a component, a flat component and a pattern', () => {
  for (const [name, file] of [
    ['Modal', 'design-system/src/components/messaging/Modal/index.md'],
    ['Fieldset', 'design-system/src/components/forms-and-inputs/Fieldset.md'],
    ['PatternCard', 'design-system/src/patterns/PatternCard/index.md'],
  ]) {
    const result = lookup.get([name]);
    assert.equal(render('get', result), fs.readFileSync(path.join(REPO_ROOT, file), 'utf8'), name);
    assert.equal(result.records[0].doc, file, name);
  }
});

test('a get section is that part of the same text', () => {
  const full = render('get', lookup.get(['Modal']));
  const a11y = render('get', lookup.get(['Modal'], 'a11y'));
  assert.match(a11y, /^# Modal\n\nimport \{ Modal \} from '@\/components';\n\n## Accessibility\n/);
  assert.ok(full.includes(a11y.slice(a11y.indexOf('## Accessibility'))));
  assert.doesNotMatch(full, /figma\.com|Next:/);
});
