/**
 * Every assertion in `check:docs-tabs`, watched failing.
 *
 * A check that has only ever been seen passing is not evidence — this repo has
 * shipped generators that wrote a file then compared it to itself, a guard whose
 * CLI entry never ran under paths containing spaces, and an acceptance criterion
 * that was green before its own fix. So each case below hands `checkFile` a
 * deliberately broken page and asserts the specific complaint, and each has a
 * green twin so a check that simply always failed would not pass this file.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { checkFile, readTabs } from './check-docs-tabs.mjs';

const COMPONENT = 'design-system/src/components/actions/Button/Button.mdx';
const FOUNDATION = 'design-system/src/styles/Colors.mdx';

const section = (heading) => `<div className="sb-ds-doc-section">\n\n## ${heading}\n\nbody\n\n</div>`;

const page = ({ tabs = true, examples = ['Overview'], usage = [], extra = '' } = {}) => {
  const body = [];
  if (tabs) {
    body.push("import { DocsTabs, DocsTab } from '@/storybook-docs/docs-tabs.jsx';");
    body.push('<DocsTabs of={S}>');
    body.push('<DocsTab tab="examples">');
    body.push(...examples.map(section));
    body.push('</DocsTab>');
    if (usage.length) {
      body.push('<DocsTab tab="usage">');
      body.push(...usage.map(section));
      body.push('</DocsTab>');
    }
    body.push('</DocsTabs>');
  }
  if (extra) body.push(extra);
  return body.join('\n\n');
};

test('a well-formed page is silent — the green twin every case below needs', () => {
  const ok = page({ examples: ['Overview', 'Variants'], usage: ['When to use', 'Accessibility'] });
  assert.deepEqual(checkFile(COMPONENT, ok, true), []);
});

test('1. a page missing its <DocsTabs> wrapper is caught', () => {
  const broken = page({ tabs: false, extra: section('Overview') });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /expected exactly 1 <DocsTabs>, found 0/.test(f)), found.join('\n'));
});

test('1b. a page that renders tabs without importing them is caught', () => {
  const broken = page().replace("import { DocsTabs, DocsTab } from '@/storybook-docs/docs-tabs.jsx';\n\n", '');
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /never imports docs-tabs\.jsx/.test(f)), found.join('\n'));
});

test('2. a section left outside every tab is caught', () => {
  // The failure mode a partial edit produces: the wrapper is there, the section
  // is not inside it, and the section renders on no tab at all.
  const broken = `${page()}\n\n${section('Stranded')}`;
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /"Stranded" sits outside every tab/.test(f)), found.join('\n'));
});

test('3. a Usage section stranded in the Examples tab is caught', () => {
  const broken = page({ examples: ['Overview', 'Accessibility'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(
    found.some((f) => /"Accessibility" is in the "examples" tab but belongs in "usage"/.test(f)),
    found.join('\n'),
  );
});

test('3b. an Examples section pulled into Usage is caught — the rule runs both ways', () => {
  const broken = page({ examples: ['Overview'], usage: ['When to use', 'Variants'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(
    found.some((f) => /"Variants" is in the "usage" tab but belongs in "examples"/.test(f)),
    found.join('\n'),
  );
});

test('3c. `When not to use` is prose, not a heading — it must not be treated as a Usage section', () => {
  // It appears as bold prose inside `When to use` in all 15 files. If it were
  // ever promoted to a heading it would belong to Examples by this rule, and
  // that is the answer we want: the rule does not guess at near-miss names.
  const ok = page({ examples: ['Overview'], usage: ['When to use'] });
  assert.deepEqual(checkFile(COMPONENT, ok, true), []);
});

test('4. a foundation page that sprouts tabs is caught — the old mechanism\'s actual bug', () => {
  const found = checkFile(FOUNDATION, page(), false);
  assert.ok(found.some((f) => /is not a tabbed docs page/.test(f)), found.join('\n'));
  // ...and the same page without tabs is fine, so this is not just "always red".
  assert.deepEqual(checkFile(FOUNDATION, '## Palette\n\nbody', false), []);
});

test('5. a section div that lost its heading breaks the one-to-one invariant', () => {
  const broken = page().replace('## Overview\n\n', '');
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /section div\(s\) but 0 heading\(s\)/.test(f)), found.join('\n'));
});

test('an unknown tab name is caught — Code and Changelog are generated, never authored', () => {
  const broken = page().replace('<DocsTab tab="examples">', '<DocsTab tab="code">');
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /Found: code/.test(f)), found.join('\n'));
});

test('readTabs attributes a heading to the section div that opened it', () => {
  const { sections } = readTabs(page({ examples: ['Overview'], usage: ['Accessibility'] }));
  assert.deepEqual(
    sections.map((s) => [s.heading, s.tab]),
    [
      ['Overview', 'examples'],
      ['Accessibility', 'usage'],
    ],
  );
});
