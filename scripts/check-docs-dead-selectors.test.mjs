/**
 * Every assertion in `check:docs-dead-selectors`, watched failing.
 *
 * The repo's recurring defect is a guard that cannot fail — a generator that wrote a
 * file then compared it to itself, a CLI entry that never ran under paths with spaces,
 * a ratchet whose corpus filter let a halved corpus through. This check is a fresh
 * instance of that risk in its purest form: it decides a selector is dead by NOT
 * FINDING a string, so a source walk that quietly returned nothing would report the
 * entire stylesheet dead, and a substring test that quietly matched everything would
 * report it entirely alive. Both directions are asserted below, and every red case has
 * a green twin so a check that simply always failed would not survive this file.
 *
 * FIXTURES GO IN A TEMP DIRECTORY, never in the live tree. `check-docs-tabs.test.mjs`
 * writes its fixtures into `design-system/guidelines/`, which races every other sweep
 * reading that directory at the same time; the source walk under test here would read
 * those fixtures as repo sources. `fs.mkdtemp` costs one line and has no such edge.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  stripComments,
  selectorClasses,
  deadSelectors,
  emitterIndex,
  sourceFiles,
} from './check-docs-dead-selectors.mjs';

/** A vendor table small enough to hold in your head, shaped like the real one. */
const vendor = new Map([['sbdocs-content', '@storybook/addon-docs/dist/blocks.js']]);

/** Everything the fake repo emits. */
const emits = (...names) => emitterIndex([names.join(' ')]);

const names = (css, isEmitted, table = vendor) =>
  deadSelectors(selectorClasses(css), isEmitted, table).map((d) => d.name);

// ── the green twin every red case below needs ───────────────────────────────────────

test('a stylesheet whose every class is emitted is silent', () => {
  const css = `
.sb-ds-doc-section { gap: 16px; }
.sbdocs-content .sb-ds-doc-table { width: 100%; }
`;
  assert.deepEqual(names(css, emits('sb-ds-doc-section', 'sb-ds-doc-table')), []);
});

// ── the finding ─────────────────────────────────────────────────────────────────────

test('a class nothing emits is reported, by name and by line', () => {
  const css = `.sb-ds-doc-section { gap: 16px; }
.sb-plus-intro-mini-grid { display: grid; }
`;
  const dead = deadSelectors(selectorClasses(css), emits('sb-ds-doc-section'), vendor);
  assert.deepEqual(dead, [{ name: 'sb-plus-intro-mini-grid', line: 2 }]);
});

test('a BEM modifier its component never emits is dead even when the base is alive', () => {
  const css = '.responsive-frame-root--browser-fullscreen .responsive-frame-wrapper { flex: 1; }';
  // The real ResponsiveFrame emits `--native` and `--standalone`, and no third.
  const isEmitted = emits(
    'responsive-frame-root',
    'responsive-frame-root--native',
    'responsive-frame-root--standalone',
    'responsive-frame-wrapper',
  );
  assert.deepEqual(names(css, isEmitted), ['responsive-frame-root--browser-fullscreen']);
});

