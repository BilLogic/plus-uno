/**
 * How `generate:component-docs` decides which authored sections a component's
 * MDX carries. The do/don't pairs no longer sit in a section of their own: each
 * pair sits under the `###` rule it illustrates, so the detector reads pairs
 * under rules as well as the old headings.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { authoredCoverage } from './authored-coverage.mjs';

const usage = (body) => `## When to use\n\nPick one.\n\n${body}\n\n## Accessibility\n\nLabel it.\n`;

test('a code pair under a ### rule counts as correct/incorrect', () => {
  const mdx = usage([
    '### Label the field.',
    '',
    '```jsx',
    '// Incorrect — no name.',
    '<Input />',
    '',
    '// Correct — a visible label.',
    '<Input label="Email" />',
    '```',
  ].join('\n'));
  assert.deepEqual(authoredCoverage(mdx), { whenToUse: true, correctIncorrect: true, accessibility: true });
});

test('a ✓ / ✗ card pair under a ### rule counts', () => {
  const mdx = usage('### One line only\n\n✓ Do: a short answer\n\n✗ Don\'t: a paragraph');
  assert.equal(authoredCoverage(mdx).correctIncorrect, true);
});

test('bold Do / Don\'t labels under a ### rule count', () => {
  const mdx = usage('### Not an action menu\n\n**Do** pick a value.\n\n**Don\'t** run a command.');
  assert.equal(authoredCoverage(mdx).correctIncorrect, true);
});

test('half a pair does not count', () => {
  const mdx = usage('### Label the field.\n\n```jsx\n// Correct\n<Input label="Email" />\n```');
  assert.equal(authoredCoverage(mdx).correctIncorrect, false);
});

test('the two halves must sit under the same rule', () => {
  const mdx = usage('### First rule\n\n// Incorrect\n\n### Second rule\n\n// Correct');
  assert.equal(authoredCoverage(mdx).correctIncorrect, false);
});

test('a pair with no ### rule above it does not count', () => {
  const mdx = '## When to use\n\n// Incorrect\n\n// Correct\n';
  assert.equal(authoredCoverage(mdx).correctIncorrect, false);
});

test('prose that starts with "Do not" is not a label', () => {
  const mdx = usage('### Do not expect form semantics.\n\nDo not pass `name`.\n\nDon\'t rely on it.');
  assert.equal(authoredCoverage(mdx).correctIncorrect, false);
});

test('the legacy headings still count', () => {
  assert.equal(authoredCoverage('## Correct usage\n').correctIncorrect, true);
  assert.equal(authoredCoverage('### Dos and don\'ts\n').correctIncorrect, true);
});

test('no MDX means no coverage', () => {
  assert.deepEqual(authoredCoverage(''), { whenToUse: false, correctIncorrect: false, accessibility: false });
  assert.deepEqual(authoredCoverage(null), { whenToUse: false, correctIncorrect: false, accessibility: false });
});
