#!/usr/bin/env node
/**
 * `npm run check:atlassian-benchmark` — the comparison against Atlassian is
 * still a measurement, and the rows we committed to are still moving the way we
 * said.
 *
 * See `scripts/atlassian-benchmark.mjs` for what is compared and why each
 * enforced row has the direction it has. This file is the gate.
 *
 * WHAT MAKES IT FAIL. Five things, and deliberately not a sixth:
 *   · a row with a direction moved AGAINST it — role coverage fell, or the type
 *     surface grew;
 *   · the Atlassian recording has no readable date, or a future one;
 *   · the recording is past the age ceiling, i.e. nobody has re-measured;
 *   · a recorded floor that no argued row measures any more, which is the
 *     ratchet module's stale-entry sweep (#601): a number nothing enforces
 *     still reads like a commitment;
 *   · no record at all — the module's one stated absent-record mode, because an
 *     empty baseline reads as a green ratchet.
 *
 * It does NOT fail on distance from Atlassian. They ship 100 chart colours and
 * 21 elevation tokens for a product surface we do not have, and a gate that
 * demanded parity would be demanding the wrong thing loudly.
 *
 * OUR SIDE IS A FLOOR, and the direction is per ROW rather than per record: two
 * of the four argued rows may only rise and two may only fall, each for the
 * reason written beside it in `ROWS`. That is why the directions stay in
 * `scripts/atlassian-benchmark.mjs` and are not read off the set's own
 * `direction` in `scripts/lib/ratchet-shapes.mjs`, which is one word for the
 * whole set and correctly says the set may only grow.
 *
 * Run: `npm run check:atlassian-benchmark`. `npm run benchmark:atlassian`
 * prints the same table without the gate.
 */
import { ourTokens, compare, ageInDays, failures } from './atlassian-benchmark.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';
import { byRoot, main, report } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

/**
 * The record, named here because this is the check that reads it — and because
 * it is the key its shape is declared under in `scripts/lib/ratchet-shapes.mjs`
 * and the path `scripts/checks.registry.mjs` declares for this row. One
 * spelling, three readers.
 */
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
  const ratchet = openRatchet({ file: BENCHMARK, repoRoot });
  /*
   * The record has two halves and the module owns one of them. `ours` is the
   * ratcheted set — four argued rows, a FLOOR, with `note` and `recordedAt`
   * mixed in among them and preserved across a write. The rest of the record is
   * ATLASSIAN'S published surface: a measurement of somebody else's system,
   * read by hand off a rendered page, with no direction to hold it to and
   * nothing for a ratchet to do. So it comes back through `envelope()`, and the
   * file is still opened exactly once by the one module that reads records.
   */
  const benchmark = ratchet.envelope() ?? {};
  const tokens = ourTokens(repoRoot);
  const rows = ratchet.absent ? [] : compare(tokens, benchmark, repoRoot);
  const now = new Date();
  return { ratchet, benchmark, rows, now, age: ageInDays(benchmark.measuredAt, now) };
});

/** The recorded floor per argued row: `{key: number}`, the set without its prose. */
const recordedFloor = (ratchet) =>
  Object.fromEntries([...ratchet.entries].map(([key, entry]) => [key, entry.counts.get('count')]));

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
  const { ratchet, benchmark, rows, now } = inputs(repoRoot);
  // With no record there is no Atlassian side to compare against and no floor to
  // hold to, so the one stated absent-record mode is the whole answer.
  if (ratchet.absent) return ratchet.failures({}).map(({ message }) => ({ message }));

  const measured = Object.fromEntries(rows.filter((r) => r.direction).map((r) => [r.key, r.ours]));
  const found = failures(rows, recordedFloor(ratchet), {
    now,
    measuredAt: benchmark.measuredAt,
    maxAgeDays: MAX_AGE_DAYS,
  });

  /*
   * A recorded row nothing measures any more. The floor is only a floor while a
   * row still asks for it: delete the row from `ROWS` and its number sits here
   * unenforced, reading like a commitment. That is the direction most records
   * forget, and it is the module's `stale()`.
   */
  for (const { key, recorded } of ratchet.stale(measured)) {
    found.push(
      `${key}: recorded at ${recorded}, and no argued row measures it any more. ` +
        'Delete the entry, or put the row back in ROWS with its direction and its reason.',
    );
  }
  return found.map((message) => ({ message }));
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
  const { ratchet, rows } = inputs(repoRoot);
  const recorded = recordedFloor(ratchet);
  const refused = [];
  const moved = [];
  const measured = {};
  for (const row of rows) {
    if (!row.direction) continue;
    measured[row.key] = row.ours;
    const before = recorded[row.key];
    if (before === row.ours) continue;
    const forwards = row.direction === 'up' ? row.ours > before : row.ours < before;
    if (before !== undefined && !forwards) {
      refused.push(`${row.key}: ${before} -> ${row.ours} is against its direction (${row.direction}).`);
      continue;
    }
    moved.push(`${row.key}: ${before ?? '(new)'} -> ${row.ours}`);
  }
  // A refusal is a finding like any other, so `--update` reports through the same
  // renderer and takes its exit code from the same place the gate does — and
  // nothing is written, so a refused run leaves the floor where it was.
  if (refused.length) return refused.map((message) => ({ message }));

  /*
   * A MERGE, through the ratchet: the `ours` container is replaced and every
   * other key on the record survives, Atlassian's whole published surface
   * included. `note` and `recordedAt` are declared IGNORED in the shape table,
   * so they are carried across in place rather than counted — which is also
   * what keeps them first in the container, as they were authored. The date is
   * not restated by a tool, which is why the line below asks for it by hand.
   */
  ratchet.update(measured, {
    seed: {
      'ours.note':
        'OUR side of the comparison. Only the ARGUED rows are recorded — see ROWS in ' +
        'scripts/atlassian-benchmark.mjs, where each direction carries its reason. Re-record with ' +
        '`npm run benchmark:atlassian -- --update` AFTER a move in the argued direction; it refuses ' +
        'a backwards one.',
    },
  });
  console.log(moved.length ? `\nRe-recorded:\n  ${moved.join('\n  ')}\n  (set recordedAt by hand)\n` : '\nNothing moved.\n');
  return [];
}

// The side flags belong to the CLI: two of them print instead of gating and one
// writes the recording. `--table` and `--how` FALL THROUGH to the gate, as they
// always did, so they go in the slot that models that (#610); `--update` is
// terminal, and reports its refusal as a finding so the exit code still comes
// from the one place that decides exit codes.
//
// `--print` is the older spelling of `--table` and both are honoured, so typing
// both has to print one table rather than two.
let tabled = false;
const printTableOnce = () => {
  if (tabled) return;
  tabled = true;
  printTable();
};

main(import.meta.url, 'check:atlassian-benchmark', {
  run,
  summary,
  remedy: REMEDY,
  fallThrough: { '--table': printTableOnce, '--print': printTableOnce, '--how': () => printHow() },
  flags: {
    '--update': () =>
      report('check:atlassian-benchmark', update(), {
        remedy: '  -> Re-recording a backwards move is how a ratchet stops being one.',
        summary: 'the recording now matches what was measured',
      }),
  },
});
