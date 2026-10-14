#!/usr/bin/env node
// @ts-check
/**
 * The pinned housekeeping sort for the lead's inbox: the same LLM sort as the
 * baseline, with its prompt (prompt.md) pinned so a count can be re-run and
 * cited. The labelling happens in a Claude Code session; this script does the
 * arithmetic on either side of it and calls no model. The definitions it
 * counts by, and where each came from, are at the top of lib.mjs.
 *
 *   node sort.mjs --prepare <export.jsonl> [--from YYYY-MM-DD] [--to YYYY-MM-DD]
 *        [--batch-size N] [--out-dir DIR]
 *   node sort.mjs --count <labels.jsonl> <export.jsonl> [--from] [--to]
 *   node sort.mjs --calibrate --prepare [recovered-rows.jsonl] [--batch-size N] [--out-dir DIR]
 *   node sort.mjs --calibrate --count <labels.jsonl> [recovered-rows.jsonl]
 *
 * The export is one JSON object a line: id, source (dm|channel|meeting),
 * sent_at, sender, text. --prepare writes one batch file per batch to
 * --out-dir: the prompt verbatim, that batch's rows, their ids and the label
 * schema. A session labels each batch by the prompt and appends the result to
 * a labels file, one JSON object a line. --count holds those labels to the
 * rows (every id once) and prints the count with the prompt's sha256.
 *
 * --out-dir defaults OUTSIDE the repo (~/Documents/Claude/Projects/PLUS/
 * uno-bot-measurement/) and is refused when it falls inside a git working
 * tree, as is a labels file: message text, labels and exports never go in git.
 * A run is recorded as the prompt sha256, "labelled in a Claude Code session",
 * and the session's model id, written by whoever ran it.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  DEFAULT_BATCH_SIZE, SPRING_2026,
  buildBatch, calibrationReport, corpusCalibrationRows, countPerWorkday,
  localDate, parseExport, parseLabelLines, toBatches,
} from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROMPT_FILE = path.join(HERE, "prompt.md");
const PLUS = path.join(os.homedir(), "Documents", "Claude", "Projects", "PLUS");
export const DEFAULT_OUT_DIR = path.join(PLUS, "uno-bot-measurement");
export const DEFAULT_CORPUS = path.join(PLUS, "uno-bot-corpus", "recovered-rows.jsonl");
const USAGE = "usage: node sort.mjs --prepare <export.jsonl> | --count <labels.jsonl> <export.jsonl>, with --calibrate for the corpus (see the header)";

/**
 * The git working tree a path sits in (the nearest ancestor holding `.git`,
 * a directory in a checkout or a file in a worktree), or null.
 * @param {string} p
 * @param {(p: string) => boolean} [exists]
 */
export function gitRootOf(p, exists = existsSync) {
  for (let dir = path.resolve(p); ; dir = path.dirname(dir)) {
    if (exists(path.join(dir, ".git"))) return dir;
    if (path.dirname(dir) === dir) return null;
  }
}

/** @param {string} text */
export const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * @typedef {{
 *   log: (line: string) => void,
 *   readFile: (p: string) => string,
 *   writeFile: (p: string, data: string) => void,
 *   mkdir: (p: string) => void,
 *   now: () => Date,
 *   gitRootOf: (p: string) => string | null,
 * }} Io
 */

/** @type {Io} */
const realIo = {
  log: (line) => console.log(line),
  readFile: (p) => readFileSync(p, "utf8"),
  writeFile: (p, d) => writeFileSync(p, d),
  mkdir: (p) => mkdirSync(p, { recursive: true }),
  now: () => new Date(),
  gitRootOf: (p) => gitRootOf(p),
};

/**
 * @param {string[]} argv
 * @param {Partial<Io>} [io]
 */
