/**
 * Every assertion in `check:docs-token-literals`, watched failing.
 *
 * This repo keeps producing guards that cannot fail — a generator that wrote a
 * file then compared it to itself, a CLI entry that never ran under paths with
 * spaces, a ratchet whose corpus filter let a halved corpus through, an
 * acceptance criterion that was green before its own fix landed. So every case
 * below feeds a deliberately dirty stylesheet in and asserts the SPECIFIC
 * literal that comes back, and every case has a green twin: a check that simply
 * always failed would not survive this file, and neither would one that always
 * passed.
 *
 * The allowances get the same treatment for a different reason. An allowance is
 * where a gate stops looking, so an allowance nobody has watched hold is a hole
 * nobody has measured. Each one here is paired with the same declaration minus
 * the allowance, going red — that pair is what proves the allowance is the
 * reason the green one is green, and not a check that never looked.
 *
 * The token table is a STUB, not the design system's. The allowances have to
 * hold whatever the DS defines this week; a test that read the real tokens
 * would change meaning every time somebody adds a spacing step, and would go
 * quietly vacuous the day a value it depended on was retired.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTokenIndex,
  findings,
  blankFallbacks,
  alwaysAllowed,
  chromeFindings,
  run,
} from './check-docs-token-literals.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

/** A token table small enough to hold in your head, shaped like the real one. */
const defs = new Map([
  ['--ds-border', { value: '#bec8ca', file: 'color/_semantic.scss' }],
  ['--ds-blanket', { value: 'rgba(0, 0, 0, 0.38)', file: 'color/_semantic.scss' }],
  ['--space-100', { value: '16px', file: '_scales.scss' }],
  ['--pad-x-lg', { value: 'var(--space-100)', file: 'ladder/_semantics.scss' }],
  ['--stack-lg', { value: '12px', file: 'ladder/_semantics.scss' }],
  ['--stroke-1', { value: '1px', file: '_scales.scss' }],
  ['--size-page-full', { value: '100%', file: '_layout-ish.scss' }],
  ['--size-nothing', { value: '0px', file: '_scales.scss' }],
  ['--size-breakpoint-ish', { value: '768px', file: '_layout-ish.scss' }],
  ['--font-size-100', { value: '1rem', file: '_type.scss' }],
  // A family this check does not offer, holding a value the docs might use.
  ['--frame-sidebar-width-nav', { value: '164px', file: 'ladder/_patterns.scss' }],
]);
const index = buildTokenIndex(defs);

const rule = (body) => `.sb-ds-doc-section {\n${body}\n}\n`;
const literals = (css, table = index) => findings(css, table).map((f) => f.literal);

test('a stylesheet that names every value in a token is silent — the green twin every case below needs', () => {
  const clean = rule(
    [
      '  gap: var(--pad-x-lg);',
      '  margin: 0 0 var(--stack-lg);',
      '  border-bottom: 1px solid var(--ds-border);',
      '  width: 100%;',
      '  padding: 0;',
    ].join('\n'),
  );
  assert.deepEqual(findings(clean, index), []);
});

test('1. a hand-planted hex color is caught, and named with the token that already holds it', () => {
  // The #e4e4e7-shaped defect the ticket opens with: a color picked by hand a
  // few lines from a `var(--color-…)` doing the same job.
  const found = findings(rule('  border-bottom: 1px solid #bec8ca;'), index);
  assert.equal(found.length, 1);
  assert.equal(found[0].literal, '#bec8ca');
  assert.deepEqual(found[0].tokens, ['--ds-border']);
});

test('1b. shorthand hex is the same color — `#BCA` is `#bbccaa`, and case does not hide it', () => {
  const short = buildTokenIndex(new Map([['--ds-x', { value: '#bbccaa', file: 'color/_semantic.scss' }]]));
  const found = findings(rule('  color: #BCA;'), short);
  assert.equal(found.length, 1, 'a three-digit hex must expand before it is compared');
  assert.deepEqual(found[0].tokens, ['--ds-x']);
  // Green twin: an unrelated color, correctly spelled, is not a finding.
  assert.deepEqual(literals(rule('  color: #123456;'), short), []);
});

