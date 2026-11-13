/**
 * Every assertion in `check:docs-landing`, watched failing.
 *
 * Each red case hands the check a deliberately broken page or registry and
 * asserts the specific complaint; each has a green twin, so a check that simply
 * always failed would not pass this file. The last case runs the real tree.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { PAGES, REGISTRY, checkPage, checkRegistry, heroIds, run } from './check-docs-landing.mjs';

const COLOR = 'design-system/src/styles/Colors.mdx';
const landing = (id = 'foundations-color') =>
  `<Meta of={S} />\n\n<DocsLanding\n    page="${id}"\n    eyebrow="Foundation"\n    title="Color"\n    purpose="One line."\n/>\n`;

test('a page with a landing whose id has a hero is silent: the green twin', () => {
  assert.deepEqual(checkPage({ file: COLOR, source: landing(), id: 'foundations-color', heroes: ['foundations-color'] }), []);
});

test('a page with no landing fails', () => {
  const found = checkPage({
    file: COLOR,
    source: '<Meta of={S} />\n\n<FoundationHero title="Color" summary="x" />\n',
    id: 'foundations-color',
    heroes: ['foundations-color'],
  });
  assert.ok(found.some((m) => /has no <DocsLanding>/.test(m)), found.join('\n'));
});

test('a landing naming a different page than the file is caught', () => {
  const found = checkPage({ file: COLOR, source: landing('foundations-border'), id: 'foundations-color', heroes: ['foundations-color', 'foundations-border'] });
  assert.ok(found.some((m) => /page="foundations-border".*foundations-color/.test(m)), found.join('\n'));
});

test('a page whose id has no hero in the registry fails', () => {
  const found = checkPage({ file: COLOR, source: landing(), id: 'foundations-color', heroes: [] });
  assert.ok(found.some((m) => /no hero in the registry/.test(m)), found.join('\n'));
});

test('the old opener left beside the landing is caught', () => {
  const found = checkPage({ file: COLOR, source: `${landing()}\n<FoundationHero title="Color" summary="x" />\n`, id: 'foundations-color', heroes: ['foundations-color'] });
  assert.ok(found.some((m) => /FoundationHero/.test(m)), found.join('\n'));
});

test('a registry naming a page the check does not cover fails', () => {
  const found = checkRegistry({ heroes: ['foundations-color', 'foundations-ghost'], pages: [{ id: 'foundations-color' }] });
  assert.ok(found.some((m) => /foundations-ghost/.test(m)), found.join('\n'));
  assert.deepEqual(checkRegistry({ heroes: ['foundations-color'], pages: [{ id: 'foundations-color' }] }), []);
});

test('heroIds reads the registry keys and nothing else', () => {
  const src = "export const HEROES = {\n  'foundations-color': { Hero: A, description: 'x' },\n  'foundations-border': { Hero: B, description: 'y' },\n};\nconst other = { 'not-a-hero': 1 };\n";
  assert.deepEqual(heroIds(src), ['foundations-color', 'foundations-border']);
});

test('a hero with no description fails', () => {
  const src = "export const HEROES = {\n  'foundations-color': { Hero: A },\n};\n";
  const found = checkRegistry({ heroes: heroIds(src), pages: [{ id: 'foundations-color' }], source: src });
  assert.ok(found.some((m) => /no description/.test(m)), found.join('\n'));
});

test('the real tree passes, and covers Color, the 12 other Foundations pages, the 6 Motion pages, the 5 Sound pages, all 14 Patterns pages and all 10 Templates pages', () => {
  const ids = PAGES.map((p) => p.id);
  assert.equal(ids.filter((id) => id.startsWith('patterns-')).length, 14);
  assert.equal(ids.filter((id) => id.startsWith('templates-')).length, 10);
  assert.equal(ids.filter((id) => id.startsWith('foundations-')).length, 24);
  assert.equal(ids.filter((id) => id.startsWith('foundations-motion-')).length, 6);
  assert.equal(ids.filter((id) => id.startsWith('foundations-sound-')).length, 5);
  assert.ok(ids.includes('foundations-color'));
  assert.ok(REGISTRY.endsWith('hero-registry.jsx'));
  assert.deepEqual(run(), []);
});

test('a Patterns page still opening with <Title> fails', () => {
  const source = "<DocsLanding page=\"patterns-states-empty\" />\n<Title>Empty</Title>\n";
  const found = checkPage({ file: 'Empty.mdx', source, id: 'patterns-states-empty', heroes: ['patterns-states-empty'] });
  assert.ok(found.some((m) => /<Title>/.test(m)), found.join('\n'));
});

test('a landing page with a body Contents block fails; without one it is silent', () => {
  const heroes = ['foundations-color'];
  for (const block of ['<FoundationContents />', '<Contents />', '<nav aria-label="Contents">x</nav>', '## Contents']) {
    const found = checkPage({ file: COLOR, source: `${landing()}\n${block}\n`, id: 'foundations-color', heroes });
    assert.ok(found.some((m) => /body Contents block/.test(m)), `${block}: ${found.join('\n')}`);
  }
  assert.deepEqual(checkPage({ file: COLOR, source: `${landing()}\nThe right rail lists the contents.\n`, id: 'foundations-color', heroes }), []);
});

test('an overview card naming a hero the registry lacks fails', () => {
  const source = `${landing('templates-overview')}\n<TypeCard hero="templates-ghost" title="Ghost" />\n<TypeCard hero="templates-overview" title="Real" />\n`;
  const found = checkPage({ file: 'Overview.mdx', source, id: 'templates-overview', heroes: ['templates-overview'] });
  assert.equal(found.length, 1, found.join('\n'));
  assert.match(found[0], /hero="templates-ghost"/);
});
