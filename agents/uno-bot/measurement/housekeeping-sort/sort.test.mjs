// @ts-check
// Offline tests for the housekeeping sort. Nothing here reaches the network,
// and the CLI runs read and write through a fake filesystem.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BOT_FIT_TO_WHAT_IT_TOOK, JUDGMENT, KINDS, LABEL_SCHEMA, NOT_A_REQUEST, SPRING_2026,
  buildBatch, calibrationReport, corpusCalibrationRows, countPerWorkday,
  localDate, parseExport, parseLabelLines, toBatches, workdays,
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

test("parseLabelLines holds a session's labels to the ids", () => {
  const one = (labels) => JSON.stringify({ labels });
  const got = parseLabelLines(one([label("b", false, NOT_A_REQUEST), label("a", true, "Could be looked up")]), ["a", "b"]);
  assert.deepEqual(got.map((l) => l.id), ["a", "b"], "returned in id order");
  assert.equal(got[1].what_it_took, null, "a non-request carries no What it took");

  assert.throws(() => parseLabelLines("not json", ["a"]), /line 1: not JSON/);
  assert.throws(() => parseLabelLines('{"note": 1}', ["a"]), /neither a label nor a labels array/);
  assert.throws(() => parseLabelLines(one([]), ["a"]), /no label for 1 id/);
  assert.throws(() => parseLabelLines(one([label("z", true, "Could be looked up")]), ["a"]), /unknown id z/);
  assert.throws(() => parseLabelLines(one([label("a", true, NOT_A_REQUEST)]), ["a"]), /needs a What it took/);
  assert.throws(() => parseLabelLines(one([label("a", true, "Could be looked up", { kinds: ["Gossip"] })]), ["a"]), /unknown kind/);
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

test("buildBatch carries the rubric, every row, their ids and the label schema", () => {
  const rows = parseExport([row("a", "dm", "2026-10-14"), row("b", "channel", "2026-10-14")].join("\n"));
  const b = buildBatch(rows, "RUBRIC");
  assert.equal(b.system, "RUBRIC");
  assert.deepEqual(b.ids, ["a", "b"]);
  assert.match(b.user, /^Label each of these 2 messages/);
  assert.match(b.user, /"id":"a"/);
  assert.match(b.user, /"id":"b"/);
  assert.deepEqual(b.output_schema, LABEL_SCHEMA);
  assert.equal("model" in b, false, "the model is the session's, not the batch's");
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
    row("7", "dm", "2026-10-15"), // never labeled
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

// ---------------------------------------------------------------- the CLI

const exportText = [row("a", "dm", "2026-10-12T15:00:00Z", "where is the file?"), row("b", "dm", "2026-10-13T15:00:00Z", "thanks!"), row("c", "meeting", "2026-10-13")].join("\n");
const fakeIo = (files, extra = {}) => {
  const lines = [];
  const written = {};
  return {
    lines, written,
    io: {
      log: (l) => lines.push(l),
      readFile: (p) => {
        if (p === PROMPT_FILE) return readFileSync(PROMPT_FILE, "utf8");
        if (!(p in files)) throw new Error(`no file ${p}`);
        return files[p];
      },
      writeFile: (p, d) => { written[p] = d; },
      mkdir: () => {},
      now: () => new Date("2026-10-20T12:00:00Z"),
      gitRootOf: () => null,
      ...extra,
    },
  };
};
const promptHash = () => sha256(readFileSync(PROMPT_FILE, "utf8"));
const asLines = (labels) => labels.map((l) => JSON.stringify(l)).join("\n") + "\n";

test("--prepare writes one batch file per batch, holding the prompt and the rows, and prints the sha256", async () => {
  const { io, lines, written } = fakeIo({ "export.jsonl": exportText });
  const out = await run(["--prepare", "export.jsonl", "--batch-size", "2", "--out-dir", "/out"], io);
  const text = lines.join("\n");
  assert.match(text, new RegExp(`prompt sha256 ${promptHash()}`));
  assert.match(text, /3 rows, 2 batches; window 2026-10-12 to 2026-10-13/);
  const files = Object.keys(written).sort();
  assert.deepEqual(files, ["/out/inbox-batches-2026-10-20T12-00-00-000Z/batch-1-of-2.json", "/out/inbox-batches-2026-10-20T12-00-00-000Z/batch-2-of-2.json"]);
  assert.match(text, /\/out\/inbox-batches-2026-10-20T12-00-00-000Z/);
  assert.match(text, /\/out\/inbox-labels-2026-10-20T12-00-00-000Z\.jsonl/, "names the labels file to append to");
  const first = JSON.parse(written[files[0]]);
  assert.equal(first.prompt_sha256, promptHash());
  assert.deepEqual(first.ids, ["a", "b"]);
  assert.equal(first.system, readFileSync(PROMPT_FILE, "utf8"));
  assert.match(first.user, /Label each of these 2 messages/);
  assert.match(first.user, /where is the file\?/);
  assert.doesNotMatch(first.user, /"id":"c"/);
  assert.deepEqual(JSON.parse(written[files[1]]).ids, ["c"]);
  assert.equal(out.batches, 2);
});

test("--prepare keeps to the window it is given", async () => {
  const { io, written } = fakeIo({ "export.jsonl": exportText });
  await run(["--prepare", "export.jsonl", "--from", "2026-10-13", "--out-dir", "/out"], io);
  const [only] = Object.values(written).map((d) => JSON.parse(d));
  assert.deepEqual(only.ids, ["b", "c"]);
});

test("--calibrate --prepare batches the Spring 2026 corpus rows", async () => {
  const corpus = [corpusLine({ _id: 1, bot_fit: "Lookup" }), corpusLine({ _id: 2, bot_fit: "Stays human" }), corpusLine({ _id: 3, bot_fit: "Lookup" })].join("\n");
  const { io, lines, written } = fakeIo({ "rows.jsonl": corpus });
  await run(["--calibrate", "--prepare", "rows.jsonl", "--batch-size", "2", "--out-dir", "/out"], io);
  assert.match(lines.join("\n"), /3 rows, 2 batches; window 2026-01-12 to 2026-05-01/);
  assert.ok(Object.keys(written).every((f) => f.startsWith("/out/calibration-batches-")));
  assert.match(lines.join("\n"), /\/out\/calibration-labels-.*\.jsonl/);
});

test("--calibrate refuses --from and --to: its window is fixed", async () => {
  const { io } = fakeIo({ "rows.jsonl": corpusLine({ _id: 1, bot_fit: "Lookup" }) });
  await assert.rejects(run(["--calibrate", "--prepare", "rows.jsonl", "--from", "2026-02-01", "--out-dir", "/out"], io), /fixed Spring 2026 window/);
  await assert.rejects(run(["--calibrate", "--count", "/out/cal.jsonl", "rows.jsonl", "--to", "2026-03-01"], io), /fixed Spring 2026 window/);
});

test("calibration counts a Spring 2026 corpus row dated before the window opens, and needs its label", async () => {
  // The corpus's semester label decides membership, not the date (lib.mjs
  // corpusCalibrationRows), so a row dated 2026-01-05 is in the report.
  const corpus = [corpusLine({ _id: 1, bot_fit: "Lookup", date: "2026-01-05" }), corpusLine({ _id: 2, bot_fit: "Lookup" })].join("\n");
  const both = asLines([label("1", true, "Could be looked up"), label("2", true, "Could be looked up")]);
  const { io } = fakeIo({ "rows.jsonl": corpus, "/out/cal.jsonl": both });
  const out = /** @type {any} */ (await run(["--calibrate", "--count", "/out/cal.jsonl", "rows.jsonl"], io));
  assert.equal(out.result.rows, 2);
  assert.equal(out.result.labeled, 2);
  assert.equal(out.result.corpus.housekeeping, 2);
  assert.equal(out.result.model.housekeeping, 2);

  const missing = fakeIo({ "rows.jsonl": corpus, "/out/cal.jsonl": asLines([label("2", true, "Could be looked up")]) });
  await assert.rejects(run(["--calibrate", "--count", "/out/cal.jsonl", "rows.jsonl"], missing.io), /no label for 1 id\(s\): 1/);
});

test("--count prints housekeeping requests per workday and the prompt sha256", async () => {
  const labels = asLines([
    label("a", true, "Could be looked up"),
    { ...label("b", false, NOT_A_REQUEST, { is_thanks: true }), what_it_took: NOT_A_REQUEST },
    label("c", true, "Needs prep, then a person"),
  ]);
  const { io, lines, written } = fakeIo({ "export.jsonl": exportText, "/out/labels.jsonl": labels });
  const out = await run(["--count", "/out/labels.jsonl", "export.jsonl"], io);
  const text = lines.join("\n");
  assert.match(text, new RegExp(`prompt sha256 ${promptHash()}`));
  assert.match(text, /labeled in a Claude Code session/);
  assert.match(text, /housekeeping per workday: 1 \(2 in all/);
  assert.equal(/** @type {any} */ (out.result).housekeeping, 2);
  assert.deepEqual(written, {}, "count writes nothing");
});

test("--count reads a batch's whole response on one line, as the prompt returns it", async () => {
  const labels = JSON.stringify({ labels: [label("a", true, "Could be looked up"), label("b", true, JUDGMENT)] }) + "\n" + JSON.stringify(label("c", true, "Could be looked up")) + "\n";
  const { io } = fakeIo({ "export.jsonl": exportText, "/out/labels.jsonl": labels });
  const out = await run(["--count", "/out/labels.jsonl", "export.jsonl"], io);
  assert.equal(/** @type {any} */ (out.result).housekeeping, 2);
});

test("--count refuses a missing, a duplicate or a stranger's label", async () => {
  const a = label("a", true, "Could be looked up");
  const b = label("b", true, "Could be looked up");
  const c = label("c", true, "Could be looked up");
  const cases = [
    [asLines([a, b]), /no label for 1 id\(s\): c/],
    [asLines([a, b, c, a]), /two labels for id a/],
    [asLines([a, b, c, label("z", true, "Could be looked up")]), /unknown id z/],
    [`${JSON.stringify(a)}\n{"id":`, /labels line 2: not JSON/],
  ];
  for (const [labels, err] of cases) {
    const { io } = fakeIo({ "export.jsonl": exportText, "/out/labels.jsonl": labels });
    await assert.rejects(run(["--count", "/out/labels.jsonl", "export.jsonl"], io), err);
  }
});

test("--count only asks for labels inside the window", async () => {
  const { io } = fakeIo({ "export.jsonl": exportText, "/out/labels.jsonl": asLines([label("b", true, "Could be looked up"), label("c", true, JUDGMENT)]) });
  const out = await run(["--count", "/out/labels.jsonl", "export.jsonl", "--from", "2026-10-13"], io);
  assert.equal(/** @type {any} */ (out.result).housekeeping, 1);
});

test("--calibrate --count prints the calibration report", async () => {
  const corpus = [corpusLine({ _id: 1, bot_fit: "Lookup" }), corpusLine({ _id: 2, bot_fit: "Stays human" })].join("\n");
  const { io, lines } = fakeIo({ "rows.jsonl": corpus, "/out/cal.jsonl": asLines([label("1", true, "Could be looked up"), label("2", true, "Could be looked up")]) });
  const out = await run(["--calibrate", "--count", "/out/cal.jsonl", "rows.jsonl"], io);
  const text = lines.join("\n");
  assert.match(text, /calibration over 2 corpus rows/);
  assert.match(text, new RegExp(`prompt sha256 ${promptHash()}`));
  assert.equal(/** @type {any} */ (out.result).whatItTookAgreementPercent, 50);
});

test("a run names one mode", async () => {
  const { io } = fakeIo({ "export.jsonl": exportText });
  await assert.rejects(run(["export.jsonl"], io), /--prepare or --count/);
  await assert.rejects(run(["--prepare", "--count", "x", "export.jsonl"], io), /--prepare or --count/);
});

test("gitRootOf finds the nearest ancestor holding .git, as a directory or a worktree's file", () => {
  const has = new Set(["/repo/.git"]);
  assert.equal(gitRootOf("/repo/a/b", (p) => has.has(p)), "/repo");
  assert.equal(gitRootOf("/elsewhere/out", (p) => has.has(p)), null);
});

test("an --out-dir inside a git working tree is refused before anything is read or written", async () => {
  const { io, written } = fakeIo({ "export.jsonl": exportText }, { gitRootOf: (p) => (p.startsWith("/repo") ? "/repo" : null) });
  await assert.rejects(run(["--prepare", "export.jsonl", "--out-dir", "/repo/agents/uno-bot/out"], io), /inside the git working tree \/repo/);
  assert.deepEqual(written, {});
});

test("a labels file inside a git working tree is refused", async () => {
  const { io } = fakeIo({ "export.jsonl": exportText, "/repo/labels.jsonl": "" }, { gitRootOf: (p) => (p.startsWith("/repo") ? "/repo" : null) });
  await assert.rejects(run(["--count", "/repo/labels.jsonl", "export.jsonl"], io), /inside the git working tree \/repo/);
});

test("this repo itself is refused as an --out-dir, with the real git lookup", async () => {
  const here = new URL(".", import.meta.url).pathname;
  const { io } = fakeIo({ "export.jsonl": exportText }, { gitRootOf: (p) => gitRootOf(p) });
  await assert.rejects(run(["--prepare", "export.jsonl", "--out-dir", here], io), /inside the git working tree/);
});