test('1c. `rgba()` is compared by value, not by spelling', () => {
  const found = findings(rule('  background: rgba(0,0,0,.38);'), index);
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].tokens, ['--ds-blanket']);
});

test('2. a hand-planted px with a token equivalent is caught', () => {
  const found = findings(rule('  padding: 12px;'), index);
  assert.equal(found.length, 1);
  assert.equal(found[0].literal, '12px');
  assert.deepEqual(found[0].tokens, ['--stack-lg']);
});

test('2b. rem and px are one scale — `1rem` is the 16px token, or the check misses half the file', () => {
  const found = findings(rule('  gap: 1rem;'), index);
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].tokens, ['--pad-x-lg', '--space-100']);
});

test('2c. the semantic name is offered before the primitive `_primitives.scss` bans direct use of', () => {
  const [found] = findings(rule('  gap: 16px;'), index);
  assert.equal(found.tokens[0], '--pad-x-lg');
});

test('2d. every literal in a shorthand is reported, not just the first', () => {
  assert.deepEqual(literals(rule('  padding: 12px 16px;')), ['12px', '16px']);
});

test('3. a `font-size` is never offered a spacing token, and vice versa', () => {
  // `--font-size-100` is 16px and so is `--pad-x-lg`. Offering a
  // spacing step for a type size is the noise that gets a report ignored.
  const [size] = findings(rule('  font-size: 16px;'), index);
  assert.deepEqual(size.tokens, ['--font-size-100']);
  const [gap] = findings(rule('  gap: 16px;'), index);
  assert.ok(!gap.tokens.includes('--font-size-100'));
});

test('4. ALLOWANCE — zero, in any unit', () => {
  assert.deepEqual(literals(rule('  margin: 0;\n  padding: 0px;\n  inset: 0rem;')), []);
  // …and the red twin: the same property with a real value is not exempt.
  assert.deepEqual(literals(rule('  margin: 12px;')), ['12px']);
});

test('5. ALLOWANCE — `100%`, even when a token happens to carry it', () => {
  // `--size-page-full` is 100%. "As wide as its container" is a layout
  // instruction, not a measurement, so the token must not make it a finding.
  assert.deepEqual(literals(rule('  width: 100%;')), []);
  // Red twin: another percentage with a token behind it IS reported — this
  // allowance is `100%`, not "percentages are not scanned". That distinction is
  // not academic: the dimension pattern originally ended in `\\b`, which never
  // matches after a `%`, and the allowance would have been guarding a case the
  // scanner could not see.
  const pct = buildTokenIndex(new Map([['--size-half', { value: '50%', file: '_x.scss' }]]));
  assert.deepEqual(literals(rule('  width: 50%;'), pct), ['50%']);
  assert.deepEqual(literals(rule('  width: 100%;'), pct), []);
});

test('6. ALLOWANCE — the `1px` hairline, even though `--stroke-1` is 1px', () => {
  assert.deepEqual(literals(rule('  border: 1px solid #bec8ca;')), ['#bec8ca']);
  assert.deepEqual(literals(rule('  margin-bottom: -1px;')), []);
  // Red twin: 2px is a thickness somebody chose, and is not a hairline.
  const two = buildTokenIndex(new Map([['--size-two', { value: '2px', file: '_x.scss' }]]));
  assert.deepEqual(literals(rule('  border: 2px solid red;'), two), ['2px']);
});

test('7. ALLOWANCE — a fallback inside `var(--token, fallback)` is the token being used correctly', () => {
  assert.deepEqual(literals(rule('  color: var(--ds-border, #bec8ca);')), []);
  // Nested fallbacks go with the outer one — this is the shape the real file uses.
  assert.deepEqual(
    literals(rule('  color: var(--ds-a, var(--ds-border, #bec8ca));')),
    [],
  );
  // Not everything in parentheses is a fallback: `color-mix()` keeps its own
  // arguments, so a literal alongside a guarded token is still seen.
  assert.deepEqual(
    literals(rule('  background: color-mix(in srgb, var(--ds-a, #bec8ca) 70%, #bec8ca);')),
    ['#bec8ca'],
  );
  // Red twin: the same color written bare is a finding.
  assert.deepEqual(literals(rule('  color: #bec8ca;')), ['#bec8ca']);
});

