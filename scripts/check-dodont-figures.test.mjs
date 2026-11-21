/**
 * Every rule in `check:dodont-figures`, watched failing, each with a green twin.
 * The last case runs the real tree.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { captionText, checkExamplesSource, checkSource, helperBody, isFoundationFile, isRunOn, run, summary } from './check-dodont-figures.mjs';

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
  assert.equal(isFoundationFile('design-system/src/components/ai/AiChat/AiChat.mdx'), false);
  assert.deepEqual(checkSource(helper, { file }), []);
  assert.ok(checkSource(helper, { file: 'design-system/src/components/ai/AiChat/AiChat.mdx' }).length > 0);
  assert.ok(checkSource('<Do caption="Keep it short."><div style={{ a: 1 }}><Button /></div></Do>', { file }).some((p) => /inline style/.test(p.message)));
  assert.ok(checkSource(helperPage('<svg viewBox="0 0 1 1" />'), { file }).some((p) => /<svg>/.test(p.message)));
});

test('helperBody reads the whole definition and nothing after it', () => {
  const src = 'const AFigure = () => (\n  <div>{x}</div>\n);\nconst BFigure = () => (<i style={{}} />);';
  assert.ok(helperBody(src, 'AFigure').includes('<div>'));
  assert.ok(!helperBody(src, 'AFigure').includes('style'));
  assert.equal(helperBody(src, 'MissingFigure'), '');
});

const ex = (src) => checkExamplesSource(src).map((p) => p.message);

test('printed examples: layout on tokens is silent, the green twin', () => {
  assert.deepEqual(ex("export const A = () => <div style={{ display: 'flex', gap: 'var(--stack-sm)', alignItems: 'center' }}><p className=\"body-default\">x</p></div>;"), []);
  assert.deepEqual(ex("const column = { display: 'grid', gap: 'var(--stack-md)' };\nexport const A = () => <div style={column} />;"), []);
  assert.deepEqual(ex("export const A = () => <fieldset style={{ margin: 0, padding: 0, border: 0 }} />;"), []);
});

test('printed examples: color, type, radius and elevation fail, inline or through a named style', () => {
  const bad = { color: "color: 'var(--ds-text)'", font: "font: 'var(--body-default)'", letterSpacing: "letterSpacing: 'x'", fontVariantNumeric: "fontVariantNumeric: 'tabular-nums'", borderRadius: "borderRadius: 'var(--radius-md)'", boxShadow: "boxShadow: 'var(--ds-shadow-overlay)'", background: "background: 'var(--ds-surface)'", border: "border: '1px solid var(--ds-border)'" };
  for (const [key, decl] of Object.entries(bad)) {
    assert.ok(ex(`export const A = () => <p style={{ margin: 0, ${decl} }} />;`).some((m) => m.includes(`\`${key}\``)), key);
  }
  assert.ok(ex("const subtle = { color: 'var(--ds-text-subtle)' };\nexport const A = () => <p style={{ ...subtle }} />;").some((m) => /`color`/.test(m)));
  assert.ok(ex("const clip = { overflow: 'hidden', font: 'var(--body-sm)' };\nexport const A = () => <p style={clip} />;").some((m) => /`font`/.test(m)));
});

test('printed examples: a conditional style is read on both branches', () => {
  assert.ok(ex("export const A = ({ ok }) => <p style={ok ? { color: 'red' } : {}} />;").some((m) => /`color`/.test(m)));
  assert.ok(ex("export const A = ({ ok }) => <p style={ok ? {} : { color: 'red' }} />;").some((m) => /`color`/.test(m)));
  assert.deepEqual(ex("export const A = ({ ok }) => <p style={ok ? { gap: 'var(--stack-sm)' } : {}} />;"), []);
});

test('printed examples: a conditional spread is followed', () => {
  assert.ok(ex("export const A = ({ ok }) => <p style={{ margin: 0, ...(ok ? { color: 'red' } : {}) }} />;").some((m) => /`color`/.test(m)));
  assert.ok(ex("export const A = ({ ok }) => <p style={{ margin: 0, ...(ok && { font: 'var(--body-sm)' }) }} />;").some((m) => /`font`/.test(m)));
});

test('printed examples: a named conditional style is followed', () => {
  assert.ok(ex("const tone = (ok) => (ok ? { color: 'red' } : {});\nconst look = ok ? { boxShadow: 'x' } : { gap: 0 };\nexport const A = () => <p style={look} />;").some((m) => /`boxShadow`/.test(m)));
  assert.ok(ex("const quiet = { color: 'red' };\nconst loud = { gap: 0 };\nexport const A = ({ ok }) => <p style={ok ? quiet : loud} />;").some((m) => /`color`/.test(m)));
});

test('printed examples: a comment before a property does not hide it', () => {
  assert.ok(ex("export const A = () => <p style={{ margin: 0, /* tone */ color: 'red' }} />;").some((m) => /`color`/.test(m)));
  assert.ok(ex("export const A = () => <p style={{\n  // tone\n  color: 'red',\n}} />;").some((m) => /`color`/.test(m)));
});

test('printed examples: whitespace around style = does not hide it', () => {
  assert.ok(ex("export const A = () => <p style = {{ color: 'red' }} />;").some((m) => /`color`/.test(m)));
  assert.ok(ex("export const A = () => <p\n  style=\n  {{ color: 'red' }} />;").some((m) => /`color`/.test(m)));
});

test('printed examples: a fixed computed key does not hide it', () => {
  assert.ok(ex("export const A = () => <p style={{ ['color']: 'red' }} />;").some((m) => /`color`/.test(m)));
  assert.ok(ex('export const A = () => <p style={{ [`color`]: "red" }} />;').some((m) => /`color`/.test(m)));
});

test('printed examples: table layout keys are layout', () => {
  assert.deepEqual(ex("export const A = () => <table style={{ borderSpacing: 0, borderCollapse: 'collapse' }} />;"), []);
});

test('printed examples: a hairline from a class may zero the other sides', () => {
  assert.deepEqual(ex("export const A = () => <div className=\"border-outline-variant\" style={{ borderInline: 0, borderBlockEnd: 0 }} />;"), []);
});

test('printed examples: the line of a finding is the style attribute line', () => {
  assert.deepEqual(checkExamplesSource("const x = 1;\nexport const A = () => <p style={{ color: 'red' }} />;").map((p) => p.line), [2]);
});

test('printed examples: the real tree is clean', () => {
  assert.deepEqual(run().filter((f) => /Examples\.jsx$/.test(f.file)), []);
});

test('a fixture root: only tracked pages are read, never a second copy of the tree', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dodont-'));
  const put = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  try {
    const bad = '<Do caption="Keep it short."><svg viewBox="0 0 1 1" /></Do>';
    put('design-system/src/components/Bad.mdx', bad);
    put('design-system/src/components/Good.mdx', '<Do caption="Keep it short."><Button /></Do>');
    put('design-system/src/components/Bad.test.jsx', bad);
    put('.claude/worktrees/other/design-system/src/components/Copy.mdx', bad);
    execFileSync('git', ['-C', root, 'init', '-q']);
    execFileSync('git', ['-C', root, 'add', 'design-system']);
    assert.deepEqual(run({ repoRoot: root }).map((f) => f.file), ['design-system/src/components/Bad.mdx']);
    assert.match(summary({ repoRoot: root }), /^2 Do and Don't block/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
