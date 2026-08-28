/**
 * Every assertion in `check:docs-tabs`, watched failing.
 *
 * A check that has only ever been seen passing is not evidence — this repo has
 * shipped generators that wrote a file then compared it to itself, a guard whose
 * CLI entry never ran under paths containing spaces, and an acceptance criterion
 * that was green before its own fix. So each case below hands `checkFile` a
 * deliberately broken page and asserts the specific complaint, and each has a
 * green twin so a check that simply always failed would not pass this file.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { checkFile, readTabs } from './check-docs-tabs.mjs';

const COMPONENT = 'design-system/src/components/actions/Button/Button.mdx';
const FOUNDATION = 'design-system/src/styles/Colors.mdx';

const section = (heading) => `<div className="sb-ds-doc-section">\n\n## ${heading}\n\nbody\n\n</div>`;

const page = ({ tabs = true, examples = ['Overview'], usage = [], extra = '' } = {}) => {
  const body = [];
  if (tabs) {
    body.push("import { DocsTabs, DocsTab } from '@/storybook-docs/docs-tabs.jsx';");
    body.push('<DocsTabs of={S}>');
    body.push('<DocsTab tab="examples">');
    body.push(...examples.map(section));
    body.push('</DocsTab>');
    if (usage.length) {
      body.push('<DocsTab tab="usage">');
      body.push(...usage.map(section));
      body.push('</DocsTab>');
    }
    body.push('</DocsTabs>');
  }
  if (extra) body.push(extra);
  return body.join('\n\n');
};

test('a well-formed page is silent — the green twin every case below needs', () => {
  const ok = page({
    examples: ['Overview', 'Variants'],
    usage: ['When to use', 'Accessibility', 'Related'],
  });
  assert.deepEqual(checkFile(COMPONENT, ok, true), []);
});

test('1. a page missing its <DocsTabs> wrapper is caught', () => {
  const broken = page({ tabs: false, extra: section('Overview') });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /expected exactly 1 <DocsTabs>, found 0/.test(f)), found.join('\n'));
});

test('1b. a page that renders tabs without importing them is caught', () => {
  const broken = page().replace("import { DocsTabs, DocsTab } from '@/storybook-docs/docs-tabs.jsx';\n\n", '');
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /never imports docs-tabs\.jsx/.test(f)), found.join('\n'));
});

test('2. a section left outside every tab is caught', () => {
  // The failure mode a partial edit produces: the wrapper is there, the section
  // is not inside it, and the section renders on no tab at all.
  const broken = `${page()}\n\n${section('Stranded')}`;
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /"Stranded" sits outside every tab/.test(f)), found.join('\n'));
});

test('3. a Usage section stranded in the Examples tab is caught', () => {
  const broken = page({ examples: ['Overview', 'Accessibility'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(
    found.some((f) => /"Accessibility" is in the "examples" tab but belongs in "usage"/.test(f)),
    found.join('\n'),
  );
});

test('3b. an Examples section pulled into Usage is caught — the rule runs both ways', () => {
  const broken = page({ examples: ['Overview'], usage: ['When to use', 'Variants'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(
    found.some((f) => /"Variants" is in the "usage" tab but belongs in "examples"/.test(f)),
    found.join('\n'),
  );
});

test('3c. a `###` sub-heading is not a section — the `##`-only regex is load-bearing', () => {
  // #253 promoted 62 rule intros from bold prose to `###`, and #254 moved them
  // under the rules they illustrate. `HEADING` matches `##` and only `##`, so
  // none of the 62 opens a section, none is assigned a tab, and none is counted
  // by assertion 5. That regex is one character away from swallowing `###`, and
  // if it did, every one of those pages would go red for a reason no one would
  // connect to a heading level. So it is asserted here.
  const withSub = page({ examples: ['Overview'], usage: ['When to use', 'Related'] }).replace(
    '## When to use\n\nbody',
    '## When to use\n\nbody\n\n### Loading is not a substitute for feedback.\n\nmore body',
  );
  const read = readTabs(withSub);
  assert.equal(read.headings, 3, 'Overview, When to use, Related — the `###` is not a heading here');
  assert.equal(read.sectionDivs, 3);
  assert.deepEqual(checkFile(COMPONENT, withSub, true), []);

  // The failing twin: the same line written as `##` IS a section, and one with
  // no div of its own, so the one-to-one invariant fires. Without this the case
  // above would pass on a `readTabs` that had simply stopped seeing headings.
  const asSection = withSub.replace(
    '### Loading is not a substitute for feedback.',
    '## Loading is not a substitute for feedback.',
  );
  const found = checkFile(COMPONENT, asSection, true);
  assert.ok(found.some((f) => /3 section div\(s\) but 4 heading\(s\)/.test(f)), found.join('\n'));
});

test('4. a foundation page that sprouts tabs is caught — the old mechanism\'s actual bug', () => {
  const found = checkFile(FOUNDATION, page(), false);
  assert.ok(found.some((f) => /is not a tabbed docs page/.test(f)), found.join('\n'));
  // ...and the same page without tabs is fine, so this is not just "always red".
  assert.deepEqual(checkFile(FOUNDATION, '## Palette\n\nbody', false), []);
});

test('5. a section div that lost its heading breaks the one-to-one invariant', () => {
  const broken = page().replace('## Overview\n\n', '');
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /section div\(s\) but 0 heading\(s\)/.test(f)), found.join('\n'));
});

test('6. two sections sharing a name are caught — and assertion 5 cannot see them', () => {
  // The collision #253 would have shipped blind. `Spinner.mdx` was the one page
  // carrying both `## Variants` and `## Styles`; any rename mapping that pair
  // onto a single word leaves two identically named sections, one anchor between
  // them and two identical "On this page" entries. (Spinner ended up split into
  // `Animation` and `Appearance` instead — but the trap is the rename, not that
  // one page, so this stays.)
  const broken = page({ examples: ['Overview', 'Variants', 'Variants'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /2 sections named "Variants"/.test(f)), found.join('\n'));

  // The reason it had to be its own assertion: a rename keeps the counts
  // one-to-one, so assertion 5 stays silent on the very page that is broken.
  assert.ok(!found.some((f) => /section div\(s\) but/.test(f)), found.join('\n'));

  // The green twin — the same page with the two names distinct is silent.
  const ok = page({ examples: ['Overview', 'Variants', 'States'] });
  assert.deepEqual(checkFile(COMPONENT, ok, true), []);
});

test('7. a retired heading is caught at `##` — with the remedy, not just a verdict', () => {
  const broken = page({ examples: ['Overview'], usage: ['When to use', 'When not to use', 'Related'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(
    found.some((f) => /"When not to use" was retired — move each case to a `Related` bullet/.test(f)),
    found.join('\n'),
  );

  // The other one #254 dissolved, so the map is not asserted through a single key.
  const broken2 = page({
    examples: ['Overview'],
    usage: ['When to use', 'Correct and incorrect', 'Related'],
  });
  assert.ok(
    checkFile(COMPONENT, broken2, true).some((f) => /"Correct and incorrect" was retired/.test(f)),
  );

  // The green twin — the headings that replaced them are silent.
  const ok = page({ examples: ['Overview'], usage: ['When to use', 'Usage notes', 'Related'] });
  assert.deepEqual(checkFile(COMPONENT, ok, true), []);
});

test('7b. a retired heading demoted to `###` is still caught — where #253 left them', () => {
  // The failure this exists for: #253 wrote these as `###`, and `HEADING` only
  // matches `##` (3c), so assertion 7 reading `sections` alone would see none of
  // the 15 pages it was written for. It reads `subHeadings` too.
  const broken = page({ examples: ['Overview'], usage: ['When to use', 'Related'] }).replace(
    '## When to use\n\nbody',
    '## When to use\n\nbody\n\n### When not to use\n\nmore body',
  );
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /"When not to use" was retired/.test(f)), found.join('\n'));

  // ...and it is still not a section, so nothing else fires about it.
  assert.ok(!found.some((f) => /sits outside every tab|belongs in/.test(f)), found.join('\n'));
});

test('8. a Usage tab with no `Related` is caught', () => {
  const broken = page({ examples: ['Overview'], usage: ['When to use', 'Accessibility'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /has a Usage tab but no "Related" section/.test(f)), found.join('\n'));

  // A page with no Usage tab at all is not asked for one — the requirement is
  // "guidance ends by pointing somewhere else", not "every page has Related".
  assert.deepEqual(checkFile(COMPONENT, page({ examples: ['Overview'] }), true), []);
});

test('8b. `Related` that is not last is caught — position is the point', () => {
  const broken = page({ examples: ['Overview'], usage: ['Related', 'When to use'] });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(
    found.some((f) => /"Related" must be the last Usage section, not "When to use"/.test(f)),
    found.join('\n'),
  );

  // The green twin — the same two sections the other way round.
  const ok = page({ examples: ['Overview'], usage: ['When to use', 'Related'] });
  assert.deepEqual(checkFile(COMPONENT, ok, true), []);
});

test('7c. a retired heading draws one message, not a contradictory pair', () => {
  // `Correct and incorrect` left USAGE_HEADINGS when #254 retired it, and
  // assertion 3 sorts anything not in that set into the Examples tab. So the
  // page that brings it back would have been told both "move it to examples"
  // and "dissolve it" — and an author who did the first is still red, having
  // moved a guidance block into the examples tab for nothing.
  const broken = page({
    examples: ['Overview'],
    usage: ['When to use', 'Correct and incorrect', 'Related'],
  });
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /"Correct and incorrect" was retired/.test(f)), found.join('\n'));
  assert.ok(!found.some((f) => /belongs in "examples"/.test(f)), found.join('\n'));

  // The skip is scoped to retired headings — an ordinary misfiled section is
  // still caught, so this did not just switch assertion 3 off.
  const misfiled = page({ examples: ['Overview'], usage: ['When to use', 'Variants', 'Related'] });
  assert.ok(
    checkFile(COMPONENT, misfiled, true).some((f) => /"Variants".*belongs in "examples"/.test(f)),
  );
});

test('8c. a Usage tab with no `##` section is still asked for `Related`', () => {
  // Assertion 8 used to key on the sections inside the usage tab. A tab holding
  // loose prose — or only `###` rules under no `##` — has none, and assertion 5
  // is silent through it as well, because it compares whole-file totals that
  // stay one-to-one. That page shipped guidance with no way out of it, green.
  const proseOnly = [
    "import { DocsTabs, DocsTab } from '@/storybook-docs/docs-tabs.jsx';",
    '<DocsTabs of={S}>',
    '<DocsTab tab="examples">',
    section('Overview'),
    '</DocsTab>',
    '<DocsTab tab="usage">',
    'Guidance written as prose, under no heading at all.',
    '</DocsTab>',
    '</DocsTabs>',
  ].join('\n\n');
  const found = checkFile(COMPONENT, proseOnly, true);
  assert.ok(found.some((f) => /has a Usage tab but no "Related" section/.test(f)), found.join('\n'));

  // ...and nothing else fires, so the complaint is the one the author can act on.
  assert.equal(found.length, 1, found.join('\n'));
});

test('an unknown tab name is caught — Code and Changelog are generated, never authored', () => {
  const broken = page().replace('<DocsTab tab="examples">', '<DocsTab tab="code">');
  const found = checkFile(COMPONENT, broken, true);
  assert.ok(found.some((f) => /Found: code/.test(f)), found.join('\n'));
});

test('readTabs attributes a heading to the section div that opened it', () => {
  const { sections } = readTabs(page({ examples: ['Overview'], usage: ['Accessibility'] }));
  assert.deepEqual(
    sections.map((s) => [s.heading, s.tab]),
    [
      ['Overview', 'examples'],
      ['Accessibility', 'usage'],
    ],
  );
});
