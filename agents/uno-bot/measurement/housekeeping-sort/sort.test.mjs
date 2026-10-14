// @ts-check
// Offline tests for the housekeeping sort. Nothing here reaches the network:
// the one full run goes through a fake fetch.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BOT_FIT_TO_WHAT_IT_TOOK, JUDGMENT, KINDS, MODEL, NOT_A_REQUEST, SPRING_2026,
  buildRequest, calibrationReport, corpusCalibrationRows, countPerWorkday,
  estimateCost, localDate, parseExport, parseLabels, toBatches, workdays,
} from "./lib.mjs";
import { PROMPT_FILE, gitRootOf, run, sha256 } from "./sort.mjs";

const row = (id, source, sent_at, text = "placeholder text") => JSON.stringify({ id, source, sent_at, sender: "Someone", text });
const label = (id, is_request, what_it_took, extra = {}) => ({ id, is_request, is_thanks: false, what_it_took, kinds: is_request ? ["Artifact location"] : [], ...extra });

// ---------------------------------------------------------------- parsing

test("parseExport reads rows and skips blank lines", () => {
  const rows = parseExport([row("a", "dm", "2026-10-14T14:00:00Z"), "", row("b", "meeting", "2026-10-15")].join("\n"));
  assert.deepEqual(rows.map((r) => r.id), ["a", "b"]);
  assert.equal(rows[1].source, "meeting");
});

test("parseExport names the line of a bad row instead of dropping it", () => {
  assert.throws(() => parseExport(`${row("a", "dm", "2026-10-14")}\n{"id":"b"`), /line 2: not JSON/);
  assert.throws(() => parseExport(row("a", "email", "2026-10-14")), /line 1: source must be/);
  assert.throws(() => parseExport(row("a", "dm", "yesterday")), /sent_at is not a date/);
  assert.throws(() => parseExport(row("a", "dm", "2026-10-14", " ")), /missing text/);
  assert.throws(() => parseExport([row("a", "dm", "2026-10-14"), row("a", "dm", "2026-10-14")].join("\n")), /duplicate id a/);
});

test("localDate puts a late-evening UTC timestamp on its Eastern date", () => {
  assert.equal(localDate("2026-10-15T02:30:00Z"), "2026-10-14");
  assert.equal(localDate("2026-10-14"), "2026-10-14");
  assert.equal(localDate("2026-02-30"), null);
});

test("parseLabels holds a response to its batch", () => {
  const ok = JSON.stringify({ labels: [label("b", false, NOT_A_REQUEST), label("a", true, "Could be looked up")] });
  const got = parseLabels(ok, ["a", "b"]);
  assert.deepEqual(got.map((l) => l.id), ["a", "b"], "returned in batch order");
  assert.equal(got[1].what_it_took, null, "a non-request carries no What it took");

  assert.throws(() => parseLabels("not json", ["a"]), /not JSON/);
  assert.throws(() => parseLabels(JSON.stringify({ labels: [] }), ["a"]), /no label for 1 id/);
  assert.throws(() => parseLabels(JSON.stringify({ labels: [label("z", true, "Could be looked up")] }), ["a"]), /unknown id z/);
  assert.throws(() => parseLabels(JSON.stringify({ labels: [label("a", true, NOT_A_REQUEST)] }), ["a"]), /needs a What it took/);
  assert.throws(() => parseLabels(JSON.stringify({ labels: [label("a", true, "Could be looked up", { kinds: ["Gossip"] })] }), ["a"]), /unknown kind/);
});

test("the kinds are the corpus Sub-type options, and every bot_fit folds to a legend word", () => {
  assert.equal(KINDS.length, 29);
  assert.ok(KINDS.includes("Artifact location") && KINDS.includes("Design judgment"));
  assert.deepEqual(new Set(Object.values(BOT_FIT_TO_WHAT_IT_TOOK)), new Set(["Could be looked up", "Needs prep, then a person", "Needs the lead's judgment"]));
});

// ---------------------------------------------------------------- batching

