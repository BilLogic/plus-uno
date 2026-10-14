#!/usr/bin/env node
// @ts-check
/**
 * The pinned housekeeping sort for the lead's inbox: the same LLM sort as the
 * baseline, with its prompt (prompt.md) and model (lib.mjs MODEL) pinned so a
 * count can be re-run and cited. The definitions it counts by, and where each
 * came from, are at the top of lib.mjs.
 *
 *   node sort.mjs <export.jsonl> [--from YYYY-MM-DD] [--to YYYY-MM-DD]
 *        [--batch-size N] [--out-dir DIR] [--dry-run]
 *   node sort.mjs --calibrate [recovered-rows.jsonl] [--dry-run]
 *
 * The export is one JSON object a line: id, source (dm|channel|meeting),
 * sent_at, sender, text. Labels and the summary are written to --out-dir,
 * which defaults OUTSIDE the repo (~/Documents/Claude/Projects/PLUS/
 * uno-bot-measurement/) and is refused when it falls inside a git working
 * tree: message text, labels and exports never go in git.
 *
 * --dry-run prints the request it would send for the first 2 rows and an
 * estimated cost, and touches no network. A real run reads ANTHROPIC_API_KEY
 * from the environment and spends money; the key is never printed.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  DEFAULT_BATCH_SIZE, EFFORT, MODEL, SPRING_2026, TEMPERATURE,
  buildRequest, calibrationReport, corpusCalibrationRows, countPerWorkday,
  estimateCost, localDate, parseExport, parseLabels, toBatches,
} from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROMPT_FILE = path.join(HERE, "prompt.md");
const PLUS = path.join(os.homedir(), "Documents", "Claude", "Projects", "PLUS");
export const DEFAULT_OUT_DIR = path.join(PLUS, "uno-bot-measurement");
export const DEFAULT_CORPUS = path.join(PLUS, "uno-bot-corpus", "recovered-rows.jsonl");
const API = "https://api.anthropic.com/v1/messages";

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
 *   env: Record<string, string | undefined>,
 *   log: (line: string) => void,
 *   readFile: (p: string) => string,
 *   writeFile: (p: string, data: string) => void,
 *   mkdir: (p: string) => void,
 *   fetch: typeof fetch,
 *   now: () => Date,
 *   gitRootOf: (p: string) => string | null,
 * }} Io
 */

