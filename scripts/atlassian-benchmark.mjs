/**
 * Our token surface, counted the same way Atlassian's was.
 *
 * WHY A BENCHMARK IS A FILE AND NOT A MEMORY. "Benchmarked against Atlassian"
 * is the kind of claim that decays silently: the comparison is made once, the
 * numbers move, and the sentence stays. So the Atlassian side is a dated
 * MEASUREMENT in `docs/evals/atlassian-benchmark.json`, read from
 * atlassian.design rather than remembered, and our side is counted from the
 * token files on every run.
 *
 * WHAT IT IS NOT. It is not a target. Differing from Atlassian is often
 * correct — they ship 100 chart colours and 21 elevation tokens for a product
 * surface we do not have. The check that consumes this fails on DIRECTION, not
 * on distance, and only on the rows where a direction has actually been argued
 * for.
 *
 * THE FINDINGS, measured 2026-08-29. The first draft of this file recorded
 * that we have "no role namespace in colour at all", which is false and worth
 * saying plainly: `--color-surface*` (36) is the background role and
 * `--color-outline*` (8) is the border role, under Material's names rather than
 * Atlassian's. Counting only the literal strings `background` and `border` in
 * token names measured our vocabulary, not our system. What survives the
 * correction is sharper than what it replaced:
 *
 * 1. OUR FOREGROUND ROLE IS UNDIVIDED. Atlassian split it in two — `color.text`
 *    49 and `color.icon` 23 — because the bars differ: text must reach 4.5:1
 *    and an icon 3:1. We have one `--color-on-*` family (32) serving both, so
 *    no token records which bar its value was chosen against. Nothing in the
 *    system can tell you whether a colour passing as an icon was ever checked
 *    as text.
 *
 * 2. EVERY INTENT NAMES TWO ROLES AND USES THREE. All seven intents — primary,
 *    secondary, tertiary, danger, success, warning, info — have the identical
 *    9-token shape: a base, a container, a `-text`, and six state overlays.
 *    There is no `--color-warning-border` and no `--color-warning-icon`, so an
 *    intent-coloured border or icon reaches for the BASE, which is also the
 *    ground. That is exactly the gap #312's warning defect lived in:
 *    `--color-warning` measures 3.70:1 against white — failing both as a ground
 *    under white text and as text on white — while `--color-warning-text`
 *    measures 13.27:1 and passes. The two are one prefix apart and the name
 *    says nothing about which is safe where.
 *
 * 3. OUR TYPE IS STORED APART FROM ITSELF. Atlassian ship 14 type steps, each
 *    ONE token carrying size, line-height and weight together; there is no
 *    `font.lineHeight.*` namespace on their page at all. We ship 44
 *    `--font-size-*` and 46 `--font-line-height-*` as separate tokens that must
 *    agree and are stored where they can disagree — the same defect shape as
 *    #346, where `--type-h4` carried a weight the class it named did not use.
 *
 * Only findings 1-3 are enforced, and only in the direction argued at each row.
 * The role COUNTS are recorded and left alone: 36 surface tokens against their
 * 208 backgrounds is a difference, not a defect, and a gate that demanded the
 * number rise would be demanding growth for its own sake.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Every `--token:` declared under `design-system/src/tokens`. */
export function ourTokens(repoRoot) {
  const dir = path.join(repoRoot, 'design-system/src/tokens');
  const names = new Set();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.scss')) continue;
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const m of text.matchAll(/^\s*(--[a-z][a-z0-9-]*)\s*:/gm)) names.add(m[1]);
  }
  return [...names].sort();
}

/**
 * The seven intents, each of which today carries the identical 9-token shape.
 * Written as one regex so `intent.borderTokens` and `intent.iconTokens` cannot
 * drift apart from the list they are counting over.
 */
export const INTENT = /^--color-(primary|secondary|tertiary|danger|success|warning|info)-/;

/**
 * The rows worth comparing, and the direction each one may move.
 *
 * `direction` is the only thing the check enforces:
 *   'up'   the count may rise and must not fall  (role coverage we are adding)
 *   'down' the count may fall and must not rise  (surface we have argued to shrink)
 *   null   recorded and never enforced           (a difference that is correct)
 *
 * A row with a direction carries `why`, because a gate whose reason is not
 * written down is a gate somebody removes the next time it is inconvenient.
 */
