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
  colourKey,
  dimensionKey,
  blankFallbacks,
  alwaysAllowed,
} from './check-docs-token-literals.mjs';

/** A token table small enough to hold in your head, shaped like the real one. */
const defs = new Map([
  ['--color-outline-variant', { value: '#bec8ca', file: '_colors.scss' }],
  ['--color-scrim', { value: 'rgba(0, 0, 0, 0.38)', file: '_colors.scss' }],
  ['--size-spacing-medium-space-300', { value: '16px', file: '_primitives.scss' }],
  ['--size-section-gap-md', { value: 'var(--size-spacing-medium-space-300)', file: '_spacing_semantics.scss' }],
  ['--size-element-gap-lg', { value: '12px', file: '_spacing_semantics.scss' }],
  ['--size-element-stroke-sm', { value: '1px', file: '_spacing_semantics.scss' }],
  ['--size-page-full', { value: '100%', file: '_layout-ish.scss' }],
  ['--size-nothing', { value: '0px', file: '_primitives.scss' }],
  ['--size-breakpoint-ish', { value: '768px', file: '_layout-ish.scss' }],
  ['--font-size-body1', { value: '1rem', file: '_fonts.scss' }],
  // A family this check does not offer, holding a value the docs might use.
  ['--layout-sidebar-width', { value: '164px', file: '_layout.scss' }],
]);
const index = buildTokenIndex(defs);

const rule = (body) => `.sb-ds-doc-section {\n${body}\n}\n`;
const literals = (css, table = index) => findings(css, table).map((f) => f.literal);

test('a stylesheet that names every value in a token is silent — the green twin every case below needs', () => {
  const clean = rule(
    [
      '  gap: var(--size-section-gap-md);',
      '  margin: 0 0 var(--size-element-gap-lg);',
      '  border-bottom: 1px solid var(--color-outline-variant);',
      '  width: 100%;',
      '  padding: 0;',
    ].join('\n'),
  );
  assert.deepEqual(findings(clean, index), []);
});

test('1. a hand-planted hex colour is caught, and named with the token that already holds it', () => {
  // The #e4e4e7-shaped defect the ticket opens with: a colour picked by hand a
  // few lines from a `var(--color-…)` doing the same job.
  const found = findings(rule('  border-bottom: 1px solid #bec8ca;'), index);
  assert.equal(found.length, 1);
  assert.equal(found[0].literal, '#bec8ca');
  assert.deepEqual(found[0].tokens, ['--color-outline-variant']);
});

test('1b. shorthand hex is the same colour — `#BCA` is `#bbccaa`, and case does not hide it', () => {
  const short = buildTokenIndex(new Map([['--color-x', { value: '#bbccaa', file: '_colors.scss' }]]));
  const found = findings(rule('  color: #BCA;'), short);
  assert.equal(found.length, 1, 'a three-digit hex must expand before it is compared');
  assert.deepEqual(found[0].tokens, ['--color-x']);
  // Green twin: an unrelated colour, correctly spelled, is not a finding.
  assert.deepEqual(literals(rule('  color: #123456;'), short), []);
});

test('1c. `rgba()` is compared by value, not by spelling', () => {
  const found = findings(rule('  background: rgba(0,0,0,.38);'), index);
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].tokens, ['--color-scrim']);
});

test('2. a hand-planted px with a token equivalent is caught', () => {
  const found = findings(rule('  padding: 12px;'), index);
  assert.equal(found.length, 1);
  assert.equal(found[0].literal, '12px');
  assert.deepEqual(found[0].tokens, ['--size-element-gap-lg']);
});

test('2b. rem and px are one scale — `1rem` is the 16px token, or the check misses half the file', () => {
  const found = findings(rule('  gap: 1rem;'), index);
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].tokens, ['--size-section-gap-md', '--size-spacing-medium-space-300']);
});

test('2c. the semantic name is offered before the primitive `_primitives.scss` bans direct use of', () => {
  const [found] = findings(rule('  gap: 16px;'), index);
  assert.equal(found.tokens[0], '--size-section-gap-md');
});

