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
 * THE TWO STRUCTURAL FINDINGS, measured 2026-08-29:
 *
 * 1. WE HAVE NO ROLE NAMESPACE IN COLOUR. Atlassian's largest namespace is
 *    `color.background` at 208 tokens, beside `color.text` 49, `color.border`
 *    39 and `color.icon` 23 — four separate answers to "what is this colour
 *    FOR". We have zero tokens whose name says background, border or icon.
 *    `--color-primary` is used as a fill, as a label and as a border, and no
 *    token can say which is meant. That is why #312's warning defect could
 *    exist at all: nothing in the system distinguished "warning as a ground"
 *    from "warning as text", so the one pair that fails as a ground was never
 *    separable from the one that passes as text.
 *
 * 2. OUR TYPE IS STORED APART FROM ITSELF. Atlassian ships 14 type steps and
 *    each one is a single token carrying size, line-height and weight together;
 *    there is no `font.lineHeight.*` namespace on their page at all. We ship 44
 *    `--font-size-*` and 46 `--font-line-height-*` as separate tokens that must
 *    agree and are stored where they can disagree. That is the same defect
 *    shape as #346, where `--type-h4` carried a weight the class it named did
 *    not use.
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
    key: 'colour.role.background',
    ours: (t) => t.filter((n) => n.startsWith('--color-') && n.includes('background')).length,
    theirs: (b) => b.colourByRole['color.background'],
    direction: 'up',
    why:
      'Atlassian’s largest namespace, 208 tokens, and we have none. A component ' +
      'reaching for --color-primary cannot say whether it wants the fill or the label, ' +
      'which is the gap #312’s warning defect lived in.',
  },
  {
    key: 'colour.role.text',
    ours: (t) => t.filter((n) => n.startsWith('--color-') && n.includes('text')).length,
    theirs: (b) => b.colourByRole['color.text'],
    direction: 'up',
    why: 'The one role we have started naming — 12 `-text` tokens against their 49.',
  },
  {
    key: 'colour.role.border',
    ours: (t) => t.filter((n) => n.startsWith('--color-') && n.includes('border')).length,
    theirs: (b) => b.colourByRole['color.border'],
    direction: 'up',
    why: 'Zero. Every border colour in this system is a fill token used as a stroke.',
  },
  {
    key: 'colour.role.icon',
    ours: (t) => t.filter((n) => n.startsWith('--color-') && n.includes('icon')).length,
    theirs: (b) => b.colourByRole['color.icon'],
    direction: 'up',
    why:
      'Zero. An icon is the case where 3:1 is the bar rather than 4.5:1, and no token ' +
      'records which colours were chosen against which bar.',
  },
  {
    key: 'type.sizeSteps',
    ours: (t) => t.filter((n) => n.startsWith('--font-size-')).length,
    theirs: (b) => b.typeSteps.count,
    direction: 'down',
    why:
      '44 against their 14. #267 measured that our scale has no ratio at all — the steps ' +
      'wander between 1.111 and 1.400 — and that 26 of the tokens are dead. The direction ' +
      'is settled even though the destination is not.',
  },
  {
    key: 'type.lineHeights',
    ours: (t) => t.filter((n) => n.startsWith('--font-line-height-')).length,
    theirs: () => 0,
    direction: 'down',
    why:
      'They ship ZERO: line-height travels inside the 14 steps. We ship 46 tokens that ' +
      'must agree with 44 size tokens and are stored where they can disagree — the same ' +
      'shape as #346.',
  },
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