export const ROWS = [
  {
    key: 'intent.borderTokens',
    ours: (t) => t.filter((n) => INTENT.test(n) && n.endsWith('-border')).length,
    theirs: (b) => b.colourByRole['color.border'],
    direction: 'up',
    why:
      'Zero. All seven intents have the same 9 tokens — base, container, -text and ' +
      'six state overlays — so an intent-coloured BORDER reaches for the base, which ' +
      'is also the ground. Atlassian name 39 border colours precisely so a stroke ' +
      'never has to borrow a fill.',
  },
  {
    key: 'intent.iconTokens',
    ours: (t) => t.filter((n) => INTENT.test(n) && n.endsWith('-icon')).length,
    theirs: (b) => b.colourByRole['color.icon'],
    direction: 'up',
    why:
      'Zero, and the bar is different: an icon must reach 3:1 where text must reach ' +
      '4.5:1. Atlassian keep 23 icon colours apart from their 49 text colours for ' +
      'that reason. --color-warning is 3.70:1 on white — legal as an icon, illegal ' +
      'as text — and nothing in its name says so, which is where #312 came from.',
  },
  {
    key: 'type.sizeSteps',
    ours: (t) => t.filter((n) => n.startsWith('--font-size-')).length,
    theirs: (b) => b.typeSteps.count,
    direction: 'down',
    why:
      '44 against their 14. #267 measured that our scale has no ratio at all — the ' +
      'steps wander between 1.111 and 1.400 — and that 26 of the tokens are dead. ' +
      'The direction is settled even though the destination is not.',
  },
  {
    key: 'type.lineHeights',
    ours: (t) => t.filter((n) => n.startsWith('--font-line-height-')).length,
    theirs: () => 0,
    direction: 'down',
    why:
      'They ship ZERO: line-height travels inside the 14 steps. We ship 46 tokens ' +
      'that must agree with 44 size tokens and are stored where they can disagree — ' +
      'the same shape as #346.',
  },

  /*
   * Recorded and not enforced. These are the role counts under OUR names, which
   * is what the first draft of this file got wrong by counting Atlassian's
   * spelling and finding zero. They are printed so the comparison is visible;
   * no direction is claimed, because 36 surface tokens against 208 backgrounds
   * is a difference and not a defect.
   */
  { key: 'role.background(surface)', ours: (t) => t.filter((n) => n.startsWith('--color-surface')).length, theirs: (b) => b.colourByRole['color.background'], direction: null },
  { key: 'role.foreground(on-*)', ours: (t) => t.filter((n) => n.startsWith('--color-on-')).length, theirs: (b) => b.colourByRole['color.text'] + b.colourByRole['color.icon'], direction: null },
  { key: 'role.border(outline)', ours: (t) => t.filter((n) => n.startsWith('--color-outline')).length, theirs: (b) => b.colourByRole['color.border'], direction: null },
  { key: 'intent.textTokens', ours: (t) => t.filter((n) => INTENT.test(n) && n.endsWith('-text')).length, theirs: (b) => b.colourByRole['color.text'], direction: null },
  { key: 'colour.total', ours: (t) => t.filter((n) => n.startsWith('--color-')).length, theirs: (b) => b.totals.color, direction: null },
  { key: 'font.total', ours: (t) => t.filter((n) => n.startsWith('--font-')).length, theirs: (b) => b.totals.font, direction: null },
  { key: 'space', ours: (t) => t.filter((n) => n.startsWith('--size-spacing-')).length, theirs: (b) => b.totals.space, direction: null },
  { key: 'elevation', ours: (t) => t.filter((n) => n.startsWith('--elevation-')).length, theirs: (b) => b.totals.elevation, direction: null },
  { key: 'tokens.total', ours: (t) => t.length, theirs: (b) => b.totals.all, direction: null },
];

/** `{key, ours, theirs, direction, why}` for every row. */
export function compare(tokens, benchmark) {
  return ROWS.map((row) => ({
    key: row.key,
    ours: row.ours(tokens),
    theirs: row.theirs(benchmark),
    direction: row.direction,
    why: row.why,
  }));
}

/**
 * Days between the recording and now — the benchmark's own staleness.
 * Injected rather than read, so tests do not go red on a calendar day.
 */
export const ageInDays = (stamp, now) => {
  const then = Date.parse(stamp);
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / 86400000);
};

/**
 * @returns {string[]} One line per problem; empty when every enforced row has
 *   moved in its argued direction or not at all.
 */
export function failures(rows, baseline, { now, measuredAt, maxAgeDays }) {
  const found = [];
  const recorded = baseline.ours ?? {};

  for (const row of rows) {
    if (!row.direction) continue;
    const before = recorded[row.key];
    if (before === undefined) {
      found.push(`${row.key}: no recorded starting point. Re-record with --update.`);
      continue;
    }
    if (row.direction === 'up' && row.ours < before) {
      found.push(
        `${row.key}: ${before} recorded, ${row.ours} now. This row may only RISE — ${row.why}`,
      );
    }
    if (row.direction === 'down' && row.ours > before) {
      found.push(
        `${row.key}: ${before} recorded, ${row.ours} now. This row may only FALL — ${row.why}`,
      );
    }
  }

  const age = ageInDays(measuredAt, now);
  if (age === null) {
    found.push('the Atlassian recording has no readable `measuredAt`.');
  } else if (age < 0) {
    found.push(`the Atlassian recording is dated ${-age} day(s) in the future.`);
  } else if (age > maxAgeDays) {
    found.push(
      `the Atlassian recording is ${age} days old (ceiling ${maxAgeDays}). A benchmark ` +
        `nobody re-measures is a sentence, not a comparison.`,
    );
  }

  return found;
}
