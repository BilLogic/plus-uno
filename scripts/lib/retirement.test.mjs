// The one retirement list: a name is retired or it is not, what replaces it,
// and whether a file may still say it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOKEN_NAME_TAIL } from '../../design-system/src/lib/tokens.mjs';
import { checkInventions } from './inventions.mjs';
import { glossaryAvoid, listProblems, loadRetirement, rowsOfRule } from './retirement.mjs';
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
  const docs = trackedSources(REPO_ROOT, DOC_ROOTS, /\.md$/).filter(({ path: p }) => !retirement.allowed(p, 'spelling'));
  const hits = docs.flatMap(({ path: p, text }) => retirement.findIn(text).filter((f) => f.row.not === row).map((f) => `${p}: ${f.match}`));
  assert.deepEqual(hits, []);
});

test('the shared allowed places cover history, and a place may keep only some kinds', () => {
  for (const file of ['docs/adr/037-x.md', 'docs/knowledge/changelog.md', 'docs/evals/ds-usage-ledger.jsonl']) {
    assert.equal(retirement.allowed(file), true, file);
    assert.equal(retirement.allowed(file, 'word'), true, file);
  }
  for (const file of ['docs/evals/scenarios/ds-usage/x/brief.md', 'docs/evals/fixtures/a.md']) assert.equal(retirement.allowed(file), true, file);
  for (const file of ['docs/evals/README.md', 'docs/evals/rubrics/x.md', 'docs/evals/ds-usage.md']) assert.equal(retirement.allowed(file), false, `${file} stays policed`);
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

test('ofKind lists the rows of one kind, and a copy cannot change the list', () => {
  const words = retirement.ofKind('word');
  assert.ok(words.some((r) => r.not === 'scrim'));
  words[0].not = 'changed';
  assert.notEqual(retirement.ofKind('word')[0].not, 'changed');
  assert.ok(retirement.ofKind('outside').some((r) => r.not === 'lozenge'));
});

test('a tag is a retired name that is also a word: found by kind, never in prose', () => {
  assert.ok(retirement.ofKind('tag').some((r) => r.not === 'Surface'));
  assert.equal(retirement.retired('Surface').kind, 'tag');
  assert.deepEqual(retirement.findIn('the Surface of the page, an Overlay').filter((f) => f.row.severity === 'error'), []);
  assert.deepEqual(retirement.findIn('the Surface', { kinds: ['tag'] }).map((f) => f.match), ['Surface']);
});

test('a row may be case sensitive, bound to paths, or retired only through the plan', () => {
  assert.deepEqual(retirement.findIn('rovo and Rovo', { kinds: ['word'] }).map((f) => f.match), ['Rovo']);
  assert.equal(retirement.findIn('the PLUS AI', { kinds: ['word'], file: 'design-system/src/x.mdx' }).length, 1);
  assert.equal(retirement.findIn('the PLUS AI', { kinds: ['word'], file: 'prototypes/x.jsx' }).length, 0);
  // `--space-025` is a primitive agents misuse, not a retired name; a name the plan retired is.
  assert.equal(retirement.findIn('--space-025', { kinds: ['token'], retiredOnly: true }).length, 0);
  const [old] = [...retiredRenames()][0];
  assert.equal(retirement.findIn(`use ${old}`, { kinds: ['token'], retiredOnly: true }).length, 1);
});

test('the retirement rule is written where engineering conventions live, and the list points at it', () => {
  const coding = fs.readFileSync(path.join(REPO_ROOT, 'docs/engineering/coding.md'), 'utf8');
  assert.match(coding, /### Retiring a name/);
  assert.match(coding, /every use of a retired name is replaced in the same change/);
  assert.match(list.$about, /docs\/engineering\/coding\.md § Retiring a name/);
});

/* ─── the three lists the checks used to keep for themselves ───────────────── */

const spellingsOf = (rule) => retirement.ofKind('spelling').filter((row) => row.rule === rule);

test('the rows the checks own are there, and an absent family is an error, never an empty one', () => {
  for (const rule of ['path:old', 'read:old-token', 'phrase:token-intent', 'heading:retired', 'path:components-folder', 'face:retired']) {
    const rows = rowsOfRule(rule);
    assert.ok(rows.length > 0, rule);
    for (const row of rows) assert.doesNotThrow(() => new RegExp(row.pattern), row.not);
  }
  assert.throws(() => rowsOfRule('path:nothing'), (err) => err.name === 'MissingRows' && /path:nothing/.test(err.message));
});

test('the old-token row is the var() read of the retired families, built on the token grammar', () => {
  const tail = TOKEN_NAME_TAIL;
  const expected =
    `var\\(\\s*(--(?:color|size|element|layout)-${tail}|--font-line-height-${tail}|` +
    '--font-(?:size|family|weight)-(?:body\\d|h\\d|headline|header|code|title|normal|bold|medium|semibold-\\d))';
  assert.equal(rowsOfRule('read:old-token')[0].pattern, expected);
  const reads = (text) => [...text.matchAll(new RegExp(expected, 'g'))].map((m) => m[1]);
  assert.deepEqual(reads('a { b: var(--color-text); c: var( --size-100 ); d: var(--font-size-custom); e: var(--ds-text) }'), ['--color-text', '--size-100']);
  assert.deepEqual(reads('@theme { --color-text: red; }'), [], 'a definition is not a read');
});

test('a retired path shape is a substring of a line, and a current path is not', () => {
  const hit = (line) => spellingsOf('path:old').some((row) => new RegExp(row.pattern).test(line));
  assert.ok(hit('see `docs/project/notes.md`'));
  assert.ok(hit('run /uno:research'));
  assert.ok(!hit('see `docs/conventions/writing.md`'));
});

test('the phrase rows and the path rows are another check\'s families, so the maintenance sweep skips them', () => {
  for (const row of ['phrase:token-intent', 'path:old', 'read:old-token', 'heading:retired', 'path:components-folder', 'face:retired'].flatMap(spellingsOf)) {
    assert.ok(row.rule.includes(':'), `${row.not} has a kind:name rule, so it is not a plain family or a maintenance spelling`);
  }
});