/** @type {Io} */
const realIo = {
  env: process.env,
  log: (line) => console.log(line),
  readFile: (p) => readFileSync(p, "utf8"),
  writeFile: (p, d) => writeFileSync(p, d),
  mkdir: (p) => mkdirSync(p, { recursive: true }),
  fetch: (input, init) => fetch(input, init),
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
      from: { type: "string" },
      to: { type: "string" },
      "batch-size": { type: "string", default: String(DEFAULT_BATCH_SIZE) },
      "out-dir": { type: "string", default: DEFAULT_OUT_DIR },
      "dry-run": { type: "boolean", default: false },
      calibrate: { type: "boolean", default: false },
    },
  });
  const batchSize = Number(values["batch-size"]);
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("--batch-size must be a positive integer");
  const outDir = path.resolve(/** @type {string} */ (values["out-dir"]));
  const repo = x.gitRootOf(outDir);
  if (repo) throw new Error(`--out-dir ${outDir} is inside the git working tree ${repo}; labels and summaries must stay out of git`);

  const prompt = x.readFile(PROMPT_FILE);
  const header = {
    model: MODEL,
    prompt_sha256: sha256(prompt),
    batch_size: batchSize,
    effort: EFFORT,
    temperature: TEMPERATURE ?? "not sent (the pinned model rejects non-default sampling)",
  };

  /** @type {import("./lib.mjs").ExportRow[]} */
  let rows;
  /** @type {ReturnType<typeof corpusCalibrationRows>["expected"] | null} */
  let expected = null;
  let inputName;
  if (values.calibrate) {
    const file = positionals[0] ?? DEFAULT_CORPUS;
    ({ rows, expected } = corpusCalibrationRows(x.readFile(file)));
    inputName = path.basename(file);
  } else {
    const file = positionals[0];
    if (!file) throw new Error("usage: node sort.mjs <export.jsonl> [--from] [--to] [--dry-run], or --calibrate [corpus]");
    rows = parseExport(x.readFile(file));
    inputName = path.basename(file);
  }
  if (!rows.length) throw new Error("no rows to sort");
  const window = values.calibrate ? SPRING_2026 : windowOf(rows, values.from, values.to);
  const batches = toBatches(rows, batchSize);
  const estimate = estimateCost({ promptChars: prompt.length, rowChars: rows.map((r) => r.text.length + r.sender.length + 60), batchSize });

  x.log(`model ${header.model} · prompt sha256 ${header.prompt_sha256} · batch size ${batchSize}`);
  x.log(`${inputName}: ${rows.length} rows, ${batches.length} requests; window ${window.from} to ${window.to}`);
  x.log(`estimated cost: ~$${estimate.usd.toFixed(2)} (${estimate.inputTokens} input, ${estimate.outputTokens} output tokens; list price, before caching)`);

  if (values["dry-run"]) {
    x.log("dry run: the request for the first 2 rows (nothing sent)");
    x.log(JSON.stringify(buildRequest(rows.slice(0, 2), prompt), null, 2));
    return { header, estimate, dryRun: true };
  }

  const key = x.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");

  /** @type {import("./lib.mjs").Label[]} */
  const labels = [];
  const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  for (const [i, batch] of batches.entries()) {
    const res = await call(x.fetch, key, buildRequest(batch, prompt));
    for (const k of /** @type {(keyof typeof usage)[]} */ (Object.keys(usage))) usage[k] += Number(res.usage?.[k] ?? 0);
    labels.push(...parseLabels(responseText(res), batch.map((r) => r.id)));
    x.log(`batch ${i + 1}/${batches.length} labelled`);
  }

  const stamp = x.now().toISOString().replace(/[:.]/g, "-");
  x.mkdir(outDir);
  const fullHeader = { ...header, input: inputName, rows: rows.length, window, run_at: x.now().toISOString(), usage };
  const labelsFile = path.join(outDir, `${values.calibrate ? "calibration" : "labels"}-${stamp}.jsonl`);
  // Ids and labels only. The text stays in the export it came from.
  x.writeFile(labelsFile, [JSON.stringify({ header: fullHeader }), ...labels.map((l) => JSON.stringify(l))].join("\n") + "\n");

  const result = expected
    ? calibrationReport(rows, expected, labels)
    : countPerWorkday(rows, labels, window);
  const summaryFile = labelsFile.replace(/\.jsonl$/, ".summary.json");
  x.writeFile(summaryFile, JSON.stringify({ header: fullHeader, result }, null, 2) + "\n");

  x.log(printable(result, !!expected));
  x.log(`usage: ${usage.input_tokens} input (+${usage.cache_read_input_tokens} cached), ${usage.output_tokens} output tokens`);
  x.log(`wrote ${labelsFile}`);
  x.log(`wrote ${summaryFile}`);
  return { header: fullHeader, result, labelsFile, summaryFile };
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
 * One Messages API call, retried on rate limits and server errors. A refusal
 * or a cut-off response is an error: a batch either gets every label or none.
 * @param {typeof fetch} doFetch
 * @param {string} key
 * @param {object} body
 */
async function call(doFetch, key, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await doFetch(API, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.stop_reason === "refusal") throw new Error(`the model declined a batch (${json.stop_details?.category ?? "no category"})`);
      if (json.stop_reason === "max_tokens") throw new Error("a batch's labels were cut off at max_tokens; lower --batch-size");
      return json;
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 3) throw new Error(`Messages API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
  }
}

/** @param {any} res */
function responseText(res) {
  const block = (res.content ?? []).find((/** @type {any} */ b) => b.type === "text");
  if (!block) throw new Error("response has no text block");
  return block.text;
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
