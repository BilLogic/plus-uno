/**
 * The three docs-chrome assertions from #263, and the numbers they were built
 * from. Every fixture below is a real measurement taken in a running Storybook
 * against Components/Actions/Button, not an invented shape:
 *
 *   viewport   props table   wrapper   docs body (scroll/client)
 *   1440px     749           750       1140 / 1140
 *    900px     591           470        656 /  600
 *    768px     591           338        656 /  468
 *
 * and two attached canvases on the same page, one with a source panel beneath it
 * and one without, both rendering `border-bottom-width: 0`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { chromeFailures, measureScript } from './docs-chrome.mjs';

const page = (over = {}) => ({
  page: 'components-actions-button--docs',
  width: 1440,
  bodyScroll: 1140,
  bodyClient: 1140,
  canvases: [],
  tables: [],
  ...over,
});

/* ------------------------------------------------- the page must not scroll */

test('a docs body wider than its viewport is reported', () => {
  // The 768px row above: 656 of content in a 468px column.
  const f = chromeFailures([page({ width: 768, bodyScroll: 656, bodyClient: 468 })]);
  assert.equal(f.length, 1);
  assert.match(f[0], /scrolls horizontally/);
  assert.match(f[0], /656/);
});

test('a page that fits reports nothing', () => {
  // The check has to be able to pass. This is the 1440px row.
  assert.deepEqual(chromeFailures([page()]), []);
});

test('a sub-pixel excess is not a defect', () => {
  // Layout widths are fractional; 1140.4 vs 1140 is rounding, not a bleed.
  assert.deepEqual(chromeFailures([page({ bodyScroll: 1141, bodyClient: 1140 })]), []);
  assert.equal(chromeFailures([page({ bodyScroll: 1142, bodyClient: 1140 })]).length, 1);
});

/* --------------------------------------------- a card must not open onto air */

test('an open bottom edge with no panel beneath it is reported', () => {
  const f = chromeFailures([
    page({ canvases: [{ label: 'Sizes', hasActions: false, borderBottomWidth: 0 }] }),
  ]);
  assert.equal(f.length, 1);
  assert.match(f[0], /Sizes/);
  assert.match(f[0], /open bottom edge/);
});

test('an open bottom edge WITH a panel beneath it is correct, not a defect', () => {
  // This is the whole point of the rule that opens it: canvas + extension. A
  // check that failed this would delete the design.
  assert.deepEqual(
    chromeFailures([
      page({ canvases: [{ label: 'Overview', hasActions: true, borderBottomWidth: 0 }] }),
    ]),
    [],
  );
});

test('a closed card with no panel is correct', () => {
  assert.deepEqual(
    chromeFailures([
      page({ canvases: [{ label: 'Sizes', hasActions: false, borderBottomWidth: 1 }] }),
    ]),
    [],
  );
});

/* ----------------------------------------- a wide table must scroll, not spill */

test('a table wider than a non-scrolling wrapper is reported', () => {
  // The 900px row: 591 in 470, overflow-x visible.
  const f = chromeFailures([
    page({
      width: 900,
      tables: [{ label: 'Props', intrinsic: 591, wrapperClient: 470, wrapperOverflowX: 'visible' }],
    }),
  ]);
  assert.equal(f.length, 1);
  assert.match(f[0], /spills rather than scrolling/);
});

test('the same table in a scrolling wrapper is correct', () => {
  // A props table wider than its column is normal — it is what the fix allows.
  for (const overflow of ['auto', 'scroll']) {
    assert.deepEqual(
      chromeFailures([
        page({
          tables: [{ label: 'Props', intrinsic: 591, wrapperClient: 338, wrapperOverflowX: overflow }],
        }),
      ]),
      [],
      overflow,
    );
  }
});