test('8. ALLOWANCE — a comment against the declaration, on its own line or the line above', () => {
  assert.deepEqual(literals(rule('  /* the well is 12px because Storybook says so */\n  padding: 12px;')), []);
  assert.deepEqual(literals(rule('  padding: 12px; /* matches the toolbar, not a spacing step */')), []);
  // Red twin: the identical declaration with the comment removed.
  assert.deepEqual(literals(rule('  padding: 12px;')), ['12px']);
});

test('8b. a rule-level banner does NOT justify the declarations under it', () => {
  // The escape hatch is deliberately narrow. This file is full of long block
  // comments introducing a rule; if those counted, the first declaration of
  // nearly every rule in the corpus would be exempt and the gate would be
  // decorative. Only a comment INSIDE the braces counts.
  const banner = '/*\n * Section rhythm: one authority, and it is gap.\n */\n' + rule('  padding: 12px;');
  assert.deepEqual(literals(banner), ['12px']);
});

test('8c. a comment two lines up does not reach the declaration', () => {
  assert.deepEqual(literals(rule('  /* about the gap */\n  gap: 0;\n  padding: 12px;')), ['12px']);
});

test('9. a media-query prelude is not a declaration and is never reported', () => {
  // `--size-breakpoint-ish` is 768px, and `@media (min-width: 768px)` matches it
  // exactly — but a custom property is invalid in a media prelude, so there is
  // no `var()` that could replace it. Reporting it would be instructing the
  // author to write code that does not work.
  const css = `@media (min-width: 768px) {\n${rule('  gap: 16px;')}}\n`;
  assert.deepEqual(literals(css), ['16px'], 'the prelude is skipped; the body is not');
});

test('9b. a custom-property DEFINITION in the docs sheet is not a consumer of one', () => {
  assert.deepEqual(literals(rule('  --local-gap: 16px;\n  gap: var(--local-gap);')), []);
});

test('10. a NEAR MISS is invisible, and that is written into the check', () => {
  // 13px is not 12px. This check tests equality, never proximity — the same
  // boundary check-token-collision.mjs draws when it only catches a foreground
  // token IDENTICAL to its background. Asserted so the limitation is a decision
  // somebody made rather than a gap somebody will assume is covered.
  assert.deepEqual(literals(rule('  font-size: 13px;')), []);
});

test('11. token families outside color / font-size / line-height / size are not offered', () => {
  // `--frame-sidebar-width-nav` is 164px. A docs-chrome pixel equal to an app-shell
  // grid measurement is a coincidence, not a token being ignored.
  assert.deepEqual(literals(rule('  width: 164px;')), []);
});

test('unit — the allowances and the fallback blanker', () => {
  assert.equal(blankFallbacks('var(--a, #fff)').includes('#fff'), false);
  assert.equal(blankFallbacks('var(--a)'), 'var(--a)');
  assert.equal(alwaysAllowed('1px'), true);
  assert.equal(alwaysAllowed('2px'), false);
});

/*
 * The policy half (#611). Measurement above plants a stylesheet string; the
 * gate is a run against a fixture tree — a hand-picked hex the token table
 * already holds, and an emptied token directory so every literal looks fine.
 */

/**
 * Enough color tokens to clear the 200-token floor, plus one whose value
 * matches a planted docs literal.
 *
 * @returns {string}
 */
function tokenSheet() {
  const decls = ['  --ds-border: #bec8ca;'];
  for (let i = 0; i < 200; i += 1) {
    decls.push(`  --ds-n${i}: #${(i + 1).toString(16).padStart(6, '0')};`);
  }
  return `:root {\n${decls.join('\n')}\n}\n`;
}

