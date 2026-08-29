import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { bodyOf, endOfOpenTag, failures, hasName, iconOnly, nameless, sources } from './icon-button-name.mjs';

function corpus(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'icon-button-'));
  for (const [rel, source] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), source);
  }
  return root;
}

const scan = (jsx) => {
  const root = corpus({ 'design-system/src/a.jsx': jsx });
  return nameless(sources(root), root);
};

test('an attribute list ends at the tag, not at the first `>` inside it', () => {
  // `onClick={(e) => toggle(e)}` ends a naive scan three characters early, and
  // that button — the lessons-table chevron — was 21 of the 23 axe findings.
  const tag = '<button onClick={(e) => toggle(e)} className="x">';
  assert.equal(endOfOpenTag(tag, 0), tag.length - 1);
});

test('a nameless icon button is found', () => {
  const found = scan('<button onClick={x}><i className="fas fa-xmark" /></button>');
  assert.equal(found.length, 1);
  assert.equal(found[0].tag, 'button');
});

test('a name in any of the four attributes clears it', () => {
  for (const attribute of ['aria-label="Close"', 'aria-labelledby="t"', 'title="Close"', 'text="Close"']) {
    assert.deepEqual(scan(`<button ${attribute}><i className="fa" /></button>`), [], attribute);
  }
});

test('an EMPTY name is not a name', () => {
  // Four real call sites are written `text="" leadingVisual="list-ul"`, which
  // renders plus-btn--icon-only with nothing to announce.
  assert.equal(hasName(' text="" leadingVisual="list-ul"'), false);
  assert.equal(hasName(' text="Save"'), true);
  // An expression could hold a name; evaluating it is out of scope.
  assert.equal(hasName(' aria-label={label}'), true);
});

test('a button with words in it is not a finding', () => {
  assert.deepEqual(scan('<button onClick={x}>Close</button>'), []);
  assert.deepEqual(scan('<button onClick={x}><i className="fa" /> Close</button>'), []);
});

test('a body the scanner cannot read is left alone', () => {
  // `{children}` might be a word. So might `{label}`. Blind spot 1.
  assert.deepEqual(scan('<button onClick={x}>{children}</button>'), []);
  // A spread can carry aria-label.
  assert.deepEqual(scan('<button {...props}><i className="fa" /></button>'), []);
});

test('an icon whose className is an expression is still an icon', () => {
  // The `{` lives in an ATTRIBUTE. A scanner that looks for `{` anywhere in the
  // body skips exactly the button this check was written for.
  assert.equal(iconOnly('<i className={`fas fa-chevron-${open}`} />'), true);
  assert.equal(iconOnly('{label}'), false);
  assert.equal(iconOnly('<span className="x">Save</span>'), false);
});

test('a self-closing <Button> with no text is icon-only', () => {
  const found = scan('<Button style="primary" leadingVisual="arrow-left" onClick={go} />');
  assert.equal(found.length, 1);
  assert.equal(found[0].tag, 'Button');
});

test('nested buttons of the same name do not confuse the body scan', () => {
  const source = '<button aria-label="outer"><span><button aria-label="inner">Go</button></span></button>';
  const body = bodyOf(source, 'button', source.indexOf('>') + 1);
  assert.match(body.body, /^<span>/);
  assert.match(body.body, /<\/span>$/);
});

test('failures report each site, and a stale exception', () => {
  const hit = { file: 'a.jsx', line: 3, tag: 'button', source: '<button>' };
  assert.equal(failures([hit], {}).length, 1);
  assert.deepEqual(failures([hit], { 'a.jsx:3': 'recorded' }), []);
  const stale = failures([], { 'a.jsx:3': 'recorded' });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /is not one/);
});
