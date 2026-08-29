#!/usr/bin/env node
/**
 * check:docs-tabs — the component docs pages' tab split holds its shape (ADR-025).
 *
 * WHAT MOVED, AND WHY THIS EXISTS. Examples · Code · Usage · Changelog used to be
 * Storybook `types.TAB` addons drawn in the manager's preview toolbar. That
 * toolbar is in a different document from `<Title />`, so it could never render
 * below the title; the tabs are now part of the docs page itself. Tab membership
 * therefore lives in 49 MDX files as `<DocsTab tab="…">` wrappers, and this is
 * what stops those 49 drifting apart.
 *
 * WHY NOT THE VITEST CONTRACT TEST. `design-system/tests/component-tabs-contract.test.js`
 * holds the pure half — ids, order, changelog shape — and still does. It cannot
 * hold THIS half: it runs under the design-system's vitest project, which cannot
 * execute inside a `.claude/worktrees/` checkout at all (module paths resolve to
 * the parent's `node_modules`). An assertion that cannot be run locally cannot be
 * watched failing, and one that has only ever been seen passing is not evidence.
 * `scripts/*.test.mjs` runs anywhere, so the file-shape assertions live here.
 *
 * WHAT IT CANNOT SEE. Whether a tab RENDERS. Only a browser knows that, and
 * `check:storybook`'s 1136 tests are story tests — docs pages are not in that
 * suite. This checks the markup that decides membership, and nothing downstream
 * of it. Said plainly so the green line is not mistaken for more than it is.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TABBED_EXCEPTIONS,
  isTabbedDocsPage,
} from '../design-system/src/storybook-docs/lib/component-tabs-contract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MDX_ROOT = 'design-system/src';

/**
 * The headings that belong to the Usage tab.
 *
 * `When to use` and `Correct and incorrect` co-occur in exactly the same 15
 * files and `Accessibility` adds 3 more; `Usage notes` is what Navbar and Table
 * call the same thing. The `showLabel` entry is Input's, and it is here on the
 * merits — it argues why a label cannot be removed — which also keeps the only
 * WITHIN-page cross-reference in the corpus (Input.mdx, inside Accessibility)
 * pointing at something in the same tab. It is not the only cross-reference:
 * #253 measured a second, missed by the audit before it, where
 * DateAndTimePicker.mdx names that same heading "in the Input docs". That one
 * is across pages, so no tab split can strand it.
 *
 * `When not to use` is deliberately absent, and the reason changed in #253
 * without the answer changing. It used to be bold prose inside `When to use`;
 * it is now `### When not to use`, a real heading in all 15 files. `HEADING`
 * below matches `##` and only `##`, so a `###` is not a section, does not open
 * one, and is not counted by assertion 5 — which is what lets 62 promoted
 * sub-headings land without moving a single count. It still travels with its
 * parent; it is now nested under it rather than loose inside it.
 *
 * #253 also renamed every `Variants` / `Styles` section. It did NOT collapse
 * them onto one word: a benchmark of 328 Atlassian doc files found `## Variants`
 * 0 times and `## Styles` 0 times, and `## Appearance` 29 times — used only where
 * the component has an appearance prop taking semantic values, with every other
 * such section named for its actual subject (`Positioning`, `Animation`,
 * `Colors`, `Segments`). So each of our 24 took the name of what it shows.
 * `Interaction states` folded into `States`, which Atlassian does use.
 *
 * None of those names is in this set or near one, so the set did not move: they
 * all live on the Examples side, before and after.
 */
const USAGE_HEADINGS = new Set([
  'When to use',
  'Accessibility',
  'Usage notes',
  'Related',
  'Why `showLabel` cannot take the name away',
]);

/**
 * Headings #254 retired, and which must never come back.
 *
 * `Correct and incorrect` was a category, not a rule. It collected every
 * do/don't pair on a page into one block, so a reader had to re-derive which
 * rule each pair illustrated. The benchmark has no equivalent: all 33 do/don't
 * grids across ~28 Atlassian packages sit under the specific `###` rule they
 * illustrate, immediately after the paragraph explaining why.
 *
 * `When not to use` was bold prose, then a `###` after #253, and in both forms
 * it answered a question that belongs somewhere else — if the answer is "use a
 * different component", it is a `Related` bullet; if the failure is visual, it
 * is a don't card under the rule it breaks.
 */
const RETIRED_HEADINGS = new Map([
  ['Correct and incorrect', 'dissolve it: move each pair under the rule it illustrates (#254)'],
  ['When not to use', 'move each case to a `Related` bullet or a don\'t card (#254)'],
]);

