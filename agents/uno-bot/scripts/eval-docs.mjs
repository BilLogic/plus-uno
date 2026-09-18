// The prose about the eval suite, written FROM the suite.
//
// Three documents used to narrate the cases by hand: `docs/evals/README.md`
// stated a case count, `docs/evals/fixtures/recordings/README.md` stated how
// many of them were recorded, and `docs/evals/scenarios/uno-bot.md` described
// each one. All three are derived facts, and all three drifted — the count once
// (it read 16 while the file held 20), and the scenarios document badly: it
// listed four cases the fixture has never held and omitted twelve it does.
//
// So they are generated. The census is the source (`eval-case.mjs`), the
// recordings answer "which cases does the pull-request gate actually reach",
// and `eval-docs.test.mjs` fails when what is committed is not what this
// produces. A number nothing compares is a number that will be wrong.
//
//   node agents/uno-bot/scripts/eval-docs.mjs            # print what is stale
//   node agents/uno-bot/scripts/eval-docs.mjs --write    # write it
//
// WHAT IS NOT GENERATED: what a case ASSERTS. Every word of a scenario comes
// from the fixture's own `name`, `prompt`, assertion keys and `judgeNote`, so
// there is no second place to write down what "good" means and no second place
// for it to rot. Scenarios written down and deliberately NOT in the fixture
// live in the fixture too, as `_proposed`, and the document says plainly that
// nothing runs them.

import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isEntry } from "../../../scripts/lib/findings.mjs";

import { CASE_SPEC_KEYS, TURN_SPEC_KEYS, censusOf, loadCases, samplesOf } from "./eval-case.mjs";
import { loadRecordings } from "./eval-transport-local.mjs";

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), "../../../docs/evals");
export const SCENARIOS_PATH = resolve(DOCS, "scenarios/uno-bot.md");
export const EVALS_README_PATH = resolve(DOCS, "README.md");
export const RECORDINGS_README_PATH = resolve(DOCS, "fixtures/recordings/README.md");

const GENERATED_BY = "agents/uno-bot/scripts/eval-docs.mjs";

// ── A block inside a hand-written document ───────────────────────────────────
//
// The two READMEs stay hand-written; only the counts in them are generated, and
// they are fenced so a reader can see which sentences are nobody's to edit.

const start = (name) =>
  `<!-- census:${name} — generated from docs/evals/fixtures/uno-bot-cases.json by ${GENERATED_BY}; do not edit by hand -->`;
const end = (name) => `<!-- /census:${name} -->`;

/** Replace a fenced block's body, or throw naming the document that lost it. */
export function replaceBlock(text, name, body) {
  const from = text.indexOf(start(name));
  const to = text.indexOf(end(name));
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`no '${name}' census block — restore the markers or re-add the block`);
  }
  return `${text.slice(0, from)}${start(name)}\n${body.trim()}\n${end(name)}${text.slice(to + end(name).length)}`;
}

// ── The blocks ───────────────────────────────────────────────────────────────

/**
 * The suite's shape, for `docs/evals/README.md` — and for the head of the
 * scenarios document, which is the same table read from the same census.
 * `pointer` is false there only because a document does not point at itself.
 */
export function renderCensusBlock(census, { pointer = true } = {}) {
  const families = census.families.map((f) => `${f.prefix}×${f.count}`).join(" · ");
  return [
    "| What the uno-bot fixture holds | |",
    "|---|---|",
    `| cases | **${census.total}** (${families}) |`,
    `| blockers | ${census.blockers} |`,
    `| turns · sample runs | ${census.turns} · ${census.samples} |`,
    `| cases picking a subject from the live board | ${census.withSubject} (${census.subjects.map((s) => `\`${s.need}\`×${s.count}`).join(", ")}) |`,
    `| recorded, so the pull-request gate reaches them | ${census.recorded ?? "not reported by this transport"} |`,
    `| **ungated** — no recording, skipped by name, gating nothing | ${census.ungated.length ? `**${census.ungated.join(", ")}**` : "none"} |`,
    "",
    `Counted, not typed: \`${GENERATED_BY}\`, from the fixture and \`fixtures/recordings/\`.${pointer ? " The scenario-by-scenario census is `scenarios/uno-bot.md`." : ""}`,
  ].join("\n");
}

