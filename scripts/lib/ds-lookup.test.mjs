/**
 * The design-system lookup through its interface, against the real repo:
 * what the `ds` command and the local MCP server answer.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { REPO_ROOT } from './corpus.mjs';
import { ORIENTATION, PATHS_REFUSAL, PathsRefused, createLookup, render } from './ds-lookup.mjs';

const lookup = createLookup(REPO_ROOT);

test('check refuses paths when built with readPaths off, and still checks code', () => {
  const closed = createLookup(REPO_ROOT, { readPaths: false });
  assert.throws(() => closed.check({ paths: ['package.json'] }), (err) => err instanceof PathsRefused && err.message === PATHS_REFUSAL);
  assert.ok(Array.isArray(closed.check({ code: '<div />', path: 'prototypes/a.jsx' }).findings));
  assert.doesNotThrow(() => createLookup(REPO_ROOT).check({ paths: ['package.json'] }));
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
  assert.match(render('find', { results: [results.at(-1)], next: '' }), /^guide {5}iconography {2}→ ds_guide\("iconography"\)/);
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
