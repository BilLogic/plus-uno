/**
 * `npm run check:page-outline` — the half of #243's guard that a DOM assertion
 * cannot hold.
 *
 * WHAT THE OTHER HALF IS. `.storybook/page-outline.js` asserts, against the
 * rendered DOM of every page story, that the outline has an `<h1>` and that the
 * `<h1>` comes first. Read its header for why the defect is only visible at
 * runtime and why neither `heading-order` nor `page-has-heading-one` can see it.
 *
 * WHAT THAT HALF CANNOT SEE, WHICH IS WHY THIS EXISTS. Three things, and each
 * one of them is a way for that assertion to keep reporting green over nothing:
 *
 *   1. **It cannot count its own population.** In browser mode each story file
 *      is its own module; there is no "after all files" hook to assert against.
 *      A predicate that stopped matching would simply stop running, on every
 *      file independently, and the suite would go green faster. This is the
 *      exact failure this repo keeps finding — #234's ratchet passing over a
 *      halved corpus, `check:unspread-rest`'s walk returning nothing. So the
 *      population is asserted here, from the filesystem, against a floor.
 *
 *   2. **It cannot see that its predicate has drifted from the tree.** The
 *      assertion selects pages by story TITLE, because a title is all a browser
 *      test is given. The population is defined by PATH — `specs/**​/Pages/**`.
 *      Those two agree today and nothing keeps them agreeing: a new page whose
 *      meta title omits `/Pages/` would be silently unchecked. This compares the
 *      two sets and fails on any disagreement in either direction.
 *
 *   3. **It cannot see itself being unregistered.** Delete the import from
 *      `.storybook/vitest.setup.ts` and every page story passes, with no error
 *      anywhere. That is a one-line, entirely silent disarm, so it is checked.
 *
 * WHY IT IS IN `check:harness` AND THE ASSERTION IS NOT. This one is a file
 * walk and three regexes — milliseconds, no dependencies, so it belongs in the
 * fast gate. The assertion needs a browser and rides `check:storybook`, which
 * that gate deliberately excludes for cost. Between them a PR cannot add a page
 * with no outline top, and cannot quietly narrow what counts as a page.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not try to decide from source
 * whether a given page emits an `<h1>`. 41 of the 42 page stories reach theirs
 * through `PageLayout`, one to four component boundaries away; answering that
 * statically means resolving the module graph and evaluating conditional
 * renders, and getting it wrong reads as green. That question belongs to the
 * DOM assertion and stays there. #242 reached the same conclusion about a
 * `<hN className="hM">` mismatch check: the static shape is not the defect.
 *
 * Usage:
 *   npm run check:page-outline            report every finding; exit 1 if any
 *   npm run check:page-outline -- --list  print the population; exit 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const specsDir = (root = REPO_ROOT) => path.join(root, 'design-system', 'src', 'specs');
const setupFile = (root = REPO_ROOT) => path.join(root, '.storybook', 'vitest.setup.ts');
const assertionFile = (root = REPO_ROOT) => path.join(root, '.storybook', 'page-outline.js');

/**
 * The floor. 42 story files live under `specs/**​/Pages/**` and 3 area overviews
 * sit beside them, measured on `f4e58291`. A ratchet only fails on a rise, and a
 * population check only fails on a mismatch — neither notices a corpus that
 * vanished, so the size is asserted too. Lower it only when a page is genuinely
 * deleted, and say which one in the commit.
 */
const MIN_PAGE_STORIES = 42;
const AREA_OVERVIEWS = 3;

/**
 * The runtime predicate, restated. Kept in step with `IS_PAGE` in
 * `.storybook/page-outline.js` by `assertRegistered` below, which fails if
 * the source of that file stops containing this shape.
 */
export const isPageTitle = (title) =>
  typeof title === 'string' && (title.includes('/Pages/') || /^Specs\/[^/]+\/Overview$/.test(title));

