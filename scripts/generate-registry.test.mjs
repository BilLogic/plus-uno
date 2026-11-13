// The registry generator's decisions, over a fixture tree: import rewriting, dependency
// resolution, and the refusal of internal, deprecated and retired parts (#2401).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { REPO_ROOT } from './lib/corpus.mjs';
import { generate } from './generate-registry.mjs';
import { expandBarrelImports, rewriteImports } from './lib/registry.mjs';

const L = 'design-system/src';
function fixture(extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-'));
  const files = {
    'package.json': '{"version":"2.3.4"}',
    'package-lock.json': JSON.stringify({ packages: { 'node_modules/clsx': { version: '2.1.1' }, 'node_modules/react': { version: '19.0.0' } } }),
    [`${L}/components/index.js`]: "export { default as Button } from '@/components/g/Button';\n",
    'design-system/agent-views/components/index.md': '- [Button](../../src/components/g/Button/index.md)\n- [Tag](../../src/components/g/Tag/index.md)\n',
    [`${L}/tokens/_t.scss`]: ':root { --a: 1; }\n',
    [`${L}/styles/main.scss`]: '@use "sass:meta";\n@include meta.load-css("../tokens/t");\n@include meta.load-css("../components/g/Button/Button");\n',
    [`${L}/lib/util.js`]: 'export const u = 1;\n',
    [`${L}/components/g/Button/index.js`]: "export { default } from './Button';\n",
    [`${L}/components/g/Button/Button.jsx`]: "import React from 'react';\nimport { clsx } from 'clsx';\nimport { u } from '@/lib/util';\nimport { Tag } from '@/components/g/Tag';\nimport './Button.scss';\nexport default () => u && clsx && Tag;\n",
    [`${L}/components/g/Button/Button.scss`]: '.b { color: red; }\n',
    [`${L}/components/g/Button/Button.stories.jsx`]: "import { Button } from '@/components';\n",
    [`${L}/components/g/Tag/index.js`]: "export * from './Tag';\n",
    [`${L}/components/g/Tag/Tag.jsx`]: "export const Tag = 1;\n",
    ...extra,
  };
  for (const [f, c] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), c);
  }
  return root;
}
const item = (items, n) => items.find((i) => i.name === n);

test('alias imports become relative paths under the target folder; relative ones stay', () => {
  const out = rewriteImports(`${L}/components/g/Button/Button.jsx`, "import a from '@/lib/util';\nimport './Button.scss';\nimport c from '../Tag';\n");
  assert.match(out, /from '\.\.\/\.\.\/\.\.\/lib\/util'/);
  assert.match(out, /import '\.\/Button\.scss'/);
  assert.match(out, /from '\.\.\/Tag'/);
});

test('a barrel import is split into one import per part', () => {
  const root = fixture({ [`${L}/components/index.js`]: "export { default as Button, BUTTONS } from '@/components/g/Button';\nexport { default as Tag } from '@/components/g/Tag';\n" });
  const out = expandBarrelImports(root, "import { Button, BUTTONS, Tag } from '@/components';");
  assert.equal(out, "import Button, { BUTTONS } from '@/components/g/Button';\nimport Tag from '@/components/g/Tag';");
});

test('a component item carries its files, takes the foundation and sibling items as dependencies, and npm versions from the lock', () => {
  const { items, problems } = generate(fixture(), 'v2.3.4');
  assert.deepEqual(problems, []);
  const button = item(items, 'Button');
  assert.deepEqual(button.dependencies, ['clsx@2.1.1']);
  assert.deepEqual(button.registryDependencies, ['Tag', 'foundation']);
  assert.deepEqual(button.files.map((f) => f.target), ['plus-ds/components/g/Button/Button.jsx', 'plus-ds/components/g/Button/Button.scss', 'plus-ds/components/g/Button/index.js']);
  assert.match(button.files.find((f) => f.path.endsWith('Button.jsx')).content, /from '\.\.\/\.\.\/\.\.\/lib\/util'/);
  assert.equal(button.meta.release, 'v2.3.4');
});

test('the foundation holds tokens, the stylesheet entry without component styles, and the helpers', () => {
  const { items } = generate(fixture(), 'v2.3.4');
  const f = item(items, 'foundation');
  assert.ok(f.files.some((x) => x.target === 'plus-ds/tokens/_t.scss'));
  assert.ok(f.files.some((x) => x.target === 'plus-ds/lib/util.js'));
  assert.ok(f.files.some((x) => x.target === 'plus-ds/head.html'));
  assert.doesNotMatch(f.files.find((x) => x.target === 'plus-ds/styles/main.scss').content, /components\//);
});

test('an internal part (story, test, docs chrome) is refused', () => {
  for (const spec of ['../Button/Button.stories', '@/storybook-docs/x']) {
    const root = fixture({ [`${L}/storybook-docs/x.js`]: 'export {};\n', [`${L}/components/g/Tag/Tag.jsx`]: `import x from '${spec}';\nexport const Tag = x;\n`, [`${L}/components/g/Tag/Tag.stories.jsx`]: 'export {};\n' });
    const { problems } = generate(root, 'v1');
    assert.ok(problems.some((p) => /Tag\.jsx: imports .* internal or retired part/.test(p)), `${spec}: ${problems}`);
  }
});

test('a deprecated or retired part is refused', () => {
  let root = fixture({ [`${L}/components/g/Tag/Tag.jsx`]: '/**\n * @deprecated use Chip\n */\nexport const Tag = 1;\n' });
  assert.ok(generate(root, 'v1').problems.some((p) => /Tag\.jsx: marked @deprecated/.test(p)));
  root = fixture({ [`${L}/components/g/retired/Old.jsx`]: 'export const Old = 1;\n', [`${L}/components/g/Tag/Tag.jsx`]: "import { Old } from '../retired/Old';\nexport const Tag = Old;\n" });
  assert.ok(generate(root, 'v1').problems.some((p) => /Tag\.jsx: imports \.\.\/retired\/Old/.test(p)));
});

test('an import outside the design system, or one that does not resolve, or a package the lock lacks, is refused', () => {
  const outside = fixture({ 'scripts/x.js': 'export {};\n', [`${L}/components/g/Tag/Tag.jsx`]: "import x from '../../../../../scripts/x';\nexport const Tag = x;\n" });
  assert.ok(generate(outside, 'v1').problems.some((p) => /outside the design system/.test(p)));
  const missing = fixture({ [`${L}/components/g/Tag/Tag.jsx`]: "import x from './Nope';\nexport const Tag = x;\n" });
  assert.ok(generate(missing, 'v1').problems.some((p) => /does not resolve/.test(p)));
  const pkg = fixture({ [`${L}/components/g/Tag/Tag.jsx`]: "import x from 'left-pad';\nexport const Tag = x;\n" });
  assert.throws(() => generate(pkg, 'v1'), /left-pad/);
});

test('check:registry passes on this repo', () => {
  const { problems } = generate(REPO_ROOT);
  assert.deepEqual(problems, []);
});

test('check:registry fails on an injected unshippable import', () => {
  const root = fixture({ [`${L}/components/g/Tag/Tag.jsx`]: "import x from '@/storybook-docs/x';\nexport const Tag = x;\n", [`${L}/storybook-docs/x.js`]: 'export {};\n' });
  // Run the real check script against the fixture by pointing it at the fixture's root.
  assert.throws(() => execFileSync('node', ['scripts/generate-registry.mjs', '--check'], { cwd: REPO_ROOT, env: { ...process.env, REGISTRY_ROOT: root }, stdio: 'pipe' }));
});
