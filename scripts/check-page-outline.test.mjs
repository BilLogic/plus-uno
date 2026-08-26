/**
 * Tests for the #243 page-outline guard — both halves of it.
 *
 * A guard nobody has watched fail is a guard nobody knows works (#191). This
 * guard has two halves that fail in different places, so both are exercised
 * here:
 *
 *   - `pageOutlineFailure` from `.storybook/page-outline.js` is the assertion
 *     the browser suite runs. It only touches four DOM methods, so it is driven
 *     here over a hand-built stub rather than a real browser: `node --test` has
 *     no DOM, and the point of these cases is the DECISION, not the rendering.
 *     The rendering half is demonstrated end-to-end by reverting a page's
 *     `title` and watching `check:storybook` go red — see the PR for #243.
 *
 *   - `assertRegistered` and `metaTitle` from `check-page-outline.mjs` are what
 *     stop the assertion running over nothing. The disarm cases below are the
 *     important ones: deleting one import line is a completely silent way to
 *     turn the browser assertion off, and silence is what this repo keeps
 *     getting caught by.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { pageOutlineFailure, IS_PAGE } from '../.storybook/page-outline.js';
import { assertRegistered, isPageTitle, metaTitle, isPagePath } from './check-page-outline.mjs';

/**
 * The smallest DOM `pageOutlineFailure` needs: document-ordered headings, each
 * able to say whether it is laid out and whether an `aria-hidden` ancestor
 * covers it.
 * @param {Array<[string, string] | [string, string, {hidden?: boolean, ariaHidden?: boolean}]>} spec
 */
function dom(spec) {
  const nodes = spec.map(([tag, text, opts = {}]) => ({
    tagName: tag.toUpperCase(),
    textContent: text,
    getClientRects: () => (opts.hidden ? [] : [{}]),
    closest: (sel) => (opts.ariaHidden && sel === '[aria-hidden="true"]' ? {} : null),
  }));
  return { querySelectorAll: () => nodes };
}

test('a page whose outline starts at h1 passes', () => {
  assert.equal(pageOutlineFailure(dom([['h1', 'Sessions'], ['h2', 'Your Sessions'], ['h3', 'All Sessions']])), null);
});

test('the defect #243 was filed for: an outline with no h1 at all', () => {
  // `Specs/Toolkit/Pre-Session/Pages/All Sessions` as it stood on f4e58291.
  const failure = pageOutlineFailure(dom([['h4', 'Your Sessions'], ['h4', 'All Sessions']]));
  assert.match(failure, /renders no <h1>/);
  assert.match(failure, /outline starts at <h4> "Your Sessions"/);
});

test('a page with no headings whatsoever is named as such', () => {
  // `LessonsOverviewPage` renders none. "No h1" and "no headings" want
  // different fixes, so the message distinguishes them.
  assert.match(pageOutlineFailure(dom([])), /no headings at all/);
});

test('an h1 buried below other headings is not a top', () => {
  // The case that "at least one h1" alone would wave through.
  const failure = pageOutlineFailure(dom([['h2', 'Section'], ['h1', 'Page']]));
  assert.match(failure, /not the top of its outline/);
  assert.match(failure, /1 heading\(s\) come before it/);
});

test('a visually-hidden h1 counts — that is how PageLayout supplies it', () => {
  // Off-screen and clipped, but laid out and in the accessibility tree. If this
  // regressed to "must be visible", every page the shell titles would go red.
  assert.equal(pageOutlineFailure(dom([['h1', 'Sessions'], ['h2', 'Your Sessions']])), null);
});

test('a display:none h1 does not count', () => {
  // No client rects, so no accessibility tree, so no outline top. axe ignores
  // such a heading too, which is what keeps this and `heading-order` agreeing.
  assert.match(pageOutlineFailure(dom([['h1', 'Hidden', { hidden: true }], ['h4', 'Your Sessions']])), /renders no <h1>/);
});

test('an aria-hidden heading is ignored on both sides of the question', () => {
  // Highcharts emits `<h6>Chart</h6>` inside its screen-reader region. It must
  // not be read as "a heading before the h1", or every charted Admin page fails.
  assert.equal(
    pageOutlineFailure(dom([['h6', 'Chart', { ariaHidden: true }], ['h1', 'Tutor Performance'], ['h2', 'Overview']])),
    null,
  );
});

