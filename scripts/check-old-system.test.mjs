// The old-system ban, through its interface: given these files, it fails or passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './check-old-system.mjs';

const src = (path, text) => ({ path, text });
/** An old color token, assembled so this file does not itself carry the name. */
const oldColor = (role) => `--${'color'}-${role}`;
const findings = (...sources) => run({ sources });

test('an old color token fails anywhere outside specs/', () => {
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

test('inside specs/ the old system is allowed until the specs revamp', () => {
  assert.deepEqual(findings(src('design-system/src/specs/pages/Home.scss', `a { color: var(${oldColor('primary')}); }`)), []);
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

test('the token files that still declare the old names pass until they move into specs/', () => {
  const css = `:root {\n  ${oldColor('primary')}: #0b7b8b;\n}\n`;
  assert.deepEqual(findings(src('design-system/src/tokens/_colors.scss', css)), []);
  assert.equal(findings(src('design-system/src/tokens/_type.scss', css)).length, 1, 'only the named files');
});

test('the old elevation and surface roles fail outside specs/; the --ds- surfaces and shadows pass', () => {
  const old = (name) => `--${name}`;
  const css = `.a { box-shadow: var(${old('elevation-light-4')}); }\n.b { background: var(${old('surface-raised')}); }\n`;
  const found = findings(src('prototypes/x/x.scss', css));
  assert.equal(found.length, 1);
  assert.match(found[0].message, /2 x elevation/);
  assert.deepEqual(findings(src('prototypes/x/x.scss', '.a { background: var(--ds-surface-raised); box-shadow: var(--ds-shadow-raised); }')), []);
  assert.deepEqual(findings(src('design-system/src/specs/x.scss', css)), []);
});
