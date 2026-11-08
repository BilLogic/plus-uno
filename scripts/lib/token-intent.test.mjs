import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TOKEN_LADDER } from './tokens/plan.mjs';
import { auditIntent, colorIntents, plannedIntents, toPlusTerms } from './token-intent.mjs';

test('every ladder row is planned and carries its use line', () => {
  const planned = plannedIntents();
  for (const row of TOKEN_LADDER) {
    assert.ok(planned.has(row.new), row.new);
    assert.ok(planned.get(row.new), `${row.new} has no use line in plan.mjs`);
  }
});

test('every --ds- semantic, shadow and opacity token has a color intent', () => {
  const color = colorIntents();
  for (const name of ['--ds-text', '--ds-background-brand-bold', '--ds-border-focused', '--ds-shadow-raised', '--ds-opacity-disabled']) {
    assert.ok(color.get(name), name);
  }
  assert.ok(color.size > 500);
});

test('color intents speak PLUS words only', () => {
  const foreign = /Atlassian|Jira|Kanban|lozenge|badge|toast|pill|chip|Editor block|dialog|popover|visualis|statues|they UI|Surface pattern|\bcolor\.[a-z]/i;
  for (const [name, intent] of colorIntents()) {
    assert.doesNotMatch(intent, foreign, `${name}: ${intent}`);
  }
});

test('toPlusTerms renames product words and dotted token names', () => {
  assert.equal(toPlusTerms('Hovered state of color.background.accent.lime.subtlest.'), 'Hovered state of --ds-background-accent-lime-subtlest.');
  assert.equal(toPlusTerms('Backgrounds of danger lozenges and badges to ensure accessibility'), 'Backgrounds of danger status tags and count tags to ensure accessibility');
  assert.equal(toPlusTerms('For data visualisation only'), 'For data visualization only');
  assert.equal(toPlusTerms('Box shadow of a raised card. Pair with elevation.surface.raised.'), 'Box shadow of a raised card. Pair with --ds-surface-raised.');
});

const manifest = (tokens) => ({ tokens });

test('auditIntent fails a planned token with no intent and a primitive with an intent field', () => {
  const planned = new Map([['--pad-x-md', 'x'], ['--ds-text', 'y']]);
  const result = auditIntent(
    manifest([
      { name: '--pad-x-md', tier: 'semantic', group: 'Ladder Semantics', value: '1' },
      { name: '--ds-text', tier: 'semantic', group: 'Color', value: '#000', intent: 'Primary text.' },
      { name: '--space-100', tier: 'primitive', group: 'Scale Primitives', value: '1rem', intent: null },
      { name: '--legacy', tier: 'semantic', group: 'Legacy Color Tokens', value: '#fff' },
    ]),
    planned,
  );
  assert.deepEqual(result.missing, ['--pad-x-md']);
  assert.deepEqual(result.primitivesWithIntent, ['--space-100']);
  assert.deepEqual(result.notPlanned, { 'Legacy Color Tokens': 1 });
  assert.equal(result.withIntent, 1);
});

test('auditIntent passes a manifest whose planned tokens all carry intent', () => {
  const result = auditIntent(manifest([{ name: '--pad-x-md', tier: 'semantic', group: 'G', value: '1', intent: 'Pad.' }]), new Map([['--pad-x-md', 'Pad.']]));
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.primitivesWithIntent, []);
});