test('a display:none heading before the h1 is ignored too', () => {
  // Closed modals stay in the DOM on several page stories.
  assert.equal(pageOutlineFailure(dom([['h4', 'Closed modal', { hidden: true }], ['h1', 'Sessions']])), null);
});

test('the two page predicates agree, in both directions', () => {
  // They are written twice, once per language. `assertRegistered` guards the
  // shape of the runtime one; this guards the behaviour.
  const cases = [
    'Specs/Toolkit/Pre-Session/Pages/All Sessions',
    'Specs/Admin/Overview',
    'Specs/Universal/Overview',
    'Specs/Home/Sections/Students Overview',
    'Components/Status and loading/Badge',
    'Specs/Universal/Sections/Top Bar',
  ];
  for (const t of cases) assert.equal(IS_PAGE(t), isPageTitle(t), t);
});

test('a fragment story is not a page', () => {
  // The reason the population is a decision and not "every story". An `<h1>` in
  // a Badge story would be wrong — the story is not a document.
  assert.equal(isPageTitle('Components/Status and loading/Badge'), false);
  assert.equal(isPageTitle('Specs/Home/Sections/Students Overview'), false);
});

test('metaTitle reads the default export, not the first title in the file', () => {
  // The first draft returned 'Giving Effective Praise' for
  // LessonsOverviewPage.stories.jsx — a `title` on a lesson fixture declared
  // above the meta. That would have dropped a real page out of the population.
  const src = `
const sampleLessons = [
    { id: 1, title: 'Giving Effective Praise' },
];

export default {
    title: 'Specs/Training/Lessons/Pages/Lessons Overview Page',
};
`;
  assert.equal(metaTitle(src), 'Specs/Training/Lessons/Pages/Lessons Overview Page');
});

test('metaTitle reports a missing meta title rather than guessing', () => {
  assert.equal(metaTitle('export const Overview = () => null;'), null);
});

test('isPagePath keys on a Pages/ directory, not on the word appearing anywhere', () => {
  assert.equal(isPagePath('Toolkit/Pre-Session/Pages/AllSessions.stories.jsx'), true);
  assert.equal(isPagePath('Universal/Sections/TopBar/TopBar.stories.jsx'), false);
  assert.equal(isPagePath('Admin/PagesOfNotes/Thing.stories.jsx'), false);
});

const GOOD_SETUP = `
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.jsx';
import { pageOutlineAnnotations } from './page-outline.js';

setProjectAnnotations([a11yAddonAnnotations, projectAnnotations, pageOutlineAnnotations]);
`;
const GOOD_ASSERTION = `
export const IS_PAGE = (title) => title.includes('/Pages/');
export const pageOutlineAnnotations = { afterEach() {} };
`;

test('a correctly wired suite reports nothing', () => {
  assert.deepEqual(assertRegistered(GOOD_SETUP, GOOD_ASSERTION), []);
});

test('deleting the import disarms the assertion, and is caught', () => {
  // The whole reason this script exists. Removing one line makes every page
  // story pass without being looked at, and nothing else in the repo notices.
  const disarmed = GOOD_SETUP.replace(/import \{ pageOutlineAnnotations \}.*\n/, '');
  const findings = assertRegistered(disarmed, GOOD_ASSERTION);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /no longer imports \.\/page-outline\.js/);
});

test('importing but not registering is the same silence, and is also caught', () => {
  const disarmed = GOOD_SETUP.replace(', pageOutlineAnnotations]', ']');
  const findings = assertRegistered(disarmed, GOOD_ASSERTION);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /no longer passes pageOutlineAnnotations/);
});

test('an assertion module that stopped exporting its annotations is caught', () => {
  const stripped = GOOD_ASSERTION.replace(/export const pageOutlineAnnotations.*\n/, '');
  const findings = assertRegistered(GOOD_SETUP, stripped);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /no longer exports pageOutlineAnnotations/);
});

test('a runtime predicate that narrowed away from /Pages/ is caught', () => {
  // Narrowing IS_PAGE is how the assertion would keep passing over a shrinking
  // set while this script went on comparing against the wrong population.
  const narrowed = GOOD_ASSERTION.replace("title.includes('/Pages/')", "title === 'Specs/Admin/Overview'");
  const findings = assertRegistered(GOOD_SETUP, narrowed);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /no longer selects on '\/Pages\/'/);
});
