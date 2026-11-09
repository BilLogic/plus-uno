// The raw-button check, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { run, scan } from './check-raw-buttons.mjs';

const F = 'design-system/src/components/labels/A/A.stories.jsx';
const src = (text, file = F) => ({ path: file, text });

test('a raw <button> counts', () => {
  const hits = scan('const x = <button type="button">Go</button>;\n');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 1);
});

test('a Bootstrap `btn btn-primary` class counts', () => {
  const hits = scan('<div className="btn btn-primary">Go</div>\n');
  assert.equal(hits.length, 1);
  assert.match(hits[0].kind, /Bootstrap/);
});

test('btn-close and btn-group count; plus-btn does not', () => {
  assert.equal(scan('<i className="btn-close" />\n').length, 1);
  assert.equal(scan('<div className="btn-group" />\n').length, 1);
  assert.equal(scan('<div className="plus-btn plus-btn--primary" />\n').length, 0);
});

test('a line under a raw-button exemption comment does not count', () => {
  assert.equal(scan('// raw-button: proves the menu works in a native button\n<button type="button">x</button>\n').length, 0);
  assert.equal(scan('{/* raw-button: inert copy of Spotlight markup */}\n<button type="button">x</button>\n', { mdx: true }).length, 0);
});

test('the exemption covers only the next line', () => {
  assert.equal(scan('// raw-button: why\n<div />\n<button>x</button>\n').length, 1);
});

test('the PLUS <Button does not count', () => {
  assert.equal(scan('<Button appearance="primary" onClick={go}>Go</Button>\n').length, 0);
});

test('prose, inline code and fenced MDX blocks that name <button> do not count', () => {
  assert.equal(scan('Use `<button>` only for native forms.\n', { mdx: true }).length, 0);
  assert.equal(scan('```jsx\n<button className="btn">x</button>\n```\n', { mdx: true }).length, 0);
  assert.equal(scan('// a <button> in a comment\n').length, 0);
});

test('run names the file and line of a hit', () => {
  const findings = run({ sources: [src('a\n<button>x</button>\n')], minFiles: 1 });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, F);
  assert.equal(findings[0].line, 2);
});

test('a corpus under the floor fails, since the glob has broken', () => {
  const findings = run({ sources: [src('<Button />\n')], minFiles: 5 });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /fewer than/);
});