const SECTION_OPEN = '<div className="sb-ds-doc-section">';
const HEADING = /^##\s+(.*?)\s*$/;
const TAB_OPEN = /^<DocsTab tab="([a-z]+)">$/;

/** Every `.mdx` under `design-system/src`, repo-relative. */
function allMdx(dir = path.join(REPO_ROOT, MDX_ROOT), found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) allMdx(full, found);
    else if (entry.name.endsWith('.mdx')) found.push(path.relative(REPO_ROOT, full));
  }
  return found;
}

/**
 * Which tab each section heading sits in, plus the counts that catch a partial
 * edit. Exported for the unit tests, which run it over hand-built strings.
 *
 * @param {string} source The MDX file's text.
 * @returns {{tabs: string[], sections: {heading: string|null, tab: string|null}[],
 *   sectionDivs: number, headings: number, hasWrapper: boolean, hasImport: boolean}}
 */
export function readTabs(source) {
  const lines = source.split('\n');
  const tabs = [];
  const sections = [];
  let current = null;

  for (const line of lines) {
    const open = TAB_OPEN.exec(line.trim());
    if (open) {
      tabs.push(open[1]);
      current = open[1];
      continue;
    }
    if (line.trim() === '</DocsTab>') {
      current = null;
      continue;
    }
    if (line.trim() === SECTION_OPEN) sections.push({ heading: null, tab: current });
    const heading = HEADING.exec(line);
    if (heading && sections.length) {
      const last = sections[sections.length - 1];
      if (last.heading === null) last.heading = heading[1];
    }
  }

  return {
    tabs,
    sections,
    // `###` sub-headings, which are NOT sections — assertion 5 counts `##` only.
    // Needed because #254's retired `When not to use` became a `###` in #253,
    // so a check that looked at sections alone would have gone quietly green.
    subHeadings: lines
      .map((l) => /^###\s+(.*?)\s*$/.exec(l))
      .filter(Boolean)
      .map((m) => m[1]),
    sectionDivs: lines.filter((l) => l.trim() === SECTION_OPEN).length,
    headings: lines.filter((l) => HEADING.test(l)).length,
    hasWrapper: source.includes('<DocsTabs'),
    hasImport: source.includes("from '@/storybook-docs/docs-tabs.jsx'"),
  };
}

/** @returns {string[]} One line per problem; empty when the file is well-formed. */
export function checkFile(file, source, tabbed = isTabbedDocsPage(file)) {
  const found = [];
  const read = readTabs(source);

  // 4. A page outside the set must not sprout tabs. This is the assertion that
  //    catches the failure the OLD mechanism actually had: Storybook never
  //    filtered the tab list, so a Colors foundation page offered a Usage tab.
  if (!tabbed) {
    if (read.hasWrapper) found.push(`${file}: has <DocsTabs> but is not a tabbed docs page.`);
    return found;
  }

  // 1. Exactly one wrapper, and an Examples tab to be the default.
  const wrappers = (source.match(/<DocsTabs\b/g) ?? []).length;
  if (wrappers !== 1) found.push(`${file}: expected exactly 1 <DocsTabs>, found ${wrappers}.`);
  if (!read.hasImport) found.push(`${file}: renders tabs but never imports docs-tabs.jsx.`);
  if (!read.tabs.includes('examples')) found.push(`${file}: has no <DocsTab tab="examples">.`);

  const unknown = read.tabs.filter((t) => t !== 'examples' && t !== 'usage');
  if (unknown.length) {
    found.push(
      `${file}: only "examples" and "usage" are authored — Code and Changelog are ` +
        `generated. Found: ${unknown.join(', ')}.`,
    );
  }

  for (const section of read.sections) {
    // 2. A section outside every tab renders on no tab at all — invisible, and
    //    invisible in a way no browser test here would report.
    if (!section.tab) {
      found.push(`${file}: section ${JSON.stringify(section.heading)} sits outside every tab.`);
      continue;
    }
    // 3. Membership follows the rule, not the author's memory. A retired
    //    heading is skipped here: it has no correct tab, and assertion 7 below
    //    already says what to do with it. Without this, `Correct and incorrect`
    //    coming back would draw both "move it to the examples tab" and
    //    "dissolve it" — and following the first leaves the page still red.
    if (RETIRED_HEADINGS.has(section.heading)) continue;
    const belongs = USAGE_HEADINGS.has(section.heading) ? 'usage' : 'examples';
    if (section.tab !== belongs) {
      found.push(
        `${file}: section ${JSON.stringify(section.heading)} is in the "${section.tab}" ` +
          `tab but belongs in "${belongs}".`,
      );
    }
  }

  // 5. The invariant that made the codemod safe in the first place: one heading
  //    per section div. If they diverge, a section was split or lost its heading.
  if (read.sectionDivs !== read.headings) {
    found.push(
      `${file}: ${read.sectionDivs} section div(s) but ${read.headings} heading(s) — ` +
        `they were one-to-one before the split.`,
    );
  }

  // 6. Two sections on one page cannot carry the same name. #253 renamed every
  //    `Variants` / `Styles` section, and `Spinner.mdx` was the single page
  //    holding both — a rename that mapped the pair onto one word would have
  //    left it with two identical headings: one duplicated anchor, two identical
  //    entries in "On this page", and no way to link to the second.
  //
  //    Spinner is now `Animation` and `Appearance`, which is the answer the
  //    benchmark gave rather than a workaround for the collision — Atlassian's
  //    own spinner page splits at exactly that seam. The assertion stays because
  //    the NEXT rename will not have someone reading all 24 section bodies.
  //
  //    Assertion 5 is silent through exactly that edit — rename a heading and
  //    the counts stay one-to-one — so the invariant that made the tab codemod
  //    safe is not the invariant that makes a RENAME safe. This is the second
  //    one, written down before the next collapse needs it.
  const byName = new Map();
  for (const section of read.sections) {
    if (section.heading === null) continue;
    byName.set(section.heading, (byName.get(section.heading) ?? 0) + 1);
  }
  for (const [heading, count] of byName) {
    if (count > 1) {
      found.push(
        `${file}: ${count} sections named ${JSON.stringify(heading)} — one anchor and one ` +
          `TOC entry between them. Merge them, or give each its own name.`,
      );
    }
  }

  // 7. A retired heading must not come back, at either level. #254 dissolved
  //    two of them, and the reason each was wrong is recorded on the map above
  //    so this check tells the author what to do instead rather than only that
  //    they are wrong.
  for (const [heading, remedy] of RETIRED_HEADINGS) {
    const inSections = read.sections.some((sec) => sec.heading === heading);
    const inSubs = read.subHeadings.includes(heading);
    if (inSections || inSubs) {
      found.push(`${file}: ${JSON.stringify(heading)} was retired — ${remedy}.`);
    }
  }

  // 8. Guidance ends by pointing somewhere else. Across the 204 `usage.mdx`
  //    pages in the Atlassian constellation corpus, 74 carry a `Related`
  //    heading and it is the last section in 73 of them — the one exception is
  //    `button-legacy`, a deprecated page. It goes last because "use a
  //    different component" is the most common answer to "should I use this
  //    one", and a reader who has reached the end of the page is who needs it.
  //
  //    Gated on the tab existing, not on it holding sections: a Usage tab whose
  //    guidance is loose prose, or only `###` rules under no `##`, has no
  //    sections to count, and assertion 5 is silent through it too because it
  //    compares whole-file totals that stay one-to-one. Keyed on `usage.length`
  //    that page would ship guidance with no way out of it, green.
  const usage = read.sections.filter((sec) => sec.tab === 'usage');
  if (read.tabs.includes('usage')) {
    const last = usage[usage.length - 1];
    if (!usage.some((sec) => sec.heading === 'Related')) {
      found.push(`${file}: has a Usage tab but no "Related" section.`);
    } else if (last && last.heading !== 'Related') {
      found.push(
        `${file}: "Related" must be the last Usage section, not ${JSON.stringify(last.heading)}.`,
      );
    }
  }

  return found;
}

function main() {
  const files = allMdx();
  const tabbed = files.filter((f) => isTabbedDocsPage(f));
  const found = files.flatMap((f) =>
    checkFile(f, fs.readFileSync(path.join(REPO_ROOT, f), 'utf8')),
  );

  // The population itself, so a selector that quietly stops matching is loud
  // rather than green. 50 components + the one named exception — Tag and
  // TagGroup took it from 48 in #276, which is the deliberate edit this number
  // is here to force.
  if (tabbed.length !== 51) {
    found.push(
      `expected 51 tabbed docs pages (50 components + ${TABBED_EXCEPTIONS.length} named ` +
        `exception), found ${tabbed.length}. If a component was added or removed, ` +
        `update this number deliberately.`,
    );
  }

  if (found.length) {
    console.error(`[docs-tabs] ${found.length} finding(s):`);
    for (const f of found) console.error(`  ${f}`);
    console.error(
      '\n  -> The tag is the tab. See docs/adr/025 and design-system/src/storybook-docs/docs-tabs.jsx.',
    );
    return 1;
  }

  console.log(
    `[docs-tabs] ${tabbed.length} tabbed docs page(s) of ${files.length} MDX page(s); ` +
      `every section sits in the tab its heading assigns it.`,
  );
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
