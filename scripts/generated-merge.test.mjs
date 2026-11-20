/**
 * Two branches that each change a different component's docs merge without a
 * conflict in the generated lookup files. Each case writes the base text and the
 * two branch texts the generators produce, then merges them with git's own
 * three-way file merge, the algorithm a pull request's merge uses.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { REPO_ROOT } from './lib/corpus.mjs';
import { parseDsIndex, serializeDsIndex } from './lib/ds-lookup.mjs';
import { renderDsFacts } from '../agents/uno-bot/scripts/generate-ds-facts.mjs';

function threeWay(base, ours, theirs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-'));
  try {
    const [b, o, t] = ['base', 'ours', 'theirs'].map((name) => path.join(dir, name));
    fs.writeFileSync(b, base);
    fs.writeFileSync(o, ours);
    fs.writeFileSync(t, theirs);
    const merged = spawnSync('git', ['merge-file', '-p', o, b, t], { encoding: 'utf8' });
    return { conflicts: merged.status, text: merged.stdout };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const doc = (title, ...paragraphs) => `# ${title}\n\n${paragraphs.join('\n\n')}\n`;

function fixtureIndex(overrides = {}) {
  const entry = (name) => ({
    name,
    summary: `${name}: a summary.`,
    props: [{ name: 'size', description: 'How big.' }],
    text: doc(name, 'First paragraph.', 'Second paragraph.', 'Third paragraph.'),
  });
  const names = ['Accordion', 'Avatar', 'Button', 'Card'];
  return {
    entries: names.map((n) => overrides[n] ?? entry(n)),
    guides: Object.fromEntries(names.map((n) => [`patterns/${n}.md`, doc(n, 'One.', 'Two.', 'Three.')])),
  };
}

test('the committed index reads back as the index the builder produced', () => {
  const index = fixtureIndex();
  assert.deepEqual(parseDsIndex(serializeDsIndex(index)), index);
  assert.equal(serializeDsIndex(index), serializeDsIndex(parseDsIndex(serializeDsIndex(index))));
});

test('the committed index writes every multi-line string one line per line', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, 'design-system/agent-views/ds-index.json'), 'utf8');
  assert.ok(text.includes('"$lines"'), 'multi-line strings are written as $lines arrays');
  const longest = Math.max(...text.split('\n').map((line) => line.length));
  assert.ok(longest < 20_000, `no single line holds a whole page (longest is ${longest} characters)`);
});

test('two branches that edit different components docs merge cleanly in ds-index.json', () => {
  const base = serializeDsIndex(fixtureIndex());
  const edit = (name, paragraph) =>
    fixtureIndex({
      [name]: {
        name,
        summary: `${name}: a summary.`,
        props: [{ name: 'size', description: 'How big.' }],
        text: doc(name, 'First paragraph.', paragraph, 'Third paragraph.'),
      },
    });
  const ours = serializeDsIndex(edit('Accordion', 'Second paragraph, changed on one branch.'));
  const theirs = serializeDsIndex(edit('Card', 'Second paragraph, changed on the other.'));
  const { conflicts, text } = threeWay(base, ours, theirs);
  assert.equal(conflicts, 0);
  assert.ok(text.includes('changed on one branch.') && text.includes('changed on the other.'));
});

test('two branches that edit different paragraphs of the same page merge cleanly in ds-index.json', () => {
  const page = (first, third) => doc('Navigation', first, 'Second paragraph.', 'Fourth.', 'Fifth.', third);
  const index = (first, third) => ({ entries: [], guides: { 'patterns/Navigation.md': page(first, third) } });
  const base = serializeDsIndex(index('First.', 'Third.'));
  const { conflicts } = threeWay(base, serializeDsIndex(index('First, edited.', 'Third.')), serializeDsIndex(index('First.', 'Third, edited.')));
  assert.equal(conflicts, 0);
});

const baked = (changes = {}) => ({
  components: [
    { name: 'Accordion', summary: 'Stacked headings.' },
    { name: 'Avatar', summary: 'A person.' },
    { name: 'Button', summary: 'Triggers an action.' },
  ].map((c) => ({ ...c, ...(changes[c.name] ?? {}) })),
  barrels: { '@/components': ['Accordion', 'Avatar', 'Button'], '@/patterns': ['Frame'] },
  tokenGroups: ['Ladder', 'Space'],
  tokens: [
    ['--a', 'semantic', 0, 'x', null],
    ['--b', 'semantic', 0, 'y', null],
    ['--c', 'primitive', 1, 'z', null],
  ],
  inventions: { components: [], props: [], tokens: [] },
  retired: ['--old'],
});

test('two branches that change different components merge cleanly in ds-facts.ts', () => {
  const base = renderDsFacts(baked());
  const ours = renderDsFacts(baked({ Accordion: { summary: 'Stacked headings that open.' } }));
  const theirs = renderDsFacts(baked({ Button: { summary: 'Triggers one action.' } }));
  const { conflicts, text } = threeWay(base, ours, theirs);
  assert.equal(conflicts, 0);
  assert.ok(text.includes('Stacked headings that open.') && text.includes('Triggers one action.'));
});

test('ds-facts.ts is still the same value, only laid out one record per line', () => {
  const text = renderDsFacts(baked());
  const literal = text.slice(text.indexOf('= {') + 2, text.lastIndexOf('};') + 1);
  assert.deepEqual(JSON.parse(literal), baked());
});

test('two edits to different components of the committed ds-facts.ts merge cleanly', () => {
  const base = fs.readFileSync(path.join(REPO_ROOT, 'agents/uno-bot/src/generated/ds-facts.ts'), 'utf8');
  const rows = base.split('\n');
  const touch = (name, mark) => rows.map((row) => (row.startsWith(`{"name":"${name}",`) ? row.replace(/"summary":"/, `"summary":"${mark} `) : row)).join('\n');
  const { conflicts, text } = threeWay(base, touch('Accordion', 'A.'), touch('Button', 'B.'));
  assert.equal(conflicts, 0);
  assert.ok(text.includes('"summary":"A. ') && text.includes('"summary":"B. '));
});
