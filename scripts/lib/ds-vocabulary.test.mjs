/**
 * The glossary vocabulary as DS search reads it: fixture glossaries in, terms,
 * aliases and collisions out. The last cases run the real glossary through
 * `ds_find`, so an avoid-word query is held to rank its component first.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLookup } from './ds-lookup.mjs';
import { DS_SECTION, aliasInputs, parseGlossary, vocabularyAliases } from './ds-vocabulary.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const GLOSSARY = `# Terms

## Language

### Product

**Escalation**:
A tutor flagging a session for supervisor review.
_Avoid_: "report", "incident", "alert"

### Design system: structure

**Card**:
The container of one object.
_Avoid_: "tile" (Tile is its own component), "box", "side panel"

**Panel**:
The area at the right.
_Avoid_: "side panel"

### Design system: components

**Section message**:
A message in the page flow.
_Avoid_: "alert", "callout"

**Dropdown menu**:
A button trigger that opens a menu.
_Avoid_: bare "dropdown", "action list"

**Close / Dismiss**:
Close ends a blocking layer.

**Modal**:
Content that takes over the screen.
_Avoid_: "Modal dialog", "ModalDialog", "popup" for a blocking dialog

**Linear scale**:
A row of options.
_Avoid_: "scale"

**appearance**:
The prop that picks how a component looks.
_Avoid_: \`style\`, \`fill\`

## Two vocabularies

**Not a term**:
_Avoid_: "nothing"
`;

const NAMES = ['Panel', 'Tile', 'PatternCard', 'SectionMessage', 'DropdownMenu', 'Modal', 'Flag', 'Banner'];
const facts = { names: NAMES, notHere: ['Alert', 'Dropdown'], handAliases: { SectionMessage: ['callout'], Flag: ['toast message'] } };

test('parse: reads each term of a section with its avoid-words, and stops at the next ## heading', () => {
  const terms = parseGlossary(GLOSSARY);
  assert.deepEqual(
    terms.map((t) => `${t.section} | ${t.term}`),
    [
      'Product | Escalation',
      'Design system: structure | Card',
      'Design system: structure | Panel',
      'Design system: components | Section message',
      'Design system: components | Dropdown menu',
      'Design system: components | Close / Dismiss',
      'Design system: components | Modal',
      'Design system: components | Linear scale',
      'Design system: components | appearance',
    ],
  );
  const card = terms.find((t) => t.term === 'Card');
  assert.deepEqual(card.avoid, [
    { word: 'tile', plain: false },
    { word: 'box', plain: true },
    { word: 'side panel', plain: true },
  ]);
  const modal = terms.find((t) => t.term === 'Modal');
  assert.deepEqual(modal.avoid.map((a) => [a.word, a.plain]), [['Modal dialog', true], ['ModalDialog', true], ['popup', false]]);
  assert.deepEqual(terms.find((t) => t.term === 'appearance').avoid.map((a) => a.plain), [false, false], 'a code name is never a plain word');
  assert.ok(DS_SECTION.test('Design system: tokens') && !DS_SECTION.test('Product'));
});

test('aliases: a design-system term maps to its component, the Pattern name included, and its plain avoid-words become aliases', () => {
  const { aliases } = vocabularyAliases(parseGlossary(GLOSSARY), facts);
  assert.deepEqual(aliases, {
    PatternCard: ['box'],
    DropdownMenu: ['action list'],
    Modal: ['modal dialog'],
  });
});

test('aliases: a product term\'s avoid-words never enter DS search', () => {
  const { aliases } = vocabularyAliases(parseGlossary(GLOSSARY), facts);
  assert.ok(!Object.values(aliases).flat().some((a) => ['report', 'incident'].includes(a)));
  assert.ok(!Object.values(aliases).flat().includes('alert'));
});

test('aliases: a not-here name, a qualified word and a shared word are skipped with a reason, a term with no component is reported', () => {
  const { excluded, unmatched } = vocabularyAliases(parseGlossary(GLOSSARY), facts);
  assert.deepEqual(unmatched, ['Close / Dismiss', 'Linear scale', 'appearance']);
  const reasons = Object.fromEntries(excluded.map((e) => [`${e.term}: ${e.word}`, e.reason]));
  assert.equal(reasons['Section message: alert'], 'not-here');
  assert.equal(reasons['Card: tile'], 'qualified');
  assert.equal(reasons['Dropdown menu: dropdown'], 'qualified');
  assert.equal(reasons['Card: side panel'], 'shared', 'a word two terms both avoid names neither');
  assert.equal(reasons['Panel: side panel'], 'shared');
});

test('parse: a word avoided "as a name" is plain for search and marked named; the marker is the whole qualifier', () => {
  const md = `## Language\n\n### Design system: structure\n\n**Card**:\nOne object.\n_Avoid_: "box", "region" as a name, "tile" (Tile is its own component)\n`;
  const [card] = parseGlossary(md);
  assert.deepEqual(card.avoid, [
    { word: 'box', plain: true },
    { word: 'region', plain: true, named: true },
    { word: 'tile', plain: false },
  ]);
  assert.deepEqual(vocabularyAliases([card], { names: ['PatternCard'] }).aliases, { PatternCard: ['box', 'region'] }, 'a named word still feeds search');
});

test('collision: an avoid-word that is another component\'s name or alias is a collision, and never an alias', () => {
  const clash = `### Design system: components

**Section message**:
A message.
_Avoid_: "flag", "toast message", "callout"
`;
  const { aliases, collisions } = vocabularyAliases(parseGlossary(clash), facts);
  assert.deepEqual(collisions.map((c) => `${c.term}: ${c.word} → ${c.with}`), ['Section message: flag → Flag', 'Section message: toast message → Flag']);
  assert.deepEqual(aliases, {}, 'a word the component already carries by hand is not repeated');
});

test('collision: the real glossary has none', () => {
  const lookup = createLookup(REPO_ROOT);
  assert.deepEqual(lookup.vocabulary().collisions, []);
});

test('find: each glossary alias ranks its component first', () => {
  const lookup = createLookup(REPO_ROOT);
  const { aliases } = lookup.vocabulary();
  assert.ok(Object.keys(aliases).length >= 5, 'the glossary feeds almost nothing');
  const wrong = Object.entries(aliases).flatMap(([name, list]) => list.filter((a) => lookup.find(a).results[0]?.name !== name).map((a) => `${a} → ${name} (got ${lookup.find(a).results[0]?.name})`));
  assert.deepEqual(wrong, []);
  assert.equal(lookup.find('modal dialog').results[0]?.name, 'Modal');
});

test('find: a product avoid-word does not route to a design-system term through the glossary', () => {
  const lookup = createLookup(REPO_ROOT);
  const all = Object.values(lookup.vocabulary().aliases).flat();
  for (const word of ['alert', 'report', 'incident', 'class', 'meeting']) assert.ok(!all.includes(word), word);
  assert.ok(fs.existsSync(path.join(REPO_ROOT, 'GLOSSARY.md')));
});

test('aliasInputs reads the not-here names and hand-kept aliases from an agent-views folder, empty when a file is missing', () => {
  const views = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-inputs-'));
  assert.deepEqual(aliasInputs(views, ['Card']), { names: ['Card'], notHere: [], handAliases: {} });
  fs.writeFileSync(path.join(views, '_inventions.json'), JSON.stringify({ components: [{ not: 'Toast', use: ['Flag'] }] }));
  fs.writeFileSync(path.join(views, '_aliases.json'), JSON.stringify({ components: { Card: ['tile'] } }));
  assert.deepEqual(aliasInputs(views, ['Card']), { names: ['Card'], notHere: ['Toast'], handAliases: { Card: ['tile'] } });
});