test('a class dead in two rules is reported once — the count is distinct selectors', () => {
  const css = `
.sb-plus-intro-mini-grid { display: grid; }
@media (min-width: 900px) {
  .sb-plus-intro-mini-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;
  assert.deepEqual(names(css, emits()), ['sb-plus-intro-mini-grid']);
});

test('a dead class inside a selector list is found alongside its live siblings', () => {
  const css = `
.sbdocs-toc h2,
.toc-wrapper h2,
.toc-container h2,
h2.toc-title {
  font-size: 14px;
}
`;
  assert.deepEqual(names(css, emits('sbdocs-toc', 'toc-wrapper')), ['toc-container', 'toc-title']);
});

// ── the vendor allowlist, and its red twin ──────────────────────────────────────────

test('a vendor class is allowed though no repo source emits it', () => {
  assert.deepEqual(names('.sbdocs-content p { color: red; }', emits()), []);
});

test('…and the SAME class is reported the moment it leaves the allowlist', () => {
  assert.deepEqual(names('.sbdocs-content p { color: red; }', emits(), new Map()), [
    'sbdocs-content',
  ]);
});

// ── what must NOT be read as a selector ─────────────────────────────────────────────

test('a class named only inside a comment is not a selector', () => {
  const css = `
/* .sb-button-docs was deleted in #251; this comment is the only mention left. */
.sb-ds-doc-section { gap: 16px; }
`;
  assert.deepEqual(names(css, emits('sb-ds-doc-section')), []);
});

test('a comment does not shift the line numbers of the selectors after it', () => {
  const css = `/*
 * three
 * lines
 */
.sb-plus-intro-mini-grid { display: grid; }
`;
  assert.deepEqual(deadSelectors(selectorClasses(css), emits(), vendor), [
    { name: 'sb-plus-intro-mini-grid', line: 5 },
  ]);
});

test('a dotted value inside a declaration is not a selector', () => {
  // `color-mix(in srgb, …)` and a decimal both live in declaration position, where a
  // regex over the whole file would read `.5` and `.foo` as class names.
  const css = `
.sb-ds-doc-section {
  border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  opacity: 0.5;
  background: url(./img/.hidden-thing.png);
}
`;
  assert.deepEqual(names(css, emits('sb-ds-doc-section')), []);
});

test('an at-rule prelude is not a selector, and its inner rulesets still are', () => {
  const css = `
@media (min-width: 900px) {
  .sb-plus-intro-mini-grid { grid-template-columns: 1fr 1fr; }
}
`;
  assert.deepEqual(names(css, emits()), ['sb-plus-intro-mini-grid']);
});

test('a functional pseudo-class holds real classes and they are read', () => {
  const css = '.sbdocs-content p:not(:where(.docs-story *)) { font-size: 16px; }';
  assert.deepEqual(names(css, emits()), ['docs-story']);
});

test('an attribute selector is not a class', () => {
  const css = '.sb-ds-doc-section > div[scale="1"] { margin: 0; }';
  assert.deepEqual(names(css, emits('sb-ds-doc-section')), []);
});

test('stripComments blanks the comment but keeps every newline', () => {
  const before = '/* a\nb */\n.x { }';
  const after = stripComments(before);
  assert.equal(after.match(/\n/g).length, before.match(/\n/g).length);
  assert.ok(!after.includes('a'));
});

// ── the source walk, over a real temp directory ─────────────────────────────────────

test('the source walk finds emitters, skips node_modules, and skips the stylesheet itself', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dead-selectors-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'node_modules', 'pkg'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.storybook'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'Page.mdx'), '<div className="sb-ds-doc-section" />');
    fs.writeFileSync(path.join(dir, 'src', 'notes.txt'), 'sb-only-in-a-txt-file');
    fs.writeFileSync(path.join(dir, 'node_modules', 'pkg', 'x.js'), '"sb-only-in-node-modules"');
    const sheet = path.join(dir, '.storybook', 'overrides.css');
    fs.writeFileSync(sheet, '.sb-only-in-the-stylesheet { color: red; }');

    const files = sourceFiles(dir, { exclude: new Set([sheet]) });
    const rel = files.map((f) => path.relative(dir, f));
    assert.deepEqual(rel, [path.join('src', 'Page.mdx')]);

    const isEmitted = emitterIndex(files.map((f) => fs.readFileSync(f, 'utf8')));
    assert.ok(isEmitted('sb-ds-doc-section'), 'an .mdx in the tree is an emitter');
    // The three negatives are what stop the walk being trivially true.
    assert.ok(!isEmitted('sb-only-in-a-txt-file'), 'a .txt cannot put a class in the DOM');
    assert.ok(!isEmitted('sb-only-in-node-modules'), 'node_modules is not this repo');
    assert.ok(!isEmitted('sb-only-in-the-stylesheet'), 'the sheet cannot vouch for itself');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a class written inside a template literal reads as emitted when it is spelled out', () => {
  // ResponsiveFrame.jsx builds its className by concatenation, but writes each modifier
  // out in full — which is exactly why limitation 1 in the header has no instance today.
  const source =
    'className={`responsive-frame-root${isNative ? \' responsive-frame-root--native\' : \'\'}`}';
  const isEmitted = emitterIndex([source]);
  assert.ok(isEmitted('responsive-frame-root--native'));
  assert.ok(!isEmitted('responsive-frame-root--browser-fullscreen'));
});
