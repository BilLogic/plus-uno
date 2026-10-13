// `figmaMeta.deliberate` is a record the weekly DS precedence check obeys by
// staying silent, so a malformed one must fail the generator rather than
// mute the check by accident.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deliberateOf } from './generate-component-registry-from-storybook.js';

const PROPS = { size: { type: 'enum', values: ['small', 'large'] } };

test('a record of declared props, each with a one-line reason, passes through as written', () => {
  const record = { size: 'Code sizes the textarea; the library sizes it by its frame.' };
  assert.deepEqual(deliberateOf(record, 'Textarea', PROPS), record);
});

test('a record that is not an object of prop → reason fails', () => {
  for (const bad of [null, 'size', ['size'], 3]) {
    assert.throws(() => deliberateOf(bad, 'Textarea', PROPS), /must be an object/, JSON.stringify(bad));
  }
});

test('an empty, blank, multi-line or non-string reason fails', () => {
  for (const reason of ['', '   ', 'one\ntwo', 3]) {
    assert.throws(() => deliberateOf({ size: reason }, 'Textarea', PROPS), /one-line reason/, JSON.stringify(reason));
  }
});

test('a prop figmaMeta.props does not declare fails', () => {
  assert.throws(() => deliberateOf({ sise: 'typo' }, 'Textarea', PROPS), /names no prop/);
});