test('a hand-planted hex in a fixture docs stylesheet is a finding', () => {
  const { root, done } = policyTree({
    'design-system/src/tokens/color/_semantic.scss': tokenSheet(),
    '.storybook/storybook-overrides.css': '.sb-ds-doc-section { border-bottom: 1px solid #bec8ca; }\n',
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /#bec8ca/.test(message) && /--ds-border/.test(message)),
      `expected a token-literal finding, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('an empty token directory fires the sentinel floor, not a clean sweep', () => {
  const { root, done } = policyTree({
    '.storybook/storybook-overrides.css': '.sb-ds-doc-section { border-bottom: 1px solid #bec8ca; }\n',
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty token directory must not report a clean sweep');
    assert.ok(
      found.some((message) => /indexed 0 tokens/.test(message) && /expected at least 200/.test(message)),
      `expected the token-table floor, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

// ── the chrome vocabulary guard ─────────────────────────────────────────────

test('chrome 1. a raw hex in a chrome stylesheet is caught even when no token carries it', () => {
  const hit = chromeFindings('.a {\n  color: #123456;\n}\n', { css: true });
  assert.deepEqual(hit.map((f) => [f.kind, f.literal, f.line]), [['hex', '#123456', 2]]);
});

test('chrome 1b. green twin: a token, and a hex that only a comment mentions', () => {
  const clean = '/* Bootstrap paints code #d63384 */\n.a {\n  color: var(--ds-text);\n}\n';
  assert.deepEqual(chromeFindings(clean, { css: true }), []);
});

test('chrome 2. a pre-ladder token name is caught, in a stylesheet and in a component style', () => {
  const css = '.a { color: var(--color-gone); margin: var(--size-gone); }';
  assert.deepEqual(
    chromeFindings(css, { css: true }).map((f) => f.literal),
    ['--color-gone', '--size-gone'],
  );
  const jsx = "const s = { borderRadius: 'var(--size-gone)', gap: 'var(--element-stack-md)' };";
  assert.deepEqual(
    chromeFindings(jsx, { css: false }).map((f) => f.literal),
    ['--size-gone', '--element-stack-md'],
  );
  assert.deepEqual(
    chromeFindings('.a { font-family: var(--font-family-h9); font-weight: var(--font-weight-semibold-9); }', { css: true }).map((f) => f.literal),
    ['--font-family-h9', '--font-weight-semibold-9'],
  );
});

test('chrome 2b. green twin: the current vocabulary, and a definition that is not a use', () => {
  const clean =
    '@theme inline { --color-card: var(--card); }\n' +
    '.a { color: var(--ds-text); gap: var(--section-stack-md); font-size: var(--font-size-100); font-size: var(--font-size-display9); font-family: var(--type-family-body); }';
  assert.deepEqual(chromeFindings(clean, { css: true }), []);
});

test('chrome 3. a hex string in a component is caught; an anchor like "#top" is not', () => {
  assert.deepEqual(chromeFindings("const c = '#0472a8';", { css: false }).map((f) => f.literal.trim()), ["'#0472a8"]);
  assert.deepEqual(chromeFindings('<a href="#top">x</a>', { css: false }), []);
});

test('chrome 4. run() reports the planted hex and the retired token in the live corpus layout', () => {
  const { root, done } = policyTree({
    'design-system/src/tokens/color/_semantic.scss': tokenSheet(),
    '.storybook/storybook-overrides.css': '.a { color: #123456; margin: var(--size-gone-too); }\n',
    'design-system/src/storybook-docs/x.jsx': "export const s = { borderRadius: 'var(--size-gone)' };\n",
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(found.some((m) => /raw hex #123456/.test(m)), found.join('\n'));
    assert.ok(found.some((m) => /retired token --size-gone-too/.test(m)), found.join('\n'));
    assert.ok(found.some((m) => /retired token --size-gone/.test(m)), found.join('\n'));
  } finally {
    done();
  }
});

test('chrome 5. a hex inside a class or a shorthand string is caught, and so is a retired line-height', () => {
  assert.deepEqual(chromeFindings('<i className="bg-[#fff0aa]" />', { css: false }).map((f) => f.literal.trim()), ['[#fff0aa']);
  assert.deepEqual(chromeFindings("const b = '1px solid #ccc123';", { css: false }).map((f) => f.kind).sort(), ['dimension', 'hex']);
  assert.deepEqual(chromeFindings('.a { line-height: var(--font-line-height-x); }', { css: true }).map((f) => f.literal), ['--font-line-height-x']);
  assert.deepEqual(chromeFindings('<a href="#add">x</a>', { css: false }), []);
});

test('chrome 6. any raw size or color function is caught, token or not', () => {
  assert.deepEqual(chromeFindings('.a { font-size: 13px; padding: 1.5rem; }', { css: true }).map((f) => f.literal), ['13px', '1.5rem']);
  assert.deepEqual(chromeFindings('.a { background: color-mix(in srgb, var(--ds-border) 50%, transparent); }', { css: true }).map((f) => f.kind), ['color-fn']);
  assert.deepEqual(chromeFindings("<div style={{ minHeight: '96px' }} />", { css: false }).map((f) => f.literal), ['96px']);
});

test('chrome 7. media conditions, prose and a docs-literal: reason pass', () => {
  assert.deepEqual(chromeFindings('@media (min-width: 768px) {\n  .a { gap: var(--stack-sm); }\n}', { css: true }), []);
  assert.deepEqual(chromeFindings('/* the 200px card */\n.a { gap: var(--stack-sm); }', { css: true }), []);
  assert.deepEqual(chromeFindings('.a {\n  /* docs-literal: the manager has no tokens. */\n  border-radius: 0.375rem;\n}', { css: true }), []);
  assert.deepEqual(chromeFindings("const s = 'var(--x)'; // tokens only", { css: false }), []);
});

// ── the illustration kit ────────────────────────────────────────────────────

test('kit 1. a paint, stroke width or corner radius that is not a token is caught in the kit', () => {
  const jsx = [
    '<rect fill="red" />',
    '<rect fill="#fff" />',
    '<rect stroke="rgb(0 0 0)" />',
    '<rect strokeWidth={2} rx="4" />',
    "<rect style={{ rx: '4px' }} />",
  ].join('\n');
  const kinds = chromeFindings(jsx, { css: false, kit: true })
    .filter((f) => f.kind === 'kit')
    .map((f) => f.line);
  assert.deepEqual(kinds, [1, 2, 3, 4, 4, 5], 'every untokened paint, width and corner in the kit');
  const all = chromeFindings(jsx, { css: false, kit: true }).map((f) => [f.line, f.kind]);
  assert.ok(all.some(([l, k]) => l === 3 && k === 'color-fn'));
  assert.ok(all.some(([l, k]) => l === 5 && k === 'dimension'));
});

test('kit 1b. green twin: tokens, none and currentColor pass in the kit', () => {
  const jsx = [
    '<rect fill="var(--ds-surface)" stroke="var(--ds-border)" style={{ rx: "var(--radius-025)" }} />',
    '<rect fill="none" stroke="var(--ds-border-bold)" strokeWidth="var(--stroke-1)" />',
    '<path fill={fill} stroke={stroke} />',
  ].join('\n');
  assert.deepEqual(chromeFindings(jsx, { css: false, kit: true }), []);
});

test('kit 1c. the kit rule is the kit\'s own: the same attribute elsewhere in the docs is not a kit finding', () => {
  assert.deepEqual(chromeFindings('<rect fill="red" />', { css: false }), []);
});

test('kit 2. run() reports a raw paint planted in the kit folder and not one beside it', () => {
  const { root, done } = policyTree({
    'design-system/src/tokens/color/_semantic.scss': tokenSheet(),
    '.storybook/storybook-overrides.css': '.a { color: var(--ds-border); }\n',
    'design-system/src/storybook-docs/illustrations/Bad.jsx': 'export const Bad = () => <rect fill="teal" />;\n',
    'design-system/src/storybook-docs/Beside.jsx': 'export const Beside = () => <rect fill="teal" />;\n',
  });
  try {
    const found = messagesOf(run, root);
    assert.equal(found.filter((m) => /kit drawing fill=teal/.test(m)).length, 1, found.join('\n'));
  } finally {
    done();
  }
});