/** Every `*.stories.jsx` under `specs/`, absolute. */
const storyFiles = (dir, repoRoot = REPO_ROOT) =>
  documents(path.relative(repoRoot, dir), { root: repoRoot, ext: ['.stories.jsx'] }).map((rel) =>
    path.join(repoRoot, rel),
  );

/**
 * The `title:` of a story file's default export.
 *
 * Anchored on `export default {` rather than the first `title:` in the file —
 * story files are full of `title` props on sample data, and the first draft of
 * this read `title: 'Giving Effective Praise'` out of a lesson fixture in
 * `LessonsOverviewPage.stories.jsx`.
 * @returns {string | null}
 */
export function metaTitle(src) {
  const start = src.indexOf('export default {');
  if (start === -1) return null;
  const m = /(?:^|\n)\s*title:\s*['"]([^'"]+)['"]/.exec(src.slice(start));
  return m ? m[1] : null;
}

/** File contents, or null when the file is not there. */
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);

/** A story file is a page by PATH when it lives under a `Pages/` directory. */
export const isPagePath = (rel) => rel.split(path.sep).includes('Pages');

/**
 * The walk and the two populations it produces, read once per repo root: the
 * findings, the green line and `--list` all three ask about the same tree.
 */
const inputs = byRoot((repoRoot) => {
  const specs = specsDir(repoRoot);
  const files = storyFiles(specs, repoRoot).sort();
  const titleless = [];
  const byPath = [];
  const byTitle = [];

  for (const file of files) {
    const rel = path.relative(specs, file);
    const title = metaTitle(fs.readFileSync(file, 'utf8'));
    if (title === null) {
      titleless.push(`${path.relative(repoRoot, file)}  has no \`title:\` on its default export`);
      continue;
    }
    if (isPagePath(rel)) byPath.push({ rel, title });
    if (isPageTitle(title)) byTitle.push({ rel, title });
  }

  const pathSet = new Set(byPath.map((e) => e.rel));
  return {
    specs,
    files,
    titleless,
    byPath,
    byTitle,
    pathSet,
    titleSet: new Set(byTitle.map((e) => e.rel)),
    overviews: byTitle.filter((e) => !pathSet.has(e.rel)),
    setupSrc: read(setupFile(repoRoot)),
    assertionSrc: read(assertionFile(repoRoot)),
  };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { specs, files, titleless, byPath, byTitle, pathSet, titleSet, overviews, setupSrc, assertionSrc } =
    inputs(repoRoot);

  if (files.length < 100) {
    return [
      {
        message:
          `found ${files.length} story file(s) under ` +
          `${path.relative(repoRoot, specs)} — expected at least 100.\n` +
          '  -> The corpus moved or the walk broke. A check over nothing passes over everything.',
      },
    ];
  }

  const found = [...titleless];

  // (2) The path-defined population and the title-selected one must agree.
  for (const { rel, title } of byPath) {
    if (!titleSet.has(rel)) {
      found.push(
        `${rel}  lives under Pages/ but its title (${title}) is not selected as a page.\n` +
          '      -> The DOM assertion picks pages by title, so this page is NOT being checked.' +
          '\n         Give it a `Specs/…/Pages/…` title.',
      );
    }
  }
  for (const { rel, title } of byTitle) {
    if (!pathSet.has(rel) && !/^Specs\/[^/]+\/Overview$/.test(title)) {
      found.push(
        `${rel}  is titled as a page (${title}) but does not live under a Pages/ directory.\n` +
          '      -> Either move it, or retitle it. The two definitions of "page" have drifted.',
      );
    }
  }

  // (1) The population must not have collapsed.
  if (byPath.length < MIN_PAGE_STORIES) {
    found.push(
      `only ${byPath.length} page story file(s) under specs/**/Pages/** — expected at least ` +
        `${MIN_PAGE_STORIES}.\n` +
        '      -> Pages were deleted or moved. Lower MIN_PAGE_STORIES deliberately, in a commit' +
        '\n         that says which pages went, or the DOM assertion is guarding a shrinking set.',
    );
  }
  if (overviews.length < AREA_OVERVIEWS) {
    found.push(
      `only ${overviews.length} area-overview story file(s) — expected at least ${AREA_OVERVIEWS}.`,
    );
  }

  // (3) The assertion must still be wired into the suite.
  found.push(...assertRegistered(setupSrc, assertionSrc));

  return found.map((message) => ({ message }));
}

/** The green line, which carries both populations and what agreed about them. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { byPath, overviews } = inputs(repoRoot);
  return (
    `${byPath.length} page + ${overviews.length} overview story file(s), ` +
    'selector agrees with the tree, assertion registered.'
  );
}

/**
 * `--list` prints the population and asserts nothing, so it stays outside
 * `run`: a check the runner imports writes nothing on its own account.
 */
function list(repoRoot = REPO_ROOT) {
  const { byPath, overviews } = inputs(repoRoot);
  console.log(
    `[check:page-outline] ${byPath.length} page story file(s) under specs/**/Pages/** ` +
      `+ ${overviews.length} area overview(s):\n` +
      [...byPath, ...overviews].map((e) => `  ${e.rel}  ${e.title}`).join('\n'),
  );
}

/**
 * The disarm check. Reads the setup file and the assertion module rather than
 * importing them: this script runs with no `npm ci`, so `@storybook/*` is not
 * resolvable and an import would throw where a missing registration should be
 * reported.
 * @returns {string[]}
 */
export function assertRegistered(setupSrc = read(setupFile()), assertionSrc = read(assertionFile())) {
  const findings = [];
  // A deleted file is the loudest disarm of all, and it must read as a finding
  // rather than as an unhandled ENOENT stack trace nobody parses.
  if (setupSrc === null) return ['.storybook/vitest.setup.ts is missing.'];
  if (assertionSrc === null) {
    return ['.storybook/page-outline.js is missing — the browser assertion is gone entirely.'];
  }
  if (!/from\s+['"]\.\/page-outline(\.js)?['"]/.test(setupSrc)) {
    findings.push(
      '.storybook/vitest.setup.ts no longer imports ./page-outline.js.\n' +
        '      -> Every page story would pass without being looked at. Restore the import.',
    );
  }
  if (!/setProjectAnnotations\(\[[^\]]*\bpageOutlineAnnotations\b[^\]]*\]\)/s.test(setupSrc)) {
    findings.push(
      '.storybook/vitest.setup.ts no longer passes pageOutlineAnnotations to' +
        ' setProjectAnnotations.\n' +
        '      -> Imported but not registered is the same silence as not imported.',
    );
  }
  if (!/export\s+const\s+pageOutlineAnnotations\b/.test(assertionSrc)) {
    findings.push('.storybook/page-outline.js no longer exports pageOutlineAnnotations.');
  }
  // The two populations are written twice, once per language. If the runtime
  // predicate stops looking like this one, the set comparison above is
  // comparing against the wrong thing and proves nothing.
  if (!assertionSrc.includes("title.includes('/Pages/')")) {
    findings.push(
      ".storybook/page-outline.js's IS_PAGE no longer selects on '/Pages/'.\n" +
        '      -> This script mirrors that predicate; they have drifted apart.',
    );
  }
  return findings;
}

// path.resolve + fileURLToPath, not string comparison: `file://${argv[1]}` never
// matches once the repo path contains a space or any non-ASCII char, because the
// URL form percent-encodes them. Same idiom as check-unspread-rest.mjs.
// The CLI is one branch or the other. A side flag prints (or writes) instead of
// gating, so the gate does not also run; `main()` re-checks the entry guard for
// itself, which is what keeps an import of this module reaching neither.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) &&
  process.argv.slice(2).includes('--list')
) {
  list();
} else {
  main(import.meta.url, 'check:page-outline', { run, summary });
}
