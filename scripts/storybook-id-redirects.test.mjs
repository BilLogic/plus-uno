import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { PAGES } from './check-docs-landing.mjs';

const toml = fs.readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const rules = [...toml.matchAll(/from = "\/storybook\/"\n\s+query = \{ path = "\/docs\/([a-z0-9-]+)--docs" \}\n\s+to = "\/storybook\/\?path=\/docs\/([a-z0-9-]+)--docs(#[a-z0-9-]+)?"/g)].map(
  (m) => ({ from: m[1], to: m[2], anchor: m[3] }),
);
const ids = new Set(PAGES.map((p) => p.id));

test('the renamed and folded docs ids each redirect to a live page', () => {
  assert.equal(rules.length, 39);
  for (const r of rules) {
    assert.ok(!ids.has(r.from), `${r.from} is a live page and should not redirect`);
    assert.ok(ids.has(r.to), `${r.from} redirects to ${r.to}, which is not a page`);
  }
});

test('every pre-regroup Foundations id lands on its page in the new groups', () => {
  const to = Object.fromEntries(rules.map((r) => [r.from, r.to]));
  const expected = {
    'foundations-basics-overview': 'foundations-overview',
    'foundations-basics-tokens': 'foundations-tokens',
    'foundations-basics-accessibility': 'foundations-accessibility',
    'foundations-motion-principles': 'foundations-expression-motion-principles',
    'foundations-motion-library': 'foundations-expression-motion-library',
    'foundations-sound-overview': 'foundations-expression-sound-overview',
    'foundations-sound-settings-and-accessibility': 'foundations-expression-sound-settings-and-accessibility',
    'foundations-color': 'foundations-visual-color',
  };
  for (const [from, target] of Object.entries(expected)) {
    assert.equal(to[from], target, `${from} should redirect to ${target}`);
    assert.ok(ids.has(target), `${target} is not a page`);
  }
});

test('a folded page lands on its parent section, a renamed page on the page', () => {
  const folded = rules.filter((r) => r.anchor);
  assert.deepEqual(folded.map((r) => r.from).sort(), [
    'templates-modal-backdrop',
    'templates-page-heading-outline',
    'templates-templates-and-patterns',
  ]);
});

test('the id rules sit before the catch-all /storybook/* rule', () => {
  assert.ok(toml.lastIndexOf('query = { path') < toml.indexOf('from = "/storybook/*"'));
});

test('the retired Get started > Content design id lands on Voice and tone', () => {
  const rule = rules.find((r) => r.from === 'get-started-content-design');
  assert.equal(rule?.to, 'foundations-brand-content-voice-and-tone');
  assert.ok(ids.has('foundations-brand-content-voice-and-tone'));
});
