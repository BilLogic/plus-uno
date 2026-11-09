// The old-system ban, through its interface: given these files, it fails or passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './check-old-system.mjs';

const src = (path, text) => ({ path, text });
/** An old color token, assembled so this file does not itself carry the name. */
const oldColor = (role) => `--${'color'}-${role}`;
const findings = (...sources) => run({ sources });

test('an old color token fails anywhere', () => {
  const css = `.a { color: var(${oldColor('primary')}); }\n.b { border: 1px solid var(${oldColor('outline-variant')}); }\n`;
  const found = findings(src('design-system/src/components/A/A.scss', css));
  assert.equal(found.length, 1, 'one finding per family and file');
  assert.equal(found[0].file, 'design-system/src/components/A/A.scss');
  assert.equal(found[0].line, 1, 'points at the first hit');
  assert.match(found[0].message, /2 x color/);
  assert.equal(findings(src('prototypes/x/App.jsx', `style={{ color: 'var(${oldColor('success')})' }}`)).length, 1);
  assert.equal(findings(src('src/pages/P.scss', `x: var(${oldColor('primary')}, #1a73e8);`)).length, 1, 'a fallback does not hide it');
});

test('a comment or doc naming an old token fails too: the code explains itself on the current system', () => {
  assert.equal(findings(src('design-system/src/lib/tokens.mjs', ` * e.g. \`${oldColor('primary-text')}\``)).length, 1);
  assert.equal(findings(src('design-system/src/components/A/A.mdx', `Use ${oldColor('primary')}.`)).length, 1);
  assert.equal(findings(src('prototypes/x/tokens.scss', `/* loads var(${oldColor('*')}) */`)).length, 1, 'the family by its wildcard');
});

test('the current tokens and lookalike names pass', () => {
  const css = [
    'a { color: var(--ds-text-brand); background: var(--ds-background-brand-bold); }',
    'b { --bs-link-color-rgb: 1; border-color: var(--ds-border); }',
    'c { --dropdown--color-x: 1; }',
  ].join('\n');
  assert.deepEqual(findings(src('design-system/src/components/A/A.scss', css)), []);
});

test("Tailwind's own --color-* theme namespace in the docs chrome is not the design system", () => {
  const css = `@theme inline {\n  ${oldColor('primary')}: var(--primary);\n}\n`;
  assert.deepEqual(findings(src('design-system/src/storybook-docs/storybook-tailwind.css', css)), []);
  assert.equal(findings(src('design-system/src/storybook-docs/Other.css', css)).length, 1, 'only that one file');
});

test('the token files that still declare the old names pass until the components move off them', () => {
  const css = `:root {\n  ${oldColor('primary')}: #0b7b8b;\n}\n`;
  assert.deepEqual(findings(src('design-system/src/tokens/_colors.scss', css)), []);
  assert.equal(findings(src('design-system/src/tokens/_type.scss', css)).length, 1, 'only the named files');
});

test('the old elevation and surface roles fail; the --ds- surfaces and shadows pass', () => {
  const old = (name) => `--${name}`;
  const css = `.a { box-shadow: var(${old('elevation-light-4')}); }\n.b { background: var(${old('surface-raised')}); }\n`;
  const found = findings(src('prototypes/x/x.scss', css));
  assert.equal(found.length, 1);
  assert.match(found[0].message, /2 x elevation/);
  assert.deepEqual(findings(src('prototypes/x/x.scss', '.a { background: var(--ds-surface-raised); box-shadow: var(--ds-shadow-raised); }')), []);
});

test('the old size and spacing names fail, the retired ladder names too; the current ones pass', () => {
  const old = (name) => `--${name}`;
  const css = [
    `.a { gap: var(${old('size-card-gap-md')}); padding: var(${old('size-spacing-medium-space-300')}); }`,
    `.b { width: var(${old('layout-width-sidebar')}); }`,
    `/* the ${old('size-media-*')} steps */`,
  ].join('\n');
  const found = findings(src('design-system/src/components/A/A.scss', css));
  assert.equal(found.length, 1);
  assert.match(found[0].message, /3 x size/);
  const current = '.a { gap: var(--card-stack-md); padding: var(--space-100); width: var(--size-300); border-radius: var(--radius-075); height: var(--icon-md); }';
  assert.deepEqual(findings(src('design-system/src/components/A/A.scss', current)), []);
});

test('the old type tokens and classes fail; the current text styles and steps pass', () => {
  const old = (name) => `--${name}`;
  const txt = (n) => `body${n}-${'txt'}`;
  const css = [
    `.a { font-size: var(${old('font-size-body2')}); font-weight: var(${old('font-weight-semibold-1')}); }`,
    `.b { font-size: var(${old('font-size-fa-h4-solid')}); }`,
    `.c${'.'}h4 { margin: 0; }`,
  ].join('\n');
  const jsx = `<p className="${txt(2)} mb-2">a</p>\n<h2 className="mb-0 ${'h'}4">b</h2>\n`;
  const found = findings(src('design-system/src/components/A/A.scss', css), src('prototypes/x/A.jsx', jsx));
  assert.equal(found.length, 2);
  assert.match(found.find((f) => f.file.endsWith('.scss')).message, /3 x type/);
  assert.match(found.find((f) => f.file.endsWith('.jsx')).message, /2 x type/);
  const current = [
    '.a { font: var(--body-default); font-size: var(--font-size-0875); font-weight: var(--type-weight-medium); }',
    '.b { font-size: var(--icon-lg); }',
    '<p className="body-default">a</p><h2 className="heading-large">b</h2><h4>c</h4>',
  ].join('\n');
  assert.deepEqual(findings(src('design-system/src/components/A/A.jsx', current)), []);
});
