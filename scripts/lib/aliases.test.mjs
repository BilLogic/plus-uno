import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadFacts } from './ds-facts.mjs';
import { createLookup, render } from './ds-lookup.mjs';

// _aliases.json holds the words a component is asked by that its name does not
// say. These tests hold its shape; what earns a row is the rule in its $about.

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AGENT_ROOT = path.join(REPO_ROOT, 'design-system/agent-views');
const read = (name) => JSON.parse(fs.readFileSync(path.join(AGENT_ROOT, name), 'utf8'));

const aliases = read('_aliases.json');
const names = read('components.json').components.map((c) => c.name);
const notHere = read('_inventions.json').components.map((r) => r.not.replace(/\s*\(.*$/, ''));
const squash = (s) => s.toLowerCase().replace(/[\s-]+/g, '');

test('every alias key is a component or pattern in components.json', () => {
  assert.deepEqual(Object.keys(aliases.components).filter((k) => !names.includes(k)), []);
});

test('no alias key is a not-here name', () => {
  assert.deepEqual(Object.keys(aliases.components).filter((k) => notHere.includes(k)), []);
});

test('no alias is an existing or a not-here name, in any case or spacing', () => {
  const taken = new Set([...names, ...notHere].map(squash));
  const clashes = Object.entries(aliases.components).flatMap(([k, list]) => list.filter((a) => taken.has(squash(a))).map((a) => `${k}: ${a}`));
  assert.deepEqual(clashes, []);
});

test('every row is a non-empty array of distinct lowercase strings', () => {
  for (const [k, list] of Object.entries(aliases.components)) {
    assert.ok(Array.isArray(list) && list.length > 0, `${k}: empty`);
    for (const a of list) assert.ok(typeof a === 'string' && a.trim() === a && a === a.toLowerCase() && a.length > 0, `${k}: "${a}" is not a trimmed lowercase string`);
    assert.equal(new Set(list).size, list.length, `${k}: repeats an alias`);
  }
});

test('the $about line states the rule a row is reviewed against', () => {
  assert.match(aliases.$about, /benchmark/);
  assert.match(aliases.$about, /_inventions\.json/);
});

test('the facts module carries a component its aliases, hand-kept first then the glossary\'s, and an empty list otherwise', () => {
  const facts = loadFacts(REPO_ROOT);
  const [key, list] = Object.entries(aliases.components)[0];
  assert.deepEqual(facts.lookup(key).aliases, [...list, ...(facts.vocabulary.aliases[key] ?? [])]);
  const bare = names.find((n) => !aliases.components[n] && !facts.vocabulary.aliases[n]);
  assert.deepEqual(facts.lookup(bare).aliases, []);
  assert.deepEqual(facts.lookup('NoSuchThing').aliases, []);
});

test('find leads with the component for each of its aliases, and not on the no-aliases arm', () => {
  const lookup = createLookup(REPO_ROOT);
  const owners = {};
  for (const [k, list] of Object.entries(aliases.components)) for (const a of list) (owners[a] ??= []).push(k);
  const wrong = Object.entries(owners).filter(([a, ks]) => !ks.includes(lookup.find(a).results[0]?.name)).map(([a, ks]) => `${a} → ${ks.join('|')}`);
  assert.deepEqual(wrong, []);
  const bare = createLookup(REPO_ROOT, { aliases: false });
  const only = Object.entries(aliases.components).flatMap(([k, list]) => list.filter((a) => !bare.find(a).results.some((r) => r.name === k)));
  assert.ok(only.length > 0, 'some alias reaches its component only through the alias field');
});

test('get prints the aliases under the summary', () => {
  const lookup = createLookup(REPO_ROOT);
  const [key, list] = Object.entries(aliases.components)[0];
  const record = lookup.get(key).records[0];
  assert.deepEqual(record.aliases.slice(0, list.length), list);
  const text = render('get', lookup.get(key));
  assert.match(text, new RegExp(`Also asked as: ${list[0]}`));
});