test('a table that fits does not need a scrolling wrapper', () => {
  // The 1440px row: 749 in 750, overflow-x visible, and nothing wrong with it.
  assert.deepEqual(
    chromeFailures([
      page({ tables: [{ label: 'Props', intrinsic: 749, wrapperClient: 750, wrapperOverflowX: 'visible' }] }),
    ]),
    [],
  );
});

/* ------------------------------------------------------- prose is the DS's own */

const prose = (over = {}) => ({
  label: 'p 0: Buttons are interactive',
  fontFamily: '"Merriweather Sans", "Open Sans", sans-serif',
  fontSize: '16px',
  color: 'rgb(25, 28, 30)',
  measure: 74,
  ...over,
});

test("Storybook's own font is reported", () => {
  // What every docs page rendered before #252: Storybook styles prose with
  // `.css-… :where(p:not(…))`, a class in front of a zero-specificity `:where()`,
  // which beats an inherited `!important` outright.
  const f = chromeFailures([
    page({ prose: [prose({ fontFamily: '"Nunito Sans", -apple-system, sans-serif' })] }),
  ]);
  assert.equal(f.length, 1);
  assert.match(f[0], /renders in Nunito Sans/);
});

test('14px prose is reported', () => {
  const f = chromeFailures([page({ prose: [prose({ fontSize: '14px' })] })]);
  assert.equal(f.length, 1);
  assert.match(f[0], /14px, not 16px/);
});

test("Storybook's grey is reported", () => {
  // The one property the old rules never set, which is why prose read #2E3338
  // even on pages where the family was already right.
  const f = chromeFailures([page({ prose: [prose({ color: 'rgb(46, 51, 56)' })] })]);
  assert.equal(f.length, 1);
  assert.match(f[0], /rgb\(46, 51, 56\)/);
});

test('a line longer than 80 characters is reported', () => {
  // 134 was the longest in the corpus sample before the cap.
  const f = chromeFailures([page({ prose: [prose({ measure: 134 })] })]);
  assert.equal(f.length, 1);
  assert.match(f[0], /134 characters per line/);
});

test('80 characters exactly is not a failure', () => {
  // The bar is "at most 80", and an off-by-one here would fail correct pages.
  assert.deepEqual(chromeFailures([page({ prose: [prose({ measure: 80 })] })]), []);
  assert.equal(chromeFailures([page({ prose: [prose({ measure: 81 })] })]).length, 1);
});

test('correct prose reports nothing', () => {
  assert.deepEqual(chromeFailures([page({ prose: [prose(), prose(), prose()] })]), []);
});

test('a page measured before prose was collected does not throw', () => {
  // `prose` is absent from any measurement taken by an older driver, and a gate
  // that crashes on its own history reports nothing at all.
  assert.deepEqual(chromeFailures([{ ...page(), prose: undefined }]), []);
});

/* ------------------------------------------------------------------ reporting */

test('every failure is reported, not just the first', () => {
  // A gate that costs a fix-push-wait cycle per fact is a gate people route around.
  const f = chromeFailures([
    page({
      width: 768,
      bodyScroll: 656,
      bodyClient: 468,
      canvases: [{ label: 'Sizes', hasActions: false, borderBottomWidth: 0 }],
      tables: [{ label: 'Props', intrinsic: 591, wrapperClient: 338, wrapperOverflowX: 'visible' }],
    }),
    page({ width: 1440 }),
  ]);
  assert.equal(f.length, 3);
  assert.ok(f.every((l) => l.startsWith('components-actions-button--docs @ 768px')));
});

/* ----------------------------------------------------------- the measurement */

test('the measured shape is what the assertions read', () => {
  // The script and the assertions have to agree about field names, and they are
  // separated by a browser boundary that no type checker crosses.
  const src = measureScript('x--docs');
  for (const key of ['bodyScroll', 'bodyClient', 'canvases', 'tables', 'hasActions', 'borderBottomWidth', 'intrinsic', 'wrapperClient', 'wrapperOverflowX']) {
    assert.ok(src.includes(key), key);
  }
  assert.ok(src.includes('"x--docs"'));
});