/**
 * What is recorded, for `docs/evals/fixtures/recordings/README.md`.
 *
 * A census with no recordings reported has nothing to say here, so this refuses
 * rather than printing `null` as `0` — "none are recorded" is a claim, and this
 * renderer is never given the input to make it.
 */
export function renderRecordedBlock(census, sources) {
  if (census.recorded === null) throw new Error("no recordings reported — nothing to say about what is recorded");
  const kinds = [...sources.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, n]) => `${n} \`${source}\``)
    .join(", ");
  const head = `**${census.recorded} of ${census.total} fixture cases are recorded** — ${kinds || "none"}.`;
  const tail = census.ungated.length
    ? `The other ${census.ungated.length} are **ungated**: ${census.ungated.join(", ")}. Each skips by name on the pull-request gate, so nothing about it is measured there — record it (\`-f cases=<id>\` below) or accept that it gates nothing.`
    : "No case skips for want of a recording, so the local run is the whole suite's turn behaviour against one afternoon's draw.";
  return `${head} ${tail}`;
}

// ── The scenarios document ───────────────────────────────────────────────────

const quote = (s) => `"${s.replace(/\s+/g, " ").trim()}"`;

/** One case's deterministic assertions, as the fixture states them. */
function assertions(spec, keys) {
  return keys
    .filter((k) => k in spec)
    .map((k) => `\`${k}\`: \`${JSON.stringify(spec[k])}\``)
    .join(" · ");
}

