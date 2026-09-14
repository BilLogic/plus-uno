#!/usr/bin/env node
/**
 * `npm run check:atlassian-benchmark` — the comparison against Atlassian is
 * still a measurement, and the rows we committed to are still moving the way we
 * said.
 *
 * See `scripts/atlassian-benchmark.mjs` for what is compared and why each
 * enforced row has the direction it has. This file is the gate.
 *
 * WHAT MAKES IT FAIL. Three things, and deliberately not a fourth:
 *   · a row with a direction moved AGAINST it — role coverage fell, or the type
 *     surface grew;
 *   · the Atlassian recording has no readable date, or a future one;
 *   · the recording is past the age ceiling, i.e. nobody has re-measured.
 *
 * It does NOT fail on distance from Atlassian. They ship 100 chart colours and
 * 21 elevation tokens for a product surface we do not have, and a gate that
 * demanded parity would be demanding the wrong thing loudly.
 *
 * Run: `npm run check:atlassian-benchmark`. `npm run benchmark:atlassian`
 * prints the same table without the gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ourTokens, compare, ageInDays, failures } from './atlassian-benchmark.mjs';
import { byRoot, main, report } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BENCHMARK = 'docs/evals/atlassian-benchmark.json';

/**
 * A year. Longer than the Figma snapshots' 180 days on purpose: this one is a
 * competitor's published surface rather than our own library, it moves in
 * quarters rather than in commits, and re-measuring means reading a live site
 * by hand. The age prints on every run, so the number is visible long before it
 * is reached.
 */
const MAX_AGE_DAYS = 365;

export const REMEDY =
  '  -> A row that moved the wrong way is a real regression: role coverage was\n' +
  '     removed, or the type surface grew again. Fix the tokens, not the file.\n' +
  '     Re-record with `npm run benchmark:atlassian -- --update` only AFTER a\n' +
  '     move in the argued direction, so the ratchet keeps its floor.';

/**
 * The recording, our side counted from the token sources, and the comparison —
 * once per repo root. `now` is captured here as well, so the age `run` gates on
 * and the age `summary` prints are the same reading rather than two.
 */
const inputs = byRoot((repoRoot) => {
  const benchmark = JSON.parse(fs.readFileSync(path.join(repoRoot, BENCHMARK), 'utf8'));
  const tokens = ourTokens(repoRoot);
  const rows = compare(tokens, benchmark, repoRoot);
  const now = new Date();
  return { benchmark, rows, now, age: ageInDays(benchmark.measuredAt, now) };
});

/** The comparison as a table, for `--table` and for `npm run benchmark:atlassian`. */
function tableFor(rows) {
  return rows
    .map((r) => {
      const arrow = r.direction === 'up' ? '↑' : r.direction === 'down' ? '↓' : ' ';
      // A row with no counterpart prints as one. The recording holds Atlassian's
      // fourteen step NAMES and not their px values, so `type.stepRatios` has
      // nothing on their side that is not invented.
      const theirs = r.theirs === null ? '—' : String(r.theirs);
      return `  ${arrow} ${r.key.padEnd(24)} ours ${String(r.ours).padStart(4)}   atlassian ${theirs.padStart(4)}`;
    })
    .join('\n');
}

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { benchmark, rows, now } = inputs(repoRoot);
  return failures(rows, benchmark, {
    now,
    measuredAt: benchmark.measuredAt,
    maxAgeDays: MAX_AGE_DAYS,
  }).map((message) => ({ message }));
}

/**
 * The green line, which carries the age. That is the number that decides this
 * check's future: it fails on nothing else nine months out of twelve.
 */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { benchmark, rows, age } = inputs(repoRoot);
  const enforced = rows.filter((r) => r.direction).length;
  return (
    `${rows.length} rows, ${enforced} enforced, ` +
    `Atlassian recorded ${benchmark.measuredAt} (${age}d, ceiling ${MAX_AGE_DAYS})`
  );
}

