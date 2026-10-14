#!/usr/bin/env node
// @ts-check
/**
 * Draws the answer-grading sample, reproducibly. It reads what
 * queries/usage/sample-answers.sql returned and prints a CSV to fill the
 * graded answers from (agents/uno-bot/README.md § Metrics):
 *
 *   node scripts/sample-answers.mjs --rows <json|csv> --seed <s> [--n 50] [--second 10]
 *
 * `--rows` is the query's output: `wrangler d1 execute --json` writes a list
 * of results, which is read as it is; a plain JSON array or a CSV with the
 * query's columns works too. The same rows and the same seed always pick the
 * same turns, in the same order. The first `--second` of them are marked for
 * a second grader. No text is read or printed: ids, a Slack link, the surface.
 *
 * Output columns: turn_id,slack_link,surface,needs_permission,second_grade.
 * needs_permission is 1 for a DM or group DM, which a grader cannot open: the
 * asker is asked first.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { parseCsv } from "./metric-query-render.mjs";

/**
 * @typedef {{ turn_id: string, channel: string, ask_ts: string, surface: string, needs_permission: number }} EligibleAnswer
 */

/**
 * A seeded PRNG: the seed string hashed (FNV-1a) into mulberry32. Same seed,
 * same sequence, on every machine.
 *
 * @param {string} seed
 * @returns {() => number} a number in [0, 1)
 */
export function seededRandom(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A Slack message link: `https://slack.com/archives/<channel>/p<ts without the dot>`.
 *
 * @param {string} channel
 * @param {string} ts
 */
export function slackLink(channel, ts) {
  return `https://slack.com/archives/${channel}/p${ts.replace(".", "")}`;
}

/**
 * The query's rows, from wrangler's `--json` output, a plain JSON array, or
 * CSV.
 *
 * @param {string} text
 * @returns {EligibleAnswer[]}
 */
export function eligibleRows(text) {
  const trimmed = text.trim();
  /** @type {Record<string, unknown>[]} */
  let rows;
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    rows = list.flatMap((r) => (r && typeof r === "object" && Array.isArray(r.results) ? r.results : [r]));
  } else {
    rows = parseCsv(text);
  }
  return rows.map((r, i) => {
    for (const column of ["turn_id", "channel", "ask_ts", "surface", "needs_permission"]) {
      if (r[column] === undefined || r[column] === null || r[column] === "") {
        throw new Error(`row ${i + 1} has no ${column}: is this sample-answers.sql's output?`);
      }
    }
    return {
      turn_id: String(r.turn_id),
      channel: String(r.channel),
      ask_ts: String(r.ask_ts),
      surface: String(r.surface),
      needs_permission: Number(r.needs_permission) === 1 ? 1 : 0,
    };
  });
}

/**
 * The sample: rows put in turn-id order (so the database's order does not
 * matter), shuffled by the seed (Fisher–Yates), the first `n` kept; the first
 * `second` of those are for a second grader.
 *
 * @param {EligibleAnswer[]} rows
 * @param {{ seed: string, n: number, second: number }} opts
 */
export function drawSample(rows, opts) {
  if (opts.second > opts.n) throw new Error(`--second ${opts.second} is more than --n ${opts.n}`);
  const pool = [...rows].sort((a, b) => (a.turn_id < b.turn_id ? -1 : a.turn_id > b.turn_id ? 1 : 0));
  const random = seededRandom(opts.seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [/** @type {EligibleAnswer} */ (pool[j]), /** @type {EligibleAnswer} */ (pool[i])];
  }
  return pool.slice(0, opts.n).map((r, i) => ({ ...r, second_grade: i < opts.second ? 1 : 0 }));
}

/**
 * The sample as CSV. No field can hold a comma or a quote — ids, a link, a
 * surface and two flags — so none is quoted.
 *
 * @param {ReturnType<typeof drawSample>} sample
 */
export function sampleCsv(sample) {
  const lines = ["turn_id,slack_link,surface,needs_permission,second_grade"];
  for (const r of sample) {
    lines.push([r.turn_id, slackLink(r.channel, r.ask_ts), r.surface, r.needs_permission, r.second_grade].join(","));
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const { values } = parseArgs({
    options: {
      rows: { type: "string" },
      seed: { type: "string" },
      n: { type: "string", default: "50" },
      second: { type: "string", default: "10" },
    },
  });
  if (!values.rows || !values.seed) {
    console.error("usage: node scripts/sample-answers.mjs --rows <json|csv> --seed <s> [--n 50] [--second 10]");
    process.exit(2);
  }
  const n = Number(values.n);
  const second = Number(values.second);
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(second) || second < 0) {
    console.error("--n must be a whole number from 1, and --second one from 0");
    process.exit(2);
  }
  const rows = eligibleRows(readFileSync(values.rows, "utf8"));
  if (rows.length < n) console.error(`only ${rows.length} eligible answers: the sample is all of them`);
  process.stdout.write(sampleCsv(drawSample(rows, { seed: values.seed, n, second })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