function renderCase(c, { recorded }) {
  const badges = [
    c.blocker ? "**blocker**" : "advisory",
    `${samplesOf(c)} sample${samplesOf(c) === 1 ? "" : "s"}`,
    recorded === null ? null : recorded ? "recorded" : "**UNGATED — no recording**",
  ].filter(Boolean);
  const lines = [`## ${c.id} — ${c.name}`, "", `_${badges.join(" · ")}_`, ""];
  if (c.subject?.need) {
    lines.push(
      `- **Subject:** the live board answers \`${c.subject.need}\` before turn 1, and every \`{{subject.…}}\` below is filled in from the row it returns. The case names a condition, never a row.`,
    );
  }
  if (c.channel || c.requestedBy) {
    lines.push(
      `- **Surface:** ${[c.channel && `channel \`${c.channel}\``, c.requestedBy && `requested by \`${c.requestedBy}\``].filter(Boolean).join(", ")}`,
    );
  }
  c.turns.forEach((t, i) => {
    const label = c.turns.length > 1 ? `Turn ${i + 1}` : "Trigger";
    const pending = t.usePendingFromPreviousTurn ? " _(against the previous turn's pending proposal)_" : "";
    lines.push(`- **${label}:** ${quote(t.prompt)}${pending}`);
    const own = assertions(t, TURN_SPEC_KEYS);
    if (own) lines.push(`  - **Asserted:** ${own}`);
  });
  const caseLevel = assertions(c, CASE_SPEC_KEYS);
  if (caseLevel) {
    lines.push(
      `- **Asserted${c.turns.length > 1 ? " on the final turn" : ""}:** ${caseLevel}`,
    );
  }
  lines.push(`- **Expected (the judge's rubric, verbatim from the fixture):** ${c.judgeNote}`);
  return lines.join("\n");
}

/** The whole document. */
export function renderScenarios({ cases, proposed = [], census }) {
  const recordedKnown = census.recorded !== null;
  const ungated = new Set(census.ungated);
  const head = [
    "---",
    "summary: uno-bot — regression scenarios",
    "---",
    "",
    `<!-- GENERATED from docs/evals/fixtures/uno-bot-cases.json by ${GENERATED_BY}; do not edit by hand. Add or change a case in the fixture, then run \`node ${GENERATED_BY} --write\`. -->`,
    "",
    "# uno-bot — regression scenarios",
    "",
    "<!-- The hand-written ancestor of this file was migrated 2026-07-07 from agents/uno-bot/REGRESSION.md (eval rounds 1-3); it became generated with #616. -->",
    "",
    "Every scenario the suite runs, read off the fixture that runs it. Each is one",
    "Slack conversation with a binary outcome, scored two ways: the deterministic",
    "assertions below, and an LLM judge against `docs/evals/rubrics/bot-answer.md`",
    "plus the case's own rubric. **A failing blocker is a release blocker, not a note.**",
    "",
    "A scenario whose prose you want to change is a `judgeNote` in",
    "`docs/evals/fixtures/uno-bot-cases.json`. There is no second copy here to",
    "disagree with it, which is the whole reason this file is generated: the",
    "hand-written version listed four cases that had never existed and omitted",
    "twelve that did.",
    "",
    renderCensusBlock(census, { pointer: false }),
    "",
  ];
  if (recordedKnown && ungated.size) {
    head.push(
      `> **Ungated.** ${[...ungated].join(", ")} have no recording in \`docs/evals/fixtures/recordings/\`, so the pull-request gate skips them by name and measures nothing about them. Only the Monday \`--transport=worker\` cron reaches them.`,
      "",
    );
  }
  const body = cases.map((c) =>
    renderCase(c, { recorded: recordedKnown ? !ungated.has(c.id) : null }),
  );
  const tail = [];
  if (proposed.length) {
    tail.push(
      "## Written down, and not in the fixture",
      "",
      "Scenarios kept for their reasoning. **Nothing runs these** — they are `_proposed`",
      "in the fixture, so they cannot be mistaken for cases that score.",
      "",
      proposed
        .map((p) => [`### ${p.id} — ${p.name}`, "", `_${p.status}_`, "", p.note.trim()].join("\n"))
        .join("\n\n"),
    );
  }
  return `${[head.join("\n").trimEnd(), ...body, ...(tail.length ? [tail.join("\n")] : [])].join("\n\n")}\n`;
}

// ── What the documents should say ────────────────────────────────────────────

/** Every generated document, as `{ path, content }` — nothing written yet. */
export function renderAll({ fixturePath, recordingsDir } = {}) {
  const { cases, proposed } = loadCases(...(fixturePath ? [fixturePath] : []));
  const recordings = loadRecordings(...(recordingsDir ? [recordingsDir] : []));
  const census = censusOf(cases, { recorded: [...recordings.keys()] });
  const sources = new Map();
  for (const rec of recordings.values()) sources.set(rec.source, (sources.get(rec.source) ?? 0) + 1);
  return [
    { path: SCENARIOS_PATH, content: renderScenarios({ cases, proposed, census }) },
    {
      path: EVALS_README_PATH,
      content: replaceBlock(readFileSync(EVALS_README_PATH, "utf8"), "uno-bot-cases", renderCensusBlock(census)),
    },
    {
      path: RECORDINGS_README_PATH,
      content: replaceBlock(
        readFileSync(RECORDINGS_README_PATH, "utf8"),
        "recorded",
        renderRecordedBlock(census, sources),
      ),
    },
  ];
}

/** Which generated documents are stale. */
export function staleDocs(rendered = renderAll()) {
  return rendered.filter(({ path, content }) => readFileSync(path, "utf8") !== content).map((d) => d.path);
}

function main() {
  const write = argv.includes("--write");
  const rendered = renderAll();
  const stale = staleDocs(rendered);
  if (!stale.length) {
    console.log("[eval-docs] every generated document matches the fixture");
    return;
  }
  if (!write) {
    console.error(`[eval-docs] stale:\n  - ${stale.join("\n  - ")}\nrun: node ${GENERATED_BY} --write`);
    process.exit(1);
  }
  for (const { path, content } of rendered) writeFileSync(path, content);
  console.log(`[eval-docs] wrote:\n  - ${stale.join("\n  - ")}`);
}

if (isEntry(import.meta.url)) main();