/** `--table`/`--print`: the comparison without the gate. */
function printTable(repoRoot = REPO_ROOT) {
  const { benchmark, rows, age } = inputs(repoRoot);
  console.log(`\nAtlassian ${benchmark.measuredAt} (${age}d) — ${benchmark.source}\n`);
  console.log(tableFor(rows));
  console.log('\n  ↑ may only rise   ↓ may only fall   (blank) recorded, not enforced\n');
  for (const r of rows.filter((r) => r.direction)) console.log(`  ${r.key}: ${r.why}\n`);
}

/*
 * `--how` makes the JSON note's instruction true rather than aspirational. The
 * Atlassian side cannot be refreshed from CI — no API, no export, a rendered
 * page — so the method is printed and the reading is done by hand.
 */
function printHow(repoRoot = REPO_ROOT) {
  const { benchmark } = inputs(repoRoot);
  console.log(
    `\nRe-measuring the Atlassian side:\n\n` +
      `  1. Open ${benchmark.source}\n` +
      `  2. ${benchmark.method}\n` +
      `  3. Write the counts into ${BENCHMARK} and set measuredAt to today.\n\n` +
      `  Our side needs no step: it is counted from design-system/src/tokens on\n` +
      `  every run. Only the recorded FLOOR is written down, with --update.\n`,
  );
}

/*
 * `--update` re-records our side — and refuses a move against the row's own
 * direction. That refusal is the whole ratchet: without it the fix for a red
 * run is to re-record, and a gate whose failure mode is "write down the new
 * number" gates nothing.
 *
 * @returns {0 | 1} the exit code the refusal earns.
 */
/**
 * `--update` re-records the counts, and refuses a backwards move.
 *
 * It returns FINDINGS rather than an exit code (#509): the refusal is the same
 * kind of statement the gate makes, and the one place that turns findings into
 * an exit code is `report()`.
 *
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
function update(repoRoot = REPO_ROOT) {
  const { benchmark, rows } = inputs(repoRoot);
  const recorded = { ...(benchmark.ours ?? {}) };
  const refused = [];
  const moved = [];
  for (const row of rows) {
    if (!row.direction) continue;
    const before = recorded[row.key];
    if (before === row.ours) continue;
    const forwards = row.direction === 'up' ? row.ours > before : row.ours < before;
    if (before !== undefined && !forwards) {
      refused.push(`${row.key}: ${before} -> ${row.ours} is against its direction (${row.direction}).`);
      continue;
    }
    recorded[row.key] = row.ours;
    moved.push(`${row.key}: ${before ?? '(new)'} -> ${row.ours}`);
  }
  // A refusal is a finding like any other, so `--update` reports through the same
  // renderer and takes its exit code from the same place the gate does.
  if (refused.length) return refused.map((message) => ({ message }));
  benchmark.ours = { ...recorded, note: benchmark.ours?.note, recordedAt: benchmark.ours?.recordedAt };
  // Key order: keep `note` and `recordedAt` first, as they were authored.
  const { note, recordedAt, ...counts } = benchmark.ours;
  benchmark.ours = { note, recordedAt, ...counts };
  fs.writeFileSync(path.join(repoRoot, BENCHMARK), `${JSON.stringify(benchmark, null, 2)}\n`);
  console.log(moved.length ? `\nRe-recorded:\n  ${moved.join('\n  ')}\n  (set recordedAt by hand)\n` : '\nNothing moved.\n');
  return [];
}

// The side flags belong to the CLI: two of them print instead of gating and one
// writes the recording. `--table` and `--how` fall through to the gate, as they
// always did; `--update` is terminal, and reports its refusal as a finding so
// the exit code still comes from the one place that decides exit codes.
// The CLI is one branch or the other. A side flag prints (or writes) instead of
// gating, so the gate does not also run; `main()` re-checks the entry guard for
// itself, which is what keeps an import of this module reaching neither.
const entry = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (entry) {
  if (process.argv.includes('--table') || process.argv.includes('--print')) printTable();
  if (process.argv.includes('--how')) printHow();
}
if (entry && process.argv.includes('--update')) {
  report('check:atlassian-benchmark', update(), {
    remedy: '  -> Re-recording a backwards move is how a ratchet stops being one.',
    summary: 'the recording now matches what was measured',
  });
} else {
  main(import.meta.url, 'check:atlassian-benchmark', { run, summary, remedy: REMEDY });
}
