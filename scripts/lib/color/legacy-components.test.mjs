import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import {
  COMPONENTS_ROOT,
  PROTOTYPES_ROOT,
  SPECS_ROOT,
  componentOf,
  legacyComponents,
  legacyEntries,
  legacyFiles,
} from './legacy-components.mjs';

test('a folder component and a flat file component are keyed by name', () => {
  assert.equal(componentOf(`${COMPONENTS_ROOT}/navigation/Breadcrumb/Breadcrumb.scss`), 'navigation/Breadcrumb');
  assert.equal(componentOf(`${COMPONENTS_ROOT}/navigation/Breadcrumb/parts/Item.jsx`), 'navigation/Breadcrumb');
  assert.equal(componentOf(`${COMPONENTS_ROOT}/forms-and-inputs/Checkbox/Checkbox.stories.jsx`), 'forms-and-inputs/Checkbox');
  assert.equal(componentOf(`${COMPONENTS_ROOT}/index.js`), null);
});

test('counts legacy color uses, skips spacing names and tests, sorts by uses', () => {
  const root = mkdtempSync(join(tmpdir(), 'legacy-components-'));
  const put = (rel, text) => {
    const abs = join(root, COMPONENTS_ROOT, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  };
  put('loading/Spinner.scss', '.a { color: var(--color-primary); padding: var(--surface-pad-md); }');
  put('labels/Badge/Badge.scss', '.b { color: var(--color-on-surface); border: 1px solid var(--color-outline-variant); box-shadow: var(--elevation-light-1); }');
  put('labels/Badge/Badge.test.jsx', "expect('var(--color-danger)')");
  put('labels/Clean/Clean.scss', '.c { color: var(--ds-text); }');

  assert.deepEqual(legacyComponents({ root }), [
    { component: 'labels/Badge', uses: 3, names: ['--color-on-surface', '--color-outline-variant', '--elevation-light-1'] },
    { component: 'loading/Spinner', uses: 1, names: ['--color-primary'] },
  ]);
});

test('legacyFiles tracks specs and prototypes one row per file, prefixed by label', () => {
  const root = mkdtempSync(join(tmpdir(), 'legacy-files-'));
  const put = (treeRoot, rel, text) => {
    const abs = join(root, treeRoot, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  };
  put(SPECS_ROOT, 'Home/Cards/EventCard.jsx', '.a { color: var(--color-on-surface); border: 1px solid var(--color-outline); }');
  put(SPECS_ROOT, 'Home/Cards/EventCard.test.jsx', "expect('var(--color-danger)')");
  put(PROTOTYPES_ROOT, 'live-app/src/App.css', '.b { color: var(--color-primary); }');

  assert.deepEqual(legacyFiles(SPECS_ROOT, 'specs', { root }), [
    { component: 'specs/Home/Cards/EventCard.jsx', uses: 2, names: ['--color-on-surface', '--color-outline'] },
  ]);
  assert.deepEqual(legacyFiles(PROTOTYPES_ROOT, 'prototypes', { root }), [
    { component: 'prototypes/live-app/src/App.css', uses: 1, names: ['--color-primary'] },
  ]);
  assert.deepEqual(
    legacyEntries({ root }).map((r) => r.component),
    ['specs/Home/Cards/EventCard.jsx', 'prototypes/live-app/src/App.css'],
  );
});