test("toBatches splits into fixed-size batches with a short last one", () => {
  assert.deepEqual(toBatches([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(toBatches([], 2), []);
  assert.throws(() => toBatches([1], 0), /positive integer/);
});

test("buildRequest pins the model, sends no temperature, and carries every row", () => {
  const rows = parseExport([row("a", "dm", "2026-10-14"), row("b", "channel", "2026-10-14")].join("\n"));
  const body = buildRequest(rows, "RUBRIC");
  assert.equal(body.model, MODEL);
  assert.equal("temperature" in body, false);
  assert.equal(body.system[0].text, "RUBRIC");
  assert.match(body.messages[0].content, /"id":"a"/);
  assert.match(body.messages[0].content, /"id":"b"/);
});

// ---------------------------------------------------------------- counting

test("Spring 2026 has the baseline's 80 workdays", () => {
  assert.equal(workdays(SPRING_2026.from, SPRING_2026.to).length, 80);
  assert.deepEqual(workdays("2026-10-16", "2026-10-19"), ["2026-10-16", "2026-10-19"], "Friday and Monday, not the weekend");
});

test("countPerWorkday counts housekeeping requests over Monday-to-Friday days", () => {
  const rows = parseExport([
    row("1", "dm", "2026-10-12"), // Monday, lookup
    row("2", "channel", "2026-10-13"), // Tuesday, prep
    row("3", "dm", "2026-10-13"), // judgment: not housekeeping
    row("4", "meeting", "2026-10-17"), // Saturday: counted, and reported apart
    row("5", "dm", "2026-10-14"), // chatter
    row("6", "dm", "2026-10-30"), // outside the window
    row("7", "dm", "2026-10-15"), // never labelled
  ].join("\n"));
  const labels = [
    label("1", true, "Could be looked up"),
    label("2", true, "Needs prep, then a person"),
    label("3", true, JUDGMENT),
    label("4", true, "Could be looked up"),
    label("5", false, NOT_A_REQUEST, { is_thanks: true }),
    label("6", true, "Could be looked up"),
  ].map((l) => ({ ...l, what_it_took: l.is_request ? l.what_it_took : null }));
  const c = countPerWorkday(rows, /** @type {any} */ (labels), { from: "2026-10-12", to: "2026-10-18" });
  assert.equal(c.window.workdays, 5);
  assert.equal(c.messages, 6);
  assert.equal(c.unlabelled, 1);
  assert.equal(c.requests, 4);
  assert.equal(c.housekeeping, 3);
  assert.equal(c.weekendHousekeeping, 1);
  assert.equal(c.housekeepingPerWorkday, 0.6);
  assert.equal(c.thanks, 1);
  assert.deepEqual(c.split, { "Could be looked up": 2, "Needs prep, then a person": 1, "Needs the lead's judgment": 1 });
  assert.deepEqual(c.housekeepingBySource, { dm: 1, channel: 1, meeting: 1 });
  assert.equal(c.perDay["2026-10-13"], 1);
});

// ---------------------------------------------------------------- calibration

const corpusLine = (o) => JSON.stringify({ in_stats: true, semester: "Spring 2026", source: "Slack DM", subtypes: ["Artifact location"], request: "a request", date: "2026-02-03", ...o });

test("corpusCalibrationRows takes Spring 2026 asks in the stats base, with their corpus labels", () => {
  const jsonl = [
    corpusLine({ _id: 1, bot_fit: "Lookup" }),
    corpusLine({ _id: 2, bot_fit: "Stays human", source: "Zoom recap" }),
    corpusLine({ _id: 3, bot_fit: "Lookup", in_stats: false }),
    corpusLine({ _id: 4, bot_fit: "Lookup", semester: "Fall 2025" }),
  ].join("\n");
  const { rows, expected } = corpusCalibrationRows(jsonl);
  assert.deepEqual(rows.map((r) => r.id), ["1", "2"]);
  assert.equal(rows[1].source, "meeting");
  assert.equal(expected.get("2")?.what_it_took, JUDGMENT);
  assert.throws(() => corpusCalibrationRows(corpusLine({ _id: 9, bot_fit: "Maybe" })), /unknown bot_fit/);
});

test("calibrationReport compares the model with the corpus per workday and per row", () => {
  const { rows, expected } = corpusCalibrationRows([
    corpusLine({ _id: 1, bot_fit: "Lookup" }),
    corpusLine({ _id: 2, bot_fit: "Human + bot prep", subtypes: ["Design judgment"] }),
    corpusLine({ _id: 3, bot_fit: "Stays human" }),
    corpusLine({ _id: 4, bot_fit: "Automation" }),
  ].join("\n"));
  const labels = /** @type {any} */ ([
    label("1", true, "Could be looked up"),
    label("2", true, "Could be looked up"),
    label("3", true, JUDGMENT),
    { ...label("4", false, NOT_A_REQUEST), what_it_took: null },
  ]);
  const r = calibrationReport(rows, expected, labels, 2);
  assert.equal(r.corpus.housekeeping, 3);
  assert.equal(r.corpus.housekeepingPerWorkday, 1.5);
  assert.equal(r.model.housekeeping, 2);
  assert.equal(r.model.housekeepingPerWorkday, 1);
  assert.equal(r.requestRecall, 75);
  assert.equal(r.whatItTookAgreementPercent, 66.7);
  assert.equal(r.kindOverlapPercent, 66.7);
  assert.equal(r.confusion["Needs prep, then a person"]["Could be looked up"], 1);
  assert.equal(r.confusion["Could be looked up"][NOT_A_REQUEST], 1);
  assert.deepEqual(r.corpus.splitPercent, { "Could be looked up": 50, "Needs prep, then a person": 25, "Needs the lead's judgment": 25 });
  assert.equal(r.published.perWorkday, 9);
});

test("estimateCost prices batches at the pinned model's list price", () => {
  const e = estimateCost({ promptChars: 8000, rowChars: Array(50).fill(400), batchSize: 25, outputTokensPerRow: 40 });
  assert.equal(e.requests, 2);
  assert.equal(e.inputTokens, 2 * 2000 + 50 * 125);
  assert.equal(e.outputTokens, 2000);
  assert.equal(e.usd, Math.round(((10250 * 2 + 2000 * 10) / 1e6) * 100) / 100);
});

// ---------------------------------------------------------------- the CLI

const exportText = [row("a", "dm", "2026-10-12T15:00:00Z", "where is the file?"), row("b", "dm", "2026-10-13T15:00:00Z", "thanks!"), row("c", "meeting", "2026-10-13")].join("\n");
const fakeIo = (files, extra = {}) => {
  const lines = [];
  const written = {};
  return {
    lines, written,
    io: {
      env: {},
      log: (l) => lines.push(l),
      readFile: (p) => (p === PROMPT_FILE ? readFileSync(PROMPT_FILE, "utf8") : files[p]),
      writeFile: (p, d) => { written[p] = d; },
      mkdir: () => {},
      fetch: () => { throw new Error("network touched"); },
      now: () => new Date("2026-10-20T12:00:00Z"),
      gitRootOf: () => null,
      ...extra,
    },
  };
};

test("--dry-run prints the model, prompt hash and the request for 2 rows, and sends nothing", async () => {
  const { io, lines, written } = fakeIo({ "export.jsonl": exportText });
  const out = await run(["export.jsonl", "--dry-run"], io);
  const text = lines.join("\n");
  const promptHash = sha256(readFileSync(PROMPT_FILE, "utf8"));
  assert.match(text, new RegExp(`model ${MODEL} · prompt sha256 ${promptHash} · batch size 25`));
  assert.match(text, /3 rows, 1 requests; window 2026-10-12 to 2026-10-13/);
  assert.match(text, /estimated cost: ~\$/);
  const body = JSON.parse(text.slice(text.indexOf("{")));
  assert.equal(body.model, MODEL);
  assert.match(body.messages[0].content, /Label each of these 2 messages/);
  assert.doesNotMatch(body.messages[0].content, /"id":"c"/);
  assert.equal(out.dryRun, true);
  assert.deepEqual(written, {});
});

test("--dry-run works on the calibration rows too, with no key", async () => {
  const corpus = [corpusLine({ _id: 1, bot_fit: "Lookup" }), corpusLine({ _id: 2, bot_fit: "Stays human" }), corpusLine({ _id: 3, bot_fit: "Lookup" })].join("\n");
  const { io, lines } = fakeIo({ "rows.jsonl": corpus });
  await run(["--calibrate", "rows.jsonl", "--dry-run", "--batch-size", "2"], io);
  assert.match(lines.join("\n"), /3 rows, 2 requests; window 2026-01-12 to 2026-05-01/);
});

test("a real run refuses without a key, and never prints one", async () => {
  const { io } = fakeIo({ "export.jsonl": exportText });
  await assert.rejects(run(["export.jsonl"], io), /ANTHROPIC_API_KEY is not set/);

  const calls = [];
  const fetchFake = async (_url, init) => {
    calls.push(init);
    return new Response(JSON.stringify({
      stop_reason: "end_turn",
      usage: { input_tokens: 100, output_tokens: 50 },
      content: [{ type: "text", text: JSON.stringify({ labels: [
        label("a", true, "Could be looked up"),
        { ...label("b", false, NOT_A_REQUEST, { is_thanks: true }), what_it_took: NOT_A_REQUEST },
        label("c", true, "Needs prep, then a person"),
      ] }) }],
    }), { status: 200 });
  };
  const run2 = fakeIo({ "export.jsonl": exportText }, { env: { ANTHROPIC_API_KEY: "test-key-not-real" }, fetch: fetchFake });
  const out = await run(["export.jsonl", "--out-dir", "/out"], run2.io);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers["x-api-key"], "test-key-not-real");
  assert.doesNotMatch(run2.lines.join("\n"), /test-key-not-real/);
  const files = Object.keys(run2.written);
  assert.equal(files.length, 2);
  const labelsFile = /** @type {string} */ (files.find((f) => f.endsWith(".jsonl")));
  const [first, ...rest] = run2.written[labelsFile].trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(first.header.model, MODEL);
  assert.equal(first.header.batch_size, 25);
  assert.equal(first.header.prompt_sha256, sha256(readFileSync(PROMPT_FILE, "utf8")));
  assert.equal(rest.length, 3);
  assert.doesNotMatch(run2.written[labelsFile], /where is the file/, "labels carry no message text");
  assert.equal(/** @type {any} */ (out.result).housekeeping, 2);
  assert.equal(/** @type {any} */ (out.result).housekeepingPerWorkday, 1);
});

test("gitRootOf finds the nearest ancestor holding .git, as a directory or a worktree's file", () => {
  const has = new Set(["/repo/.git"]);
  assert.equal(gitRootOf("/repo/a/b", (p) => has.has(p)), "/repo");
  assert.equal(gitRootOf("/elsewhere/out", (p) => has.has(p)), null);
});

test("an --out-dir inside a git working tree is refused before anything is read or sent", async () => {
  const { io, written } = fakeIo({ "export.jsonl": exportText }, { env: { ANTHROPIC_API_KEY: "test-key-not-real" }, gitRootOf: (p) => (p.startsWith("/repo") ? "/repo" : null) });
  await assert.rejects(run(["export.jsonl", "--out-dir", "/repo/agents/uno-bot/out"], io), /inside the git working tree \/repo/);
  assert.deepEqual(written, {});
});

test("this repo itself is refused as an --out-dir, with the real git lookup", async () => {
  const here = new URL(".", import.meta.url).pathname;
  const { io } = fakeIo({ "export.jsonl": exportText }, { gitRootOf: (p) => gitRootOf(p) });
  await assert.rejects(run(["export.jsonl", "--dry-run", "--out-dir", here], io), /inside the git working tree/);
});
