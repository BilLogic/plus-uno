// The glossary-only check, mutation-tested: each rule proven by a glossary that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BASELINE, measure, REPO_ROOT, SUBJECT } from './check-glossary.mjs';
import { openRatchet } from './lib/ratchet.mjs';

const glossary = (extra = '') =>
  `---\nsummary: g\n---\n\n# Terms\n\nUse these.\n\n## Language\n\n### Product\n\n**Session**:\nA slot.\n_Avoid_: "class"\n${extra}`;

const twoVocabularies = '\n## Two vocabularies — the blueprint speaks one, the Roadmap another\n\n| | **blueprint** | **Roadmap** |\n|---|---|---|\n| Its words | lane | card |\n';

test('a glossary of term entries under clusters passes with its prose counted', () => {
  const { failures, prose } = measure(glossary());
  assert.deepEqual(failures, []);
  assert.equal(prose, 1, 'the one intro sentence is prose');
});

test('a paired term and a term with no _Avoid_ line are entries too', () => {
  const { failures, prose } = measure(glossary('\n**ladder** / **disclosed**:\nWhere writing sits.\n\n**RM-ID**:\nA card id.\n'));
  assert.deepEqual(failures, []);
  assert.equal(prose, 1);
});

test('fenced code fails', () => {
  const { failures } = measure(glossary('\n```js\nconst x = 1\n```\n'));
  assert.equal(failures.length, 1);
  assert.match(failures[0], /fenced code/);
});

test('a heading deeper than a cluster fails', () => {
  const { failures } = measure(glossary('\n#### Five words for arrival\n\n**Arrival**:\nGetting there.\n'));
  assert.match(failures[0], /deeper than a cluster/);
});

test('a cluster with no term entries fails as prose wearing a heading', () => {
  const { failures } = measure(glossary('\n### The rename map\n\nOld became new.\n'));
  assert.match(failures[0], /rename map.*no term entries/);
});

test('a section with no term entries fails as prose wearing a heading', () => {
  const { failures } = measure(glossary('\n## The rename map\n\nOld became new.\n'));
  assert.match(failures[0], /rename map.*no term entries/);
});

test('a term with no definition fails', () => {
  const { failures } = measure(glossary('\n**Orphan**:\n\n**Strike**:\nA violation.\n'));
  assert.equal(failures.length, 1);
  assert.match(failures[0], /"\*\*Orphan\*\*" has no definition/);
});

test('a term entry holds a definition and an _Avoid_ line, and nothing more', () => {
  const hidden = measure(glossary('\n**Old names**:\nWhat they became.\n_Avoid_: "x"\n| Old | New |\n- a bullet\n'));
  assert.equal(hidden.failures.length, 2, hidden.failures.join('\n'));
  assert.match(hidden.failures[0], /runs past its `_Avoid_:` line/);
  const twoLines = measure(glossary('\n**Strike**:\nA violation.\nA second paragraph of reference.\n'));
  assert.match(twoLines.failures[0], /second definition line/);
});

test('an empty cluster is named even when another section has a full cluster of the same name', () => {
  const { failures } = measure(glossary('\n## Elsewhere\n\n### Product\n\nJust prose.\n'));
  assert.ok(failures.some((f) => /"Elsewhere › Product" holds no term entries/.test(f)), failures.join('\n'));
  assert.ok(!failures.some((f) => /"Language › Product"/.test(f)), 'the full cluster is not blamed');
});

test('the old table form fails outside § Two vocabularies', () => {
  const { failures } = measure(glossary('\n| Term | Meaning |\n|---|---|\n| **Strike** | a violation |\n'));
  assert.ok(failures.length > 0);
  assert.match(failures[0], /table row outside § Two vocabularies/);
});

test('§ Two vocabularies holds its table instead of term entries', () => {
  const { failures } = measure(glossary(`${twoVocabularies}\nRoute by frame words.\n`));
  assert.deepEqual(failures, []);
  const emptied = measure(glossary('\n## Two vocabularies — the blueprint speaks one, the Roadmap another\n\nRoute by frame words.\n'));
  assert.match(emptied.failures[0], /lost its table/);
});

test('prose lines are counted; term entries, table rows and comments are not', () => {
  const { prose } = measure(glossary(`\n<!-- note -->\n- a bullet\nA sentence.\n\n**X**:\nY.\n${twoVocabularies}`));
  assert.equal(prose, 3);
});

test('the committed glossary is a glossary and within its baseline', () => {
  const text = readFileSync(path.join(REPO_ROOT, SUBJECT), 'utf8');
  const { failures, prose } = measure(text);
  assert.deepEqual(failures, []);
  // Read through the ratchet, the way the check reads it (#601): the record is
  // a `scalar` set — one number, keyed by its field name — and a test that
  // parsed the file itself would be the second reader the module exists to end.
  const recorded = openRatchet({ file: BASELINE }).entries.get('proseLines').counts.get('proseLines');
  assert.ok(prose <= recorded, `${prose} prose lines against a baseline of ${recorded}`);
});
