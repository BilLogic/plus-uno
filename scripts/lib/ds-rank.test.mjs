/**
 * The ranker behind ds_find, through its interface: words in, scored ids out.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { STOPWORDS, WEIGHTS, createRanker, stem, tokenize } from './ds-rank.mjs';

test('tokenize splits camelCase, lowercases, drops stopwords and one-letter words', () => {
  assert.deepEqual(tokenize('DatePicker'), ['dat', 'pick']);
  assert.deepEqual(tokenize('a table of the students'), ['tabl', 'student']);
  assert.deepEqual(tokenize('HTMLInput x'), ['html', 'input']);
  assert.deepEqual(tokenize(null), []);
  assert.deepEqual(tokenize('when it is here, so do any'), ['her']);
});

test('stem folds plurals and common suffixes, and leaves short words alone', () => {
  assert.equal(stem('entries'), 'entry');
  assert.equal(stem('classes'), 'class');
  assert.equal(stem('cards'), 'card');
  assert.equal(stem('class'), 'class');
  assert.equal(stem('loading'), 'load');
  assert.equal(stem('loaded'), 'load');
  assert.equal(stem('sorting'), 'sort');
  assert.equal(stem('notification'), 'notifica');
  assert.equal(stem('bus'), 'bus');
  assert.equal(stem('ring'), 'ring');
  // both sides of a match stem the same way, so the same word in two forms meets
  assert.equal(stem('pages'), stem('page'));
  assert.equal(stem('paging'), stem('paged'));
});

test('stem strips a suffix from the plural-folded word, and only when three letters stay', () => {
  // -tions folds to -tion first, then strips like the singular
  assert.equal(stem('notifications'), stem('notification'));
  assert.equal(stem('selections'), 'selec');
  // the three-letter guard reads the folded word, not the original: "tiers" keeps "tier"
  assert.equal(stem('tiers'), 'tier');
  assert.equal(stem('tiers'), stem('tier'));
  assert.equal(stem('actions'), 'action');
  assert.equal(stem('riders'), 'rid');
});

test('one stopword list: the lookup reads the ranker\'s, and "page" is not in it', () => {
  assert.ok(STOPWORDS.has('the') && STOPWORDS.has('for'));
  assert.ok(!STOPWORDS.has('page'));
});

const doc = (id, fields) => ({ id, fields });

test('a word in a heavier field outranks the same word in a lighter one', () => {
  // every field one word long, so length normalization is the same everywhere and only the weight differs
  const fields = ['name', 'aliases', 'summary', 'usage', 'best'];
  const only = (field) => Object.fromEntries(fields.map((f) => [f, f === field ? 'slider' : 'filler']));
  const ranker = createRanker([
    doc('InBest', only('best')),
    doc('InUsage', only('usage')),
    doc('InSummary', only('summary')),
    doc('InAlias', { ...only('aliases'), aliases: ['slider'] }),
    doc('InName', only('name')),
    doc('Other', only(null)),
  ]);
  assert.deepEqual(ranker.score('slider').map((r) => r.id), ['InName', 'InAlias', 'InSummary', 'InUsage', 'InBest']);
});

test('the related field is indexed but not scored', () => {
  const ranker = createRanker([doc('Modal', { related: 'Use SectionMessage or Flag instead.' }), doc('Flag', { name: 'Flag' })]);
  assert.deepEqual(ranker.score('section message').map((r) => r.id), []);
  assert.equal(WEIGHTS.related, 0);
});

test('a rare word weighs more than a common one', () => {
  const ranker = createRanker([
    doc('Rare', { summary: 'Shows a timeline.' }),
    doc('Common', { summary: 'Shows a list.' }),
    doc('B', { summary: 'A list.' }),
    doc('C', { summary: 'A list.' }),
  ]);
  const [first] = ranker.score('timeline list');
  assert.equal(first.id, 'Rare');
  const one = (q) => ranker.score(q).find((r) => r.id === 'Rare' || r.id === 'Common').score;
  assert.ok(one('timeline') > one('list'));
});

test('score returns only matching ids, best first, ties by id', () => {
  const ranker = createRanker([doc('B', { summary: 'table' }), doc('A', { summary: 'table' }), doc('C', { summary: 'chart' })]);
  assert.deepEqual(ranker.score('table').map((r) => r.id), ['A', 'B']);
  assert.deepEqual(ranker.score(''), []);
  assert.deepEqual(ranker.score('xyzzy'), []);
});

test('weights can be overridden per ranker', () => {
  const docs = [doc('Name', { name: 'Grid' }), doc('Usage', { usage: 'grid grid grid grid' })];
  assert.equal(createRanker(docs).score('grid')[0].id, 'Name');
  assert.equal(createRanker(docs, { name: 0 }).score('grid')[0].id, 'Usage');
});

test('a longer alias list is not a weaker match: the alias field is not length-normalized', () => {
  const ranker = createRanker([
    doc('Few', { aliases: ['slider'] }),
    doc('Many', { aliases: ['slider', 'range control', 'value picker', 'scrubber'] }),
  ]);
  const [a, b] = ranker.score('slider');
  assert.equal(a.score, b.score);
  const prose = createRanker([doc('Few', { usage: 'slider' }), doc('Many', { usage: 'slider with range control and value picker and scrubber' })]);
  assert.equal(prose.score('slider')[0].id, 'Few');
});
