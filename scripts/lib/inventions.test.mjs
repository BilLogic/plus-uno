import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkInventions, renderInventions, renderSelfCheck } from './inventions.mjs';

const AGENT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../design-system/agent-views');
const read = (name) => JSON.parse(fs.readFileSync(path.join(AGENT_ROOT, name), 'utf8'));

test('every "use instead" target in _inventions.json exists in components.json or tokens.json', () => {
  assert.deepEqual(checkInventions(read('_inventions.json'), read('components.json'), read('tokens.json')), []);
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
  assert.match(md, /\| `Button variant` \| `Button appearance`, `Button appearance="default"` \|/);
  assert.match(md, /\| `--space-050 \(8px\)` \| `--stack-md` \|/);
  assert.match(renderSelfCheck(), /npm run check:ds-usage/);
});
