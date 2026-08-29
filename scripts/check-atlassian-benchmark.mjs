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
import { fileURLToPath } from 'node:url';

import { ourTokens, compare, ageInDays, failures } from './atlassian-benchmark.mjs';

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

const benchmark = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BENCHMARK), 'utf8'));
const tokens = ourTokens(REPO_ROOT);
const rows = compare(tokens, benchmark, REPO_ROOT);
const now = new Date();

const table = rows
  .map((r) => {
    const arrow = r.direction === 'up' ? '↑' : r.direction === 'down' ? '↓' : ' ';
    // A row with no counterpart prints as one. The recording holds Atlassian's
    // fourteen step NAMES and not their px values, so `type.stepRatios` has
    // nothing on their side that is not invented.
    const theirs = r.theirs === null ? '—' : String(r.theirs);
    return `  ${arrow} ${r.key.padEnd(24)} ours ${String(r.ours).padStart(4)}   atlassian ${theirs.padStart(4)}`;
  })
  .join('\n');

const found = failures(rows, benchmark, {
  now,
  measuredAt: benchmark.measuredAt,
  maxAgeDays: MAX_AGE_DAYS,
});

const age = ageInDays(benchmark.measuredAt, now);

if (process.argv.includes('--table') || process.argv.includes('--print')) {
  console.log(`\nAtlassian ${benchmark.measuredAt} (${age}d) — ${benchmark.source}\n`);
  console.log(table);
  console.log('\n  ↑ may only rise   ↓ may only fall   (blank) recorded, not enforced\n');
  for (const r of rows.filter((r) => r.direction)) console.log(`  ${r.key}: ${r.why}\n`);
}

/*
 * `--how` makes the JSON note's instruction true rather than aspirational. The
 * Atlassian side cannot be refreshed from CI — no API, no export, a rendered
 * page — so the method is printed and the reading is done by hand.
 */
if (process.argv.includes('--how')) {
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
 */
if (process.argv.includes('--update')) {
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
  if (refused.length) {
    console.error('\n[atlassian-benchmark] --update refused:');
    for (const r of refused) console.error(`  ${r}`);
    console.error('\n  -> Re-recording a backwards move is how a ratchet stops being one.\n');
    process.exit(1);
  }
  benchmark.ours = { ...recorded, note: benchmark.ours?.note, recordedAt: benchmark.ours?.recordedAt };
  // Key order: keep `note` and `recordedAt` first, as they were authored.
  const { note, recordedAt, ...counts } = benchmark.ours;
  benchmark.ours = { note, recordedAt, ...counts };
  fs.writeFileSync(path.join(REPO_ROOT, BENCHMARK), `${JSON.stringify(benchmark, null, 2)}\n`);
  console.log(moved.length ? `\nRe-recorded:\n  ${moved.join('\n  ')}\n  (set recordedAt by hand)\n` : '\nNothing moved.\n');
  process.exit(0);
}

if (found.length) {
  console.error(`\n[atlassian-benchmark] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${table}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error(`✗ check:atlassian-benchmark — Atlassian recorded ${benchmark.measuredAt} (${age}d)\n`);
  console.error(
    '  -> A row that moved the wrong way is a real regression: role coverage was\n' +
      '     removed, or the type surface grew again. Fix the tokens, not the file.\n' +
      '     Re-record with `npm run benchmark:atlassian -- --update` only AFTER a\n' +
      '     move in the argued direction, so the ratchet keeps its floor.',
  );
  process.exit(1);
}

const enforced = rows.filter((r) => r.direction).length;
console.log(
  `✓ check:atlassian-benchmark — ${rows.length} rows, ${enforced} enforced, ` +
    `Atlassian recorded ${benchmark.measuredAt} (${age}d, ceiling ${MAX_AGE_DAYS})`,
);
