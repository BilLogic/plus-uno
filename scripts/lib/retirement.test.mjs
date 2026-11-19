// The one retirement list: a name is retired or it is not, what replaces it,
// and whether a file may still say it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkInventions } from './inventions.mjs';
import { glossaryAvoid, listProblems, loadRetirement } from './retirement.mjs';
import { DOC_ROOTS } from '../check-ads-language.mjs';
import { retiredRenames } from './tokens/plan.mjs';
import { trackedSources } from './tracked-sources.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const retirement = loadRetirement(REPO_ROOT);
const read = (rel) => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'));
const list = read('design-system/agent-views/_inventions.json');
const kindsIn = (text) => retirement.findIn(text).filter((f) => f.row.severity === 'error').map((f) => `${f.row.kind}:${f.match}`);

test('a retired component answers with its replacement', () => {
  const hit = retirement.retired('Toast');
  assert.equal(hit.kind, 'component');
  assert.deepEqual(hit.use, ['Flag']);
  assert.equal(hit.severity, 'error');
});

test('a name agents invent is not retired, and Drawer says so', () => {
  assert.equal(retirement.retired('Drawer'), null);
  assert.equal(list.components.find((r) => r.not === 'Drawer').retired, false);
});

test('a retired prop answers with its replacement', () => {
  const hit = retirement.retired('Button variant');
  assert.equal(hit.kind, 'prop');
  assert.deepEqual(hit.use, ['Button.appearance']);
});

test('a retired token answers from the table rows and from the token plan', () => {
  assert.equal(retirement.retired('--space-025').kind, 'token');
  const renames = [...retiredRenames()];
  for (const [old] of renames) assert.equal(retirement.retired(old)?.kind, 'token', old);
  assert.ok(renames.some(([old, replacement]) => retirement.retired(old).use[0] === replacement), 'a plan rename answers with the plan replacement');
  assert.equal(retirement.retired('--stack-md'), null);
});

test('a retired word answers, whatever its case', () => {
  const hit = retirement.retired('Scrim');
  assert.equal(hit.kind, 'word');
  assert.deepEqual(hit.use, ['Blanket']);
});

test('a retired spelling answers by its shape', () => {
  assert.equal(retirement.retired('Tier 1 fix').kind, 'spelling');
  assert.equal(retirement.retired('Tier 2 — loaded on demand'), null);
});

test('an outside name answers as an error, and "inline dialog" stays a PLUS phrase', () => {
  const hit = retirement.retired('Lozenge');
  assert.equal(hit.kind, 'outside');
  assert.equal(hit.severity, 'error');
  assert.equal(retirement.retired('inline dialog')?.severity, 'warn');
  assert.equal(list.outside.some((r) => r.not === 'inline dialog'), false);
});

test('a glossary avoid-word warns instead of failing', () => {
  assert.deepEqual(glossaryAvoid('### Sidebar\n_Avoid_: "left nav", "side nav"\n'), ['left nav', 'side nav']);
  const hit = retirement.retired('left nav');
  assert.equal(hit.kind, 'avoid');
  assert.equal(hit.severity, 'warn');
});

test('a current name is not retired', () => {
  for (const name of ['Flag', 'SectionMessage', 'Button.appearance', '--ds-surface-raised']) assert.equal(retirement.retired(name), null, name);
});

test('findIn scans prose for every kind with one rule', () => {
  assert.deepEqual(kindsIn('Rovo answers'), ['word:Rovo']);
  assert.deepEqual(kindsIn('the PLUS AI replies'), ['word:PLUS AI']);
  assert.deepEqual(kindsIn('as Atlassian does it'), ['word:Atlassian']);
  assert.deepEqual(kindsIn('a lozenge here'), ['outside:lozenge']);
  assert.deepEqual(kindsIn('a Toast appears'), ['component:Toast']);
  assert.deepEqual(kindsIn('use --space-025 here'), ['token:--space-025']);
  assert.deepEqual(kindsIn('the Tier 1 fix landed'), ['spelling:Tier 1 fix']);
  assert.deepEqual(kindsIn('the Gemini lane stalled'), ['spelling:Gemini lane']);
  assert.deepEqual(kindsIn('a Toaster and a notoast'), []);
  assert.ok(retirement.findIn('the left nav').some((f) => f.row.severity === 'warn'), 'an avoid-word is found as a warning');
  const [hit] = retirement.findIn('a scrim, later');
  assert.equal(hit.row.use[0], 'Blanket');
  assert.equal(hit.index, 2);
});

test('the blueprint actor-row sense of "lane" is not flagged', () => {
  for (const prose of ['the lane column holds the actor', 'each lane is an actor row', 'filter_lane_role', 'an agent lane in the blueprint', 'stay in your lane']) {
    assert.deepEqual(kindsIn(prose), [], prose);
  }
});

test('over the tracked agent-read docs, the Gemini lane row has no false positive', () => {
  const row = 'Gemini lane';
  const docs = trackedSources(REPO_ROOT, DOC_ROOTS, /\.md$/).filter(({ path: p }) => !retirement.allowed(p, 'spelling') && !/^agents\/uno-bot\/(?:harness-bundle|src\/)/.test(p));
  const hits = docs.flatMap(({ path: p, text }) => retirement.findIn(text).filter((f) => f.row.not === row).map((f) => `${p}: ${f.match}`));
  assert.deepEqual(hits, []);
});

test('the shared allowed places cover history, and a place may keep only some kinds', () => {
  for (const file of ['docs/adr/037-x.md', 'docs/knowledge/archive/old.md', 'docs/knowledge/changelog.md', 'docs/evals/ds-usage-ledger.jsonl']) {
    assert.equal(retirement.allowed(file), true, file);
    assert.equal(retirement.allowed(file, 'word'), true, file);
  }
  const figma = 'design-system/figma/component-registry.json';
  assert.equal(retirement.allowed(figma, 'component'), true);
  assert.equal(retirement.allowed(figma, 'word'), false);
  assert.equal(retirement.allowed(figma), false);
  for (const file of ['design-system/src/components/Button/Button.jsx', 'docs/engineering/coding.md', 'docs/adr-notes.md']) {
    assert.equal(retirement.allowed(file, 'component'), false, file);
  }
});

test('the committed list is well-formed, every replacement exists, and the Not-here table renders from it', () => {
  assert.deepEqual(listProblems(list), []);
  const templates = read('design-system/agent-views/_templates.json').templates.map((r) => r.name);
  assert.deepEqual(checkInventions(list, read('design-system/agent-views/components.json'), read('design-system/agent-views/tokens.json'), templates), []);
  assert.match(retirement.notHereTable(), /\| `Toast` \| `Flag` \(renamed\) \|/);
  assert.match(retirement.notHereTable(), /\| `Drawer` \| `Panel`/);
});

test('listProblems names a row with no replacement, a spelling with no pattern, and a malformed place', () => {
  const bad = { words: [{ not: 'x', use: [] }], spellings: [{ not: 's', use: ['y'] }], allowed: [{ path: '', why: 'y' }, { path: 'docs/' }, { path: 'a/', why: 'b', kinds: ['nope'] }] };
  assert.deepEqual(listProblems(bad), ['word x: no replacement', 'spelling s: no pattern', 'allowed place "": no path', 'allowed place "docs/": no reason', 'allowed place "a/": unknown kind']);
});
