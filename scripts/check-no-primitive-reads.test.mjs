import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isPrimitive, measure, SEARCH_ROOTS, run } from './check-no-primitive-reads.mjs';

test('numbered space, radius, size, stroke, height, width and type-size steps, and palette colors, are primitives', () => {
  for (const name of ['--space-050', '--space-025', '--size-200', '--stroke-2', '--height-250', '--width-1000', '--type-size-0875', '--palette-blue-500']) {
    assert.ok(isPrimitive(name), name);
  }
});

test('tier tokens and --radius-full are not primitives', () => {
  for (const name of ['--pad-x-md', '--checkbox-control-size', '--radius-full', '--radius-control-md', '--space-pad']) {
    assert.ok(!isPrimitive(name), name);
  }
});

test('counts primitive reads per file, with the first line', () => {
  const found = measure([
    { path: 'a.scss', text: '.a { color: red; }\n.b { gap: var(--space-050); padding: var(--space-025) var(--pad-x-md); }' },
  ]);
  assert.deepEqual(found.get('a.scss'), { count: 2, line: 2 });
});

test('a fallback after the primitive still counts as a read', () => {
  assert.equal(measure([{ path: 'a.scss', text: 'gap: var(--space-050, 8px);' }]).get('a.scss').count, 1);
});

test('a clean file and a test are absent', () => {
  const found = measure([
    { path: 'clean.scss', text: '.x { gap: var(--stack-md); }' },
    { path: 'A.test.jsx', text: 'var(--space-050)' },
  ]);
  assert.equal(found.size, 0);
});

test('the roots cover components, templates, storybook-docs and styles', () => {
  for (const root of ['design-system/src/components', 'design-system/src/templates', 'design-system/src/storybook-docs', 'design-system/src/styles']) {
    assert.ok(SEARCH_ROOTS.includes(root), root);
  }
});

test('a story counts a space or palette read', () => {
  const found = measure([
    { path: 'design-system/src/components/x/A.stories.jsx', text: "const s = { gap: 'var(--space-150)', color: 'var(--palette-blue-500)' };" },
  ]);
  assert.equal(found.get('design-system/src/components/x/A.stories.jsx').count, 2);
});

test('a docs file counts a space read', () => {
  const found = measure([
    { path: 'design-system/src/storybook-docs/fig.jsx', text: "gap: 'var(--space-100)'" },
    { path: 'design-system/src/styles/_grid.scss', text: '.a { pad: var(--space-150); }' },
  ]);
  assert.equal(found.size, 2);
});

test('a story reads no size, stroke, height, width or type-size primitive either', () => {
  for (const name of ['--size-5400', '--stroke-1', '--height-250', '--width-2500', '--type-size-100', '--palette-blue-500']) {
    const found = measure([{ path: 'a/A.stories.jsx', text: `maxWidth: 'var(${name})'` }]);
    assert.equal(found.get('a/A.stories.jsx')?.count, 1, name);
  }
});

test('a docs file reads no size, stroke, height or type-size primitive either', () => {
  for (const file of ['design-system/src/storybook-docs/x.css', 'design-system/src/styles/_x.scss']) {
    for (const name of ['--size-5400', '--stroke-2', '--height-500', '--type-size-0875']) {
      assert.equal(measure([{ path: file, text: `a: var(${name});` }]).get(file)?.count, 1, `${file} ${name}`);
    }
  }
});

test('the role tokens that replaced those reads are not primitives', () => {
  for (const name of ['--field-width-sm', '--body-lg', '--control-lg', '--page-border-width', '--select-check-size']) {
    assert.ok(!isPrimitive(name), name);
  }
});

test('a read in a story or docs file fails the check, with no baseline to hold it', () => {
  const findings = run({
    sources: [{ path: 'design-system/src/storybook-docs/fig.jsx', text: "gap: 'var(--space-100)'" }],
  });
  assert.ok(findings.some((f) => f.file === 'design-system/src/storybook-docs/fig.jsx'));
});

test('a literal demo frame is not a read, and a clean tree has no findings', () => {
  assert.deepEqual(
    run({ sources: [{ path: 'a/A.stories.jsx', text: "maxWidth: '864px' /* demo frame */" }] }),
    [],
  );
});

test('a file with a read fails even in a component that once sat in a baseline', () => {
  const findings = run({
    sources: [{ path: 'design-system/src/components/forms-and-inputs/_internal/FieldBox.scss', text: 'height: var(--height-250);' }],
  });
  assert.equal(findings.length, 1);
});
