/**
 * Every rule in `check:dodont-figures`, watched failing, each with a green twin.
 * The last case runs the real tree.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { captionText, checkSource, helperBody, isFoundationFile, isRunOn, run } from './check-dodont-figures.mjs';

const pair = (extra = '', doEx = '<Button label="Save" />', dontEx = '<Button label="OK" />') =>
  `<DoDontPair\n  doExample={${doEx}}\n  doCaption="Name the action."\n  dontExample={${dontEx}}\n  dontCaption="Say nothing about it."\n  ${extra}\n/>`;
const messages = (src) => checkSource(src).map((p) => p.message);

test('a clean pair is silent: the green twin', () => {
  assert.deepEqual(messages(pair()), []);
});

test('an inline style on a figure fails', () => {
  assert.ok(messages(pair('', '<div style={{ display: "flex" }}><Button /></div>')).some((m) => /inline style/.test(m)));
});

test('an <svg> literal fails', () => {
  assert.ok(messages(pair('', undefined, '<svg viewBox="0 0 1 1"><rect /></svg>')).some((m) => /<svg>/.test(m)));
});

test('an <img> fails', () => {
  assert.ok(messages(pair('', '<img src="a.png" alt="" />')).some((m) => /<img>/.test(m)));
});

test('a hex color fails', () => {
  assert.ok(messages(pair('', '<Tag label="x" color="#ff0000" />')).some((m) => /hex color/.test(m)));
});

test('a missing caption fails, on a pair and on a Do', () => {
  assert.ok(messages('<DoDontPair doExample={<Button />} dontExample={<Button />} />').some((m) => /no caption/.test(m)));
  assert.ok(messages('<Do><Button /></Do>').some((m) => /no caption/.test(m)));
  assert.deepEqual(messages('<Do caption="Keep it short."><Button /></Do>'), []);
});

test('a two-sentence caption fails; a fragment caption with code reads as text', () => {
  assert.ok(messages('<Dont caption="Too long. Then more."><Button /></Dont>').some((m) => /one sentence/.test(m)));
  assert.deepEqual(messages('<Do caption={<>A ring on <C>--ds-border-focused</C>, outside the button.</>}><Button /></Do>'), []);
  assert.equal(isRunOn('Use e.g. one action.'), false);
  assert.equal(captionText('{<>One <C>x</C> here.</>}'), 'One x here.');
});

test('stacked needs a reason', () => {
  assert.ok(messages(pair('stacked')).some((m) => /stacked with no reason/.test(m)));
  assert.deepEqual(messages(pair('stacked="The table needs the full width."')), []);
});

test('the real tree is clean', () => {
  const found = run();
  assert.deepEqual(found.map((f) => `${f.file}:${f.line} ${f.message}`), []);
});

const helperPage = (body, kind = 'const') =>
  `${kind === 'const' ? `const SwapFigure = () => (\n  ${body}\n);` : `function SwapFigure() {\n  return (\n    ${body}\n  );\n}`}\n\n<Do caption="Keep it short."><SwapFigure /></Do>`;

test('a helper figure is followed to its definition and scanned', () => {
  for (const kind of ['const', 'function']) {
    assert.ok(messages(helperPage('<div style={{ color: "red" }}><Button /></div>', kind)).some((m) => /helper SwapFigure has an inline style/.test(m)));
    assert.ok(messages(helperPage('<svg viewBox="0 0 1 1" />', kind)).some((m) => /<svg>/.test(m)));
    assert.ok(messages(helperPage('<Tag color="#ff0000" />', kind)).some((m) => /hex color/.test(m)));
    assert.deepEqual(messages(helperPage('<FigureRow><Button /></FigureRow>', kind)), []);
  }
});

test('a helper figure inside a DoDontPair is followed too', () => {
  const src = 'const BadFigure = () => (<img src="a.png" alt="" />);\n' + pair('', '<Button />', '<BadFigure />');
  assert.ok(messages(src).some((m) => /Don’t figure helper BadFigure uses an <img>/.test(m)));
});

test('a helper that uses another helper is followed through it', () => {
  const src = 'const InnerFigure = () => (<div style={{ gap: 1 }} />);\nconst OuterFigure = () => (<InnerFigure />);\n<Do caption="Keep it short."><OuterFigure /></Do>';
  assert.ok(messages(src).some((m) => /helper InnerFigure has an inline style/.test(m)));
});

test('Foundations exemption: a named helper may carry a style, a styled wrapper may not', () => {
  const file = 'design-system/src/styles/Radius.stories.jsx';
  const helper = helperPage('<div style={{ borderRadius: 3 }}><Button /></div>');
  assert.equal(isFoundationFile(file), true);
  assert.equal(isFoundationFile('design-system/src/storybook-docs/elevation-material-figures.jsx'), true);
  assert.equal(isFoundationFile('design-system/src/templates/AiChat/AiChat.mdx'), false);
  assert.deepEqual(checkSource(helper, { file }), []);
  assert.ok(checkSource(helper, { file: 'design-system/src/templates/AiChat/AiChat.mdx' }).length > 0);
  assert.ok(checkSource('<Do caption="Keep it short."><div style={{ a: 1 }}><Button /></div></Do>', { file }).some((p) => /inline style/.test(p.message)));
  assert.ok(checkSource(helperPage('<svg viewBox="0 0 1 1" />'), { file }).some((p) => /<svg>/.test(p.message)));
});

test('helperBody reads the whole definition and nothing after it', () => {
  const src = 'const AFigure = () => (\n  <div>{x}</div>\n);\nconst BFigure = () => (<i style={{}} />);';
  assert.ok(helperBody(src, 'AFigure').includes('<div>'));
  assert.ok(!helperBody(src, 'AFigure').includes('style'));
  assert.equal(helperBody(src, 'MissingFigure'), '');
});
