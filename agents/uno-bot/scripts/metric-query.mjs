#!/usr/bin/env node
// @ts-check
/**
 * Renders a metric query for `wrangler d1 execute`. It runs nothing itself:
 * it prints the statement, or writes it to --out, and the person running it
 * sends it to the database (agents/uno-bot/README.md § Metrics).
 *
 *   node scripts/metric-query.mjs <metric> [--from YYYY-MM-DD] [--to YYYY-MM-DD]
 *        [--graded <csv>] [--corpus <csv>] [--closures <json|csv>] [--out <file>]
 *
 * <metric> is a file name in queries/usage/, with or without `.sql`. The graded
 * answers default to the checked-in queries/usage/graded-answers.csv; the
 * corpus export and GitHub's closures are given when the query reads them.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { inputRows, parseCsv, referencedInputs, renderMetricQuery } from "./metric-query-render.mjs";

const QUERIES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../queries/usage");

/** @param {string} file */
function records(file) {
  const text = readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error(`${file} is not a JSON array`);
    return parsed;
  }
  return parseCsv(text);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    from: { type: "string" },
    to: { type: "string" },
    graded: { type: "string", default: path.join(QUERIES, "graded-answers.csv") },
    corpus: { type: "string" },
    closures: { type: "string" },
    out: { type: "string" },
  },
});

const name = positionals[0];
if (!name) {
  console.error("usage: node scripts/metric-query.mjs <metric> [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--out file]");
  process.exit(2);
}

const sql = readFileSync(path.join(QUERIES, name.endsWith(".sql") ? name : `${name}.sql`), "utf8");
const files = { graded_answers: values.graded, corpus_threads: values.corpus, ticket_closures: values.closures };
const flags = { graded_answers: "--graded", corpus_threads: "--corpus", ticket_closures: "--closures" };

/** @type {Record<string, import("./metric-query-render.mjs").SqlValue[][]>} */
const inputs = {};
for (const input of referencedInputs(sql)) {
  const file = /** @type {Record<string, string | undefined>} */ (files)[input];
  if (!file) {
    console.error(`${name} reads ${input}: pass ${/** @type {Record<string, string>} */ (flags)[input]} <file>`);
    process.exit(2);
  }
  inputs[input] = inputRows(input, records(file));
}

const rendered = renderMetricQuery(sql, { from: values.from, to: values.to, inputs });
if (values.out) writeFileSync(values.out, rendered);
else process.stdout.write(rendered);
