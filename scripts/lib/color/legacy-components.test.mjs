import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { COMPONENTS_ROOT, componentOf, legacyComponents } from './legacy-components.mjs';

test('a folder component and a flat file component are keyed by name', () => {
  assert.equal(componentOf(`${COMPONENTS_ROOT}/navigation/Breadcrumb/Breadcrumb.scss`), 'navigation/Breadcrumb');
  assert.equal(componentOf(`${COMPONENTS_ROOT}/navigation/Breadcrumb/parts/Item.jsx`), 'navigation/Breadcrumb');
  assert.equal(componentOf(`${COMPONENTS_ROOT}/forms-and-inputs/Checkbox.stories.jsx`), 'forms-and-inputs/Checkbox');
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