test('2d. every literal in a shorthand is reported, not just the first', () => {
  assert.deepEqual(literals(rule('  padding: 12px 16px;')), ['12px', '16px']);
});

test('3. a `font-size` is never offered a spacing token, and vice versa', () => {
  // `--font-size-body1` is 16px and so is `--size-section-gap-md`. Offering a
  // spacing step for a type size is the noise that gets a report ignored.
  const [size] = findings(rule('  font-size: 16px;'), index);
  assert.deepEqual(size.tokens, ['--font-size-body1']);
  const [gap] = findings(rule('  gap: 16px;'), index);
  assert.ok(!gap.tokens.includes('--font-size-body1'));
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

test('6. ALLOWANCE — the `1px` hairline, even though `--size-element-stroke-sm` is 1px', () => {
  assert.deepEqual(literals(rule('  border: 1px solid #bec8ca;')), ['#bec8ca']);
  assert.deepEqual(literals(rule('  margin-bottom: -1px;')), []);
  // Red twin: 2px is a thickness somebody chose, and is not a hairline.
  const two = buildTokenIndex(new Map([['--size-element-stroke-lg', { value: '2px', file: '_x.scss' }]]));
  assert.deepEqual(literals(rule('  border: 2px solid red;'), two), ['2px']);
});

test('7. ALLOWANCE — a fallback inside `var(--token, fallback)` is the token being used correctly', () => {
  assert.deepEqual(literals(rule('  color: var(--color-outline-variant, #bec8ca);')), []);
  // Nested fallbacks go with the outer one — this is the shape the real file uses.
  assert.deepEqual(
    literals(rule('  color: var(--color-a, var(--color-outline-variant, #bec8ca));')),
    [],
  );
  // Not everything in parentheses is a fallback: `color-mix()` keeps its own
  // arguments, so a literal alongside a guarded token is still seen.
  assert.deepEqual(
    literals(rule('  background: color-mix(in srgb, var(--color-a, #bec8ca) 70%, #bec8ca);')),
    ['#bec8ca'],
  );
  // Red twin: the same colour written bare is a finding.
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

test('11. token families outside colour / font-size / line-height / size are not offered', () => {
  // `--layout-sidebar-width` is 164px. A docs-chrome pixel equal to an app-shell
  // grid measurement is a coincidence, not a token being ignored.
  assert.deepEqual(literals(rule('  width: 164px;')), []);
});

test('12. an alias chain resolves to the literal at its end', () => {
  // `--size-section-gap-md → --size-spacing-medium-space-300 → 16px`. Without
  // this, only the primitives would ever be offered and the report would send
  // people straight at the tokens marked DO NOT USE DIRECTLY.
  assert.ok(index.size.get('16px').some((t) => t.name === '--size-section-gap-md'));
});

test('12b. a cyclic alias does not hang the build', () => {
  const cyclic = new Map([
    ['--size-a', { value: 'var(--size-b)', file: '_x.scss' }],
    ['--size-b', { value: 'var(--size-a)', file: '_x.scss' }],
  ]);
  assert.deepEqual([...buildTokenIndex(cyclic).size.keys()], []);
});

test('unit — the normalisers agree with the shapes the corpus actually contains', () => {
  assert.equal(dimensionKey('0.625rem'), '10px');
  assert.equal(dimensionKey('12PX'), '12px');
  assert.equal(dimensionKey('140%'), '140%');
  assert.equal(dimensionKey('5vw'), null);
  assert.equal(colourKey('#FFF'), '#ffffff');
  assert.equal(colourKey('rgba( 0 , 0 ,0 , .38 )'), 'rgba(0,0,0,0.38)');
  assert.equal(colourKey('transparent'), null);
  assert.equal(blankFallbacks('var(--a, #fff)').includes('#fff'), false);
  assert.equal(blankFallbacks('var(--a)'), 'var(--a)');
  assert.equal(alwaysAllowed('1px'), true);
  assert.equal(alwaysAllowed('2px'), false);
});
