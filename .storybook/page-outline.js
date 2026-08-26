/**
 * The page-outline assertion — every page story's heading outline has a top.
 *
 * WHY IT EXISTS. Measured on `f4e58291`: across `design-system/src/specs/`, 5
 * headings are `<h1>` against 306 `<h6>`, 128 `<h4>`, 52 `<h5>`, 33 `<h2>` and
 * 41 `<h3>` — and one of those five is in `SpecOverview.jsx`, which nothing
 * imports. So of 114 page and area-overview stories, 111 rendered a document
 * whose outline began at level 2, 3 or 4 with nothing above it (#243).
 *
 * WHY `heading-order` CANNOT SEE IT. axe's `heading-order` reports a heading
 * that jumps more than one level below its PREDECESSOR. The first heading on a
 * page has no predecessor, so an outline of `h4 → h4 → h4` passes the rule and
 * still has no top. #242 took `heading-order` from 44 to 0 without changing
 * this at all.
 *
 * WHY `page-has-heading-one` CANNOT SEE IT EITHER, WHICH IS THE WHOLE REASON
 * THIS FILE EXISTS RATHER THAN A BASELINE ENTRY. axe evaluates its page-level
 * rules — `page-has-heading-one`, `landmark-one-main`, `region` — only when the
 * run context is the whole document. `addon-a11y` scopes every run to the story
 * root. That is why no page-level rule appears anywhere in
 * `docs/evals/a11y-baseline.json` while 13 element-level rules do: not because
 * they pass, because they are never evaluated. With 388 story files and 5
 * `<h1>`s, `page-has-heading-one` would otherwise have fired on hundreds.
 * Re-recording the baseline therefore cannot lock this in, and widening the axe
 * context to `document` would evaluate those rules against the test harness's
 * own chrome and against fragment stories that correctly have no `<h1>`.
 *
 * WHAT IT ASSERTS, AND WHY THESE TWO THINGS. Per page story:
 *
 *   1. the canvas contains at least one `<h1>`;
 *   2. no `<h2>`–`<h6>` precedes the first `<h1>` in document order.
 *
 * (1) alone would pass on a page that buries an `<h1>` in the middle of its
 * outline, which is not a document top. (2) alone is vacuously true of a page
 * with no headings at all. Together they say "the outline has a top, and the
 * top is where a top goes", which is the substantive defect. Everything BELOW
 * the top is `heading-order`'s job, and it is already at 0 — the two guards
 * compose, neither duplicates the other.
 *
 * WHY IT IS AN ASSERTION AND NOT A STATIC CHECK. Grep cannot answer this. 41 of
 * the 42 page stories reach their `<h1>` through `specs/Universal/Pages/
 * PageLayout`, one to four component boundaries away from the story file, and
 * the ones that carry their own render it from inside a card
 * (`LoginPortal`). A static check would have to resolve the module graph and
 * evaluate conditional renders to know what a page actually emits, and would be
 * wrong in exactly the direction that matters — reporting green for a page
 * whose `<h1>` is behind a branch that never runs. This reads the rendered DOM,
 * so it sees the `<h1>` wherever it comes from and only when it is really
 * there. #242's conclusion about a `<hN className="hM">` mismatch check applies
 * with full force: the static shape of the thing is not the defect.
 *
 * WHERE IT RUNS. `.storybook/vitest.setup.ts` only, never `preview.jsx` — so it
 * runs in `npm run check:storybook` and does not turn a designer's Storybook
 * into a wall of failed interactions. A failure here carries no axe message, so
 * `scripts/check-storybook.mjs` classifies it as a BLOCKING failure rather than
 * a ratcheted a11y violation, which is right: an outline with no top is a
 * defect a change introduced, not one inherited from before the gate existed.
 *
 * WHAT STOPS IT PASSING VACUOUSLY. It cannot count its own population — in
 * browser mode each story file is its own module, so there is no "after all
 * files" hook to assert against. `scripts/check-page-outline.mjs` holds that
 * half: it checks that IS_PAGE below still selects exactly the story files under
 * `specs/**​/Pages/**` plus the three area overviews, that the population has
 * not collapsed, and that this file is still registered in
 * `.storybook/vitest.setup.ts`. Deleting the registration is the one way to
 * switch this off silently, and that check is what makes it loud.
 */

/**
 * Which stories are pages. See `scripts/check-page-outline.mjs`, which asserts
 * this predicate still picks out exactly the intended files — the two must be
 * changed together, and that check fails if they drift.
 *
 * `Specs/…/Pages/…` is every story under `design-system/src/specs/**​/Pages/**`.
 * `Specs/<Area>/Overview` is the three area-overview stories (Admin, Training,
 * Universal), which are documents in their own right. Everything else under
 * `specs/` is a fragment — an `<h1>` in a `Badge` story would be wrong, because
 * a fragment is not a document.
 */
export const IS_PAGE = (title) =>
  typeof title === 'string' && (title.includes('/Pages/') || /^Specs\/[^/]+\/Overview$/.test(title));

/**
 * Headings a screen reader would reach. `display: none` subtrees have no client
 * rects, and `aria-hidden` subtrees are out of the accessibility tree — both are
 * invisible to axe too, so excluding them keeps this assertion and
 * `heading-order` looking at the same set of elements. A visually-hidden
 * heading (off-screen, clipped) still has a client rect and is still announced,
 * which is exactly what `PageLayout`'s `<h1>` relies on.
 */
function exposedHeadings(root) {
  return Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"]'),
  );
}

const describe = (el) => {
  const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  return `<${el.tagName.toLowerCase()}>${text ? ` "${text}"` : ''}`;
};

const GUIDANCE =
  '\n  -> A page owns a document, and a document needs a top. Pass `title` to' +
  '\n     PageLayout (specs/Universal/Pages/PageLayout) — it renders the `<h1>`' +
  '\n     as the first element of <main>, visually hidden, so nothing moves on' +
  '\n     screen. A page that renders its own visible title heading marks THAT' +
  '\n     heading up as the `<h1>` and leaves `title` unset instead.' +
  '\n     See design-system/src/styles/Accessibility.mdx § The top of the outline.';

/**
 * The assertion itself, separated from the annotation so its unit tests can run
 * it over a hand-built DOM. Returns null when the outline is well-formed and a
 * message when it is not.
 * @param {ParentNode} root
 * @returns {string | null}
 */
export function pageOutlineFailure(root) {
  const headings = exposedHeadings(root);
  const firstH1 = headings.findIndex((el) => el.tagName === 'H1');

  if (firstH1 === -1) {
    return headings.length === 0
      ? 'this page story renders no <h1> — in fact no headings at all.'
      : `this page story renders no <h1>. Its outline starts at ${describe(headings[0])}.`;
  }

  if (firstH1 > 0) {
    return (
      `this page story's <h1> is not the top of its outline — ${firstH1} heading(s) ` +
      `come before it, starting with ${describe(headings[0])}.`
    );
  }

  return null;
}

/**
 * Storybook preview annotations. `afterEach` runs after the story has rendered
 * and after any `play`, which is when the DOM is what a reader would meet.
 */
export const pageOutlineAnnotations = {
  afterEach(context) {
    if (!IS_PAGE(context?.title) || !context?.canvasElement) return;
    const failure = pageOutlineFailure(context.canvasElement);
    if (failure) {
      throw new Error(`[page-outline] ${context.id}: ${failure}${GUIDANCE}`);
    }
  },
};
