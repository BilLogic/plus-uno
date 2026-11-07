import { test } from 'node:test';
import assert from 'node:assert/strict';

import { blankComments, importsOf, jsxElementsOf, positionAt, styleObjectsOf } from './jsx-scan.mjs';

test('imports: default, named, renamed, namespace and side-effect, with positions', () => {
  const src = [
    "import React from 'react';",
    "import { Button, Card as Box } from '@/components';",
    "import * as DS from '@/components';",
    "import '@/styles/main.scss';",
    "import Tag, { TAG_SIZES } from \"@/components/labels/Tag\";",
  ].join('\n');
  const all = importsOf(src);
  assert.deepEqual(all.map((i) => i.source), ['react', '@/components', '@/components', '@/styles/main.scss', '@/components/labels/Tag']);
  assert.deepEqual(all[1].named, [{ imported: 'Button', local: 'Button' }, { imported: 'Card', local: 'Box' }]);
  assert.equal(all[2].namespace, 'DS');
  assert.equal(all[4].default, 'Tag');
  assert.deepEqual(positionAt(src, all[4].index), { line: 5, col: 1 });
});

test('a multi-line import is read whole', () => {
  const src = "import {\n  Button,\n  Modal,\n} from '@/components';";
  assert.deepEqual(importsOf(src)[0].named.map((n) => n.local), ['Button', 'Modal']);
});

test('jsx: attributes with string, expression, bare and spread forms', () => {
  const src = '<Button appearance="primary" spacing={\'compact\'} isDisabled onClick={() => go({ a: 1 })} {...rest}>Go</Button>';
  const [el] = jsxElementsOf(src);
  assert.equal(el.name, 'Button');
  assert.deepEqual(
    el.attributes.map((a) => [a.name, a.value]),
    [
      ['appearance', { kind: 'string', text: 'primary' }],
      ['spacing', { kind: 'string', text: 'compact' }],
      ['isDisabled', { kind: 'bare' }],
      ['onClick', { kind: 'expression', text: '() => go({ a: 1 })' }],
    ],
  );
  assert.equal(el.spread, true);
});

test('jsx: a `>` inside an expression does not end the tag; nested and member tags are found', () => {
  const src = '<div>\n  <Card onClick={() => a > b} />\n  <DS.Button size={24}/>\n</div>';
  const els = jsxElementsOf(src);
  assert.deepEqual(els.map((e) => e.name), ['div', 'Card', 'DS.Button']);
  assert.deepEqual(els[2].attributes[0].value, { kind: 'number', text: '24' });
  assert.equal(positionAt(src, els[1].index).line, 2);
});

test('jsx: a comparison or a generic is not a tag', () => {
  assert.deepEqual(jsxElementsOf('if (a<B) {}\nconst x = items.length<Max;').map((e) => e.name), []);
});

test('comments are blanked with positions kept, strings left alone', () => {
  const src = "a // <Button nope/>\nb /* <Card/> */ c\nconst u = 'https://x';";
  const out = blankComments(src);
  assert.equal(out.length, src.length);
  assert.equal(jsxElementsOf(out).length, 0);
  assert.match(out, /'https:\/\/x'/);
});

test('style objects: each property with its value text and position', () => {
  const src = "<div style={{ padding: '12px', color: tone, fontWeight: 600, margin: 0 }} />";
  const [obj] = styleObjectsOf(src);
  assert.deepEqual(
    obj.properties.map((p) => [p.key, p.value]),
    [
      ['padding', "'12px'"],
      ['color', 'tone'],
      ['fontWeight', '600'],
      ['margin', '0'],
    ],
  );
  assert.equal(src.slice(obj.properties[0].index, obj.properties[0].index + 7), 'padding');
});