export async function run(argv, io = {}) {
  const x = /** @type {Io} */ ({ ...realIo, ...io });
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      prepare: { type: "boolean", default: false },
      count: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      "batch-size": { type: "string", default: String(DEFAULT_BATCH_SIZE) },
      "out-dir": { type: "string", default: DEFAULT_OUT_DIR },
      calibrate: { type: "boolean", default: false },
    },
  });
  if (values.prepare === (values.count !== undefined)) throw new Error(`name one of --prepare or --count. ${USAGE}`);
  /** @param {string} p @param {string} what */
  const outsideGit = (p, what) => {
    const repo = x.gitRootOf(p);
    if (repo) throw new Error(`${what} ${p} is inside the git working tree ${repo}; labels and exports must stay out of git`);
  };

  const prompt = x.readFile(PROMPT_FILE);
  const promptSha = sha256(prompt);

  /** @type {import("./lib.mjs").ExportRow[]} */
  let rows;
  /** @type {ReturnType<typeof corpusCalibrationRows>["expected"] | null} */
  let expected = null;
  const file = positionals[0] ?? (values.calibrate ? DEFAULT_CORPUS : undefined);
  if (!file) throw new Error(USAGE);
  const inputName = path.basename(file);

  if (values.prepare) {
    const batchSize = Number(values["batch-size"]);
    if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("--batch-size must be a positive integer");
    const outDir = path.resolve(/** @type {string} */ (values["out-dir"]));
    outsideGit(outDir, "--out-dir");
    ({ rows, expected } = readRows(x, file, !!values.calibrate));
    const window = values.calibrate ? SPRING_2026 : windowOf(rows, values.from, values.to);
    rows = values.calibrate ? rows : inWindow(rows, window);
    if (!rows.length) throw new Error("no rows to sort");
    const batches = toBatches(rows, batchSize);
    const stamp = x.now().toISOString().replace(/[:.]/g, "-");
    const kind = values.calibrate ? "calibration" : "labels";
    const batchDir = path.join(outDir, `${values.calibrate ? "calibration-batches" : "batches"}-${stamp}`);
    const labelsFile = path.join(outDir, `${kind}-${stamp}.jsonl`);
    x.mkdir(batchDir);
    for (const [i, batch] of batches.entries()) {
      const name = `batch-${i + 1}-of-${batches.length}.json`;
      x.writeFile(path.join(batchDir, name), JSON.stringify({ batch: i + 1, of: batches.length, prompt_sha256: promptSha, ...buildBatch(batch, prompt) }, null, 2) + "\n");
    }
    x.log(`prompt sha256 ${promptSha} · batch size ${batchSize}`);
    x.log(`${inputName}: ${rows.length} rows, ${batches.length} batches; window ${window.from} to ${window.to}`);
    x.log(`wrote ${batches.length} batch files to ${batchDir}`);
    x.log(`label each in a Claude Code session, appending to ${labelsFile}, then run --count on it`);
    return { promptSha, batches: batches.length, batchDir, labelsFile };
  }

  const labelsPath = path.resolve(/** @type {string} */ (values.count));
  outsideGit(labelsPath, "the labels file");
  ({ rows, expected } = readRows(x, file, !!values.calibrate));
  const window = values.calibrate ? SPRING_2026 : windowOf(rows, values.from, values.to);
  rows = values.calibrate ? rows : inWindow(rows, window);
  if (!rows.length) throw new Error("no rows to count");
  const labels = parseLabelLines(x.readFile(labelsPath), rows.map((r) => r.id));
  const result = expected ? calibrationReport(rows, expected, labels) : countPerWorkday(rows, labels, window);
  x.log(printable(result, !!expected));
  x.log(`prompt sha256 ${promptSha} · labelled in a Claude Code session; record the session's model id beside the count`);
  return { promptSha, result };
}

/**
 * @param {Io} x
 * @param {string} file
 * @param {boolean} calibrate
 */
function readRows(x, file, calibrate) {
  return calibrate ? corpusCalibrationRows(x.readFile(file)) : { rows: parseExport(x.readFile(file)), expected: null };
}

/**
 * @param {import("./lib.mjs").ExportRow[]} rows
 * @param {{ from: string, to: string }} window
 */
function inWindow(rows, window) {
  return rows.filter((r) => {
    const d = /** @type {string} */ (localDate(r.sent_at));
    return d >= window.from && d <= window.to;
  });
}

/**
 * @param {import("./lib.mjs").ExportRow[]} rows
 * @param {string | undefined} from
 * @param {string | undefined} to
 */
export function windowOf(rows, from, to) {
  const dates = rows.map((r) => /** @type {string} */ (localDate(r.sent_at))).sort();
  return { from: from ?? dates[0], to: to ?? dates[dates.length - 1] };
}

/**
 * @param {any} r
 * @param {boolean} calibration
 */
function printable(r, calibration) {
  if (calibration) {
    return [
      `calibration over ${r.rows} corpus rows (Spring 2026, ${r.workdays} workdays), ${r.labelled} labelled`,
      `housekeeping per workday: model ${r.model.housekeepingPerWorkday} · corpus ${r.corpus.housekeepingPerWorkday}`,
      `  (the published "about ${r.published.perWorkday}" also counts the inbox count's DM asks: ${r.published.how})`,
      `model called ${r.requestRecall}% of the corpus asks requests; What it took agreed on ${r.whatItTookAgreementPercent}%; a kind overlapped on ${r.kindOverlapPercent}%`,
      `What it took, % of requests: model ${JSON.stringify(r.model.splitPercent)}`,
      `                              corpus ${JSON.stringify(r.corpus.splitPercent)}`,
    ].join("\n");
  }
  return [
    `${r.window.from} to ${r.window.to}: ${r.window.workdays} workdays, ${r.messages} messages, ${r.requests} requests`,
    `housekeeping per workday: ${r.housekeepingPerWorkday} (${r.housekeeping} in all, ${r.weekendHousekeeping} of them on weekends)`,
    `What it took: ${JSON.stringify(r.split)}`,
    `housekeeping by source: ${JSON.stringify(r.housekeepingBySource)}`,
    `thanks to the lead: ${r.thanks} (${r.thanksPerWeek} a week)`,
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
