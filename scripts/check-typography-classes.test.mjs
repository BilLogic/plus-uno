/**
 * Tests for the ONE distinction `check:typography-classes` turns on.
 *
 * The defect it was written for — `.h4-txt` — was already mentioned in a
 * stylesheet: `Badge.scss` carried `&.h4-txt { padding-left: … }`. Any check
 * that asked "does this class appear in the CSS?" would have gone green on it.
 * So the whole value of this check lives in `blockAfter` + the typography-
 * property test, and a test suite that did not attack exactly that would be
 * testing the parts that could not have been wrong.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { blockAfter, definedClasses, report, suggestionFor, usedClasses } from './check-typography-classes.mjs';

/** Write a throwaway tree and return paths relative to the repo root the check uses. */
function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'typo-classes-'));
  const written = [];
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
    written.push(path.relative(process.cwd(), full));
  }
  return written;
}

test('a class whose only rule sets padding is NOT defined', () => {
  // Verbatim shape of the rule that hid the defect for as long as it existed.
  const files = fixture({
    'Badge.scss': `.plus-badge {\n  &.h4,\n  &.h4-txt {\n    padding-left: 12px;\n  }\n}\n`,
  });
  assert.equal(definedClasses(files).has('h4-txt'), false);
});

test('a class whose rule sets a typography property IS defined', () => {
  const files = fixture({
    'fonts.scss': `.body1-txt {\n  font-size: var(--font-size-body1);\n}\n`,
  });
  assert.equal(definedClasses(files).has('body1-txt'), true);
});

test('a class defined only by @extend of a %font placeholder IS defined', () => {
  // `.body3-txt` really is written this way: it inherits family and weight from
  // `%font-body`. Demanding all four properties inline would call the real
  // classes undefined, which is a false positive on the system's own source.
  const files = fixture({
    'fonts.scss': `%font-body {\n  font-weight: 300;\n}\n.body3-txt {\n  @extend %font-body;\n}\n`,
  });
  assert.equal(definedClasses(files).has('body3-txt'), true);
});

test('a class listed beside others in one selector IS defined', () => {
  const files = fixture({
    'fonts.scss': `body,\n.body2-txt {\n  font-size: 14px;\n}\n`,
  });
  assert.equal(definedClasses(files).has('body2-txt'), true);
});

test('blockAfter returns only the nested rule, not the parent', () => {
  const source = `.a {\n  font-size: 10px;\n  &.b-txt {\n    padding: 0;\n  }\n}\n`;
  const at = source.indexOf('&.b-txt');
  assert.equal(/font-size/.test(blockAfter(source, at)), false);
  assert.equal(/padding/.test(blockAfter(source, at)), true);
});

test('uses are found in JSX and markdown with a line number', () => {
  const files = fixture({
    'Page.jsx': `export const P = () => <h1 className="h2-txt">x</h1>;\n`,
    'guide.md': `<h1 className="h3-txt">y</h1>\n`,
  });
  const uses = usedClasses(files);
  assert.deepEqual(
    uses.map((u) => [u.class, u.line]).sort(),
    [
      ['h2-txt', 1],
      ['h3-txt', 1],
    ],
  );
});

test('a stylesheet is never scanned for uses, nor a component for definitions', () => {
  // The two directions read disjoint extensions on purpose: `&.h4-txt` in a
  // stylesheet is not a page asking for the class, and a `className` string is
  // not a definition. Crossing them would make the check report itself.
  const files = fixture({ 'Badge.scss': `.x {\n  &.h4-txt {\n    padding: 0;\n  }\n}\n` });
  assert.deepEqual(usedClasses(files), []);
});

test('the report names the file, the line and the class that exists instead', () => {
  const text = report([{ class: 'h2-txt', file: 'prototypes/a.jsx', line: 64 }]);
  assert.match(text, /\.h2-txt/);
  assert.match(text, /prototypes\/a\.jsx:64/);
  assert.match(text, /\.h2/);
  assert.match(text, /there is no -txt form/);
});

test('a suggestion is offered only where the stem is a real heading class', () => {
  assert.equal(suggestionFor('h2-txt'), '.h2');
  // `.lead` is not a class in this system, so guessing one would send the
  // reader somewhere that also does not exist.
  assert.equal(suggestionFor('lead-txt'), null);
});
