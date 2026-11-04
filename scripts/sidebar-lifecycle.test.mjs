/**
 * The Storybook sidebar's lifecycle badges, its collapsed roots, and the preview
 * grounds: the pure halves, read from the same files the manager and preview
 * import, plus the token tables they resolve against.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  LIFECYCLE_TAGS,
  COLLAPSED_ROOTS,
  lifecycleOf,
  badgeRules,
} from '../.storybook/sidebar-lifecycle.js';
import { BACKGROUND_OPTIONS } from '../.storybook/backgrounds.js';
import { MANAGER_MODES, MANAGER_TOKENS, resolveManagerThemes } from './lib/manager-theme.mjs';
import { COLOR_SEMANTIC_FILE, COLOR_TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { documents, text } from './lib/corpus.mjs';

test('a lifecycle tag is read from an entry, deprecated outranking beta outranking new', () => {
  assert.equal(lifecycleOf(['autodocs', 'new']), 'new');
  assert.equal(lifecycleOf(['new', 'beta']), 'beta');
  assert.equal(lifecycleOf(['beta', 'deprecated', 'new']), 'deprecated');
});

test('an entry with no lifecycle tag has no badge', () => {
  assert.equal(lifecycleOf(['autodocs', '!dev']), null);
  assert.equal(lifecycleOf(undefined), null);
});

test('the three lifecycle tags are the vocabulary', () => {
  assert.deepEqual([...LIFECYCLE_TAGS].sort(), ['beta', 'deprecated', 'new']);
});

test('roots foundations, components, data-visualizations and specs start collapsed, by id', () => {
  assert.deepEqual(COLLAPSED_ROOTS, ['foundations', 'components', 'data-visualizations', 'specs']);
});

test('each badge is painted from tokens the manager theme resolves in every mode', () => {
  const rules = badgeRules(resolveManagerThemes()['light-no-preference'].vars);
  for (const tag of LIFECYCLE_TAGS) assert.match(rules, new RegExp(`data-lifecycle='${tag}'`));
  assert.doesNotMatch(rules, /undefined/);
  for (const mode of Object.keys(MANAGER_MODES)) {
    const vars = resolveManagerThemes()[mode].vars;
    for (const tag of LIFECYCLE_TAGS) assert.ok(vars[`--plus-manager-badge-${tag}-border`], `${mode} ${tag}`);
  }
  assert.ok(MANAGER_TOKENS.vars['--plus-manager-badge-text']);
});

test('preview backgrounds are surface tokens, defined in the semantic sheet, never literals', () => {
  const semantic = text(`${COLOR_TOKEN_DIR}/${COLOR_SEMANTIC_FILE}`);
  const values = Object.values(BACKGROUND_OPTIONS).map((o) => o.value);
  assert.ok(values.length >= 4);
  for (const value of values) {
    const m = /^var\((--ds-surface[\w-]*)\)$/.exec(value);
    assert.ok(m, `${value} is not a --ds-surface token`);
    assert.match(semantic, new RegExp(`^ {2}${m[1]}:`, 'm'), `${m[1]} is not defined`);
  }
});

test('a lifecycle tag written in a story is one of the three', () => {
  const stray = [];
  for (const file of documents('design-system/src', { ext: ['.stories.jsx'] })) {
    for (const [, body] of text(file).matchAll(/^\s*tags:\s*\[([^\]]*)\]/gm)) {
      const tags = [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      // Row data (a `tags` column of labels) is not story meta: meta lists dev/autodocs.
      if (!tags.some((t) => /^!?(dev|autodocs)$/.test(t))) continue;
      for (const tag of tags) {
        if (/^!?(dev|autodocs)$/.test(tag) || LIFECYCLE_TAGS.includes(tag)) continue;
        stray.push(`${file}: ${tag}`);
      }
    }
  }
  assert.deepEqual(stray, []);
});
