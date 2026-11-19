import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkInventions, renderInventions, renderSelfCheck } from './inventions.mjs';

const AGENT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../design-system/agent-views');
const read = (name) => JSON.parse(fs.readFileSync(path.join(AGENT_ROOT, name), 'utf8'));

test('every "use instead" target in _inventions.json exists in components.json or tokens.json', () => {
  assert.deepEqual(checkInventions(read('_inventions.json'), read('components.json'), read('tokens.json'), read('_templates.json').templates.map((r) => r.name)), []);
});

test('checkInventions names a missing component, prop, value or token', () => {
  const components = { components: [{ name: 'Button', props: [{ name: 'appearance', values: ['default'] }] }] };
  const tokens = { tokens: [{ name: '--stack-md' }] };
  const inventions = {
    components: [{ not: 'Btn', use: ['Buttons'] }],
    props: [{ not: 'x', use: ['Button.variant', 'Button.appearance=loud', 'Button.appearance=default'] }],
    tokens: [{ not: 'y', use: ['--stack-md', '--stack-xl'] }],
  };
  assert.deepEqual(checkInventions(inventions, components, tokens), [
    'Btn: Buttons is not in components.json',
    'x: Button has no prop variant',
    'x: Button.appearance does not accept loud',
    'y: --stack-xl is not in tokens.json',
  ]);
});

test('the header renders a table per kind with the right-hand names, and the self-check ends on the checker', () => {
  const md = renderInventions({
    components: [{ not: 'Toast', use: ['Flag'], why: 'renamed' }],
    props: [{ not: 'Button variant', use: ['Button.appearance', 'Button.appearance=default'] }],
    tokens: [{ not: '--space-050 (8px)', use: ['--stack-md'] }],
  });
  assert.match(md, /\| `Toast` \| `Flag` \(renamed\) \|/);
  assert.match(md, /\| `Button variant` \| `appearance`, `appearance="default"` \|/);
  assert.match(md, /\| `--space-050 \(8px\)` \| `--stack-md` \|/);
  assert.match(renderSelfCheck(), /npm run check:ds-usage/);
});

test('renderSelfCheck keeps one fit re-read and drops items that restate the checker', () => {
  const selfCheck = renderSelfCheck();
  assert.match(selfCheck, /## Before you finish/);
  assert.match(selfCheck, /template/i);
  assert.match(selfCheck, /pattern/i);
  assert.doesNotMatch(selfCheck, /1\. Every component/);
  assert.doesNotMatch(selfCheck, /2\. Every prop/);
  assert.doesNotMatch(selfCheck, /3\. Every color/);
  assert.doesNotMatch(selfCheck, /4\. Every name/);
});

test('coded-build.md and method.md use the staged build, ds lookup, one Template check-in, reuse ladder, and one exit ds check', () => {
  const repoRoot = path.resolve(AGENT_ROOT, '../..');
  const codedBuild = fs.readFileSync(path.join(repoRoot, 'skills/uno-prototype/references/deliverables/coded-build.md'), 'utf8');
  const method = fs.readFileSync(path.join(repoRoot, 'skills/uno-prototype/references/method.md'), 'utf8');

  assert.match(codedBuild, /design-system\/guidelines\/overview\.md/);
  assert.match(codedBuild, /ds find.*ds get.*ds tokens/);
  assert.match(codedBuild, /One human check-in after the Template stage/i);
  assert.match(codedBuild, /post-edit hook/i);
  assert.match(codedBuild, /ds -- check|ds check/);
  assert.doesNotMatch(codedBuild, /components\.json/);
  assert.doesNotMatch(codedBuild, /tokens\.json/);
  assert.doesNotMatch(codedBuild, /Retrieval proof/i);
  assert.doesNotMatch(codedBuild, /max 3 attempts/i);
  assert.doesNotMatch(codedBuild, /run-review-checks\.sh/);
  assert.doesNotMatch(codedBuild, /STAGES\.md/);

  assert.match(method, /Reuse ladder/);
  assert.match(method, /1\. \*\*Use\.\*\*/);
  assert.match(method, /2\. \*\*Arrange\.\*\*/);
  assert.match(method, /3\. \*\*Local component\.\*\*/);
  assert.match(method, /4\. \*\*Core candidate\.\*\*/);
  assert.doesNotMatch(method, /retrieval proof/i);
  assert.doesNotMatch(method, /Zero hand-rolled lookalikes/);
});


