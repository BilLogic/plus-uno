// Retired names have one source: the Not-here table. Retiring a name is one
// edit there, and every list that bans or explains it agrees.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEGACY_COMPONENTS, RENAMED_NO_ALIAS, measure } from '../check-ads-language.mjs';
import { loadFacts } from './ds-facts.mjs';
import { renamedInProse, retiredComponents, tokenRowConflicts } from './inventions.mjs';
import { retiredRenames } from './tokens/plan.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inventions = () => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'design-system/agent-views/_inventions.json'), 'utf8'));

test('a row marked retired joins the language ban; an invented name does not', () => {
  const table = {
    components: [
      { not: 'Toast', use: ['Flag'], retired: true, inProse: true },
      { not: 'Navbar', use: ['PatternSidebar'], retired: true },
      { not: 'Dialog', use: ['Modal'] },
    ],
    props: [],
    tokens: [],
  };
  assert.deepEqual(retiredComponents(table), ['Toast', 'Navbar']);
  assert.deepEqual(renamedInProse(table), { Toast: 'Flag' });
});

test('the language ban is the Not-here table: every retired row is banned, and nothing else', () => {
  assert.deepEqual(LEGACY_COMPONENTS, retiredComponents(inventions()));
  assert.deepEqual(RENAMED_NO_ALIAS, renamedInProse(inventions()));
});

test('each banned name planted in the library is a finding', () => {
  for (const name of LEGACY_COMPONENTS) {
    const file = 'design-system/src/components/X/X.jsx';
    const found = measure([{ path: file, text: `<${name} />\n` }]);
    assert.equal(found.get(`component:${name} ${file}`)?.count, 1, name);
  }
  const doc = 'design-system/src/components/X/X.mdx';
  for (const [oldName] of Object.entries(RENAMED_NO_ALIAS)) {
    assert.equal(measure([{ path: doc, text: `the ${oldName} is gone\n` }]).get(`stale-name:${oldName} ${doc}`)?.count, 1, oldName);
  }
});

test('every token the plan retires is in Not-here with the plan replacement', () => {
  const rows = loadFacts(REPO_ROOT).notHere();
  for (const [old, replacement] of retiredRenames()) {
    assert.ok(rows.some((r) => r.not === old && r.kind === 'token' && r.use[0] === replacement), old);
  }
});

test('a hand-kept token row that covers retired names offers only what the plan maps them to', () => {
  assert.deepEqual(tokenRowConflicts(inventions(), retiredRenames()), []);
  const plan = new Map([['--element-pad-default', '--pad-x-md']]);
  const table = { components: [], props: [], tokens: [{ not: '--element-*', use: ['--pad-x-md', '--stack-xl'] }] };
  assert.deepEqual(tokenRowConflicts(table, plan), ['--element-*: --stack-xl is not what the plan maps any name it covers to']);
});
