// Bakes the assembled harness into the Worker bundle (src/generated/harness.ts)
// so serving the system prompt costs ZERO subrequests at runtime — the docs are
// co-located in this repo, so the baked copy updates on deploy.
//
// MEMBERSHIP IS A PROPERTY OF THE DOCUMENT. Each doc declares
// `embodiment: all | ide | uno-bot` in its own frontmatter and this script globs
// for it; there is no list of files here to disagree with reality (#159).
//
// ORDER IS A BUNDLE-LEVEL FACT no single document can know, so it is declared
// once, in SECTIONS below, and nowhere else. Within a section, members sort by
// path — except a skill's `method.md`, which precedes its `bot.md` by rule.
// A per-doc sort weight was rejected: it spreads one global decision across
// twenty files and turns a missing weight into a silent misplacement.
//
// ── The byte-identical requirement is RETIRED (#159) ─────────────────────────
//
// This script used to state: "the output must stay byte-identical to what the
// old runtime assembleSystem() produced (same order, dividers, ide-only
// stripping)." That requirement is retired here deliberately, not lapsed.
//
// Why it could not be met: order changed. Membership is now a glob, so members
// sort by path within their section. The old hand-list ran the skills in
// workflow order (research → synthesize → prototype → publish → review →
// maintain); they now run alphabetically. Preserving the old order would have
// meant naming the six skills somewhere, which is the hand-maintained list this
// ticket exists to delete.
//
// Why retiring it is safe: measured at the cut, every file body is
// byte-identical and the member set is unchanged — 22 files, 167,556 chars
// before and after. Only sequence moved. The sections a reader depends on
// (constitution first, persona second) are unchanged, and no rule's meaning
// depends on which skill precedes another.
//
// What it costs: one prompt-cache miss on the first deploy after this change,
// because the system prompt is the cached prefix.
//
// What replaces it as the guard: `--check` compares against the committed
// artifact, so a doc edited without regenerating still fails. That check is
// about THIS script's output, which exists — assembleSystem() does not. It was
// deleted; src/agent/skills.ts now just serves the baked constant. A requirement
// to match a function that no longer exists cannot fail, and a guard that
// cannot fail is the failure mode this whole effort is about.
//
// ── The readable companion (#160) ────────────────────────────────────────────
//
// harness.ts is the prompt the Worker receives and the one harness artifact
// nobody can read: it is a single JSON-escaped string, so a bundle change lands
// in review as an unreadable blob. `agents/uno-bot/harness-bundle.md` is the
// same assembly written out for humans — a manifest (load order, path, chars,
// running total, budget) followed by the assembled prompt as markdown. A bundle
// change now diffs as prose.
//
// It is generated HERE rather than by a second script on purpose: order,
// membership, stripping and the budgets are decided in this file, and a
// companion that re-derived them could disagree with the prompt it claims to
// show. Both artifacts are written from the same in-memory assembly, and
// `--check` holds BOTH to the same staleness guard — editing a bundled doc
// without regenerating fails and names whichever artifact is behind.
//
// Run: npm run bundle:harness
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url)); // agents/uno-bot/scripts
const repoRoot = path.resolve(here, "../../.."); // repo root (two levels above agents/uno-bot)

/**
 * The bundle's sections, in order. This list is the ONLY place order is stated.
 * Each section names roots to scan — never an individual file — and takes every
 * doc under them whose frontmatter says `embodiment: uno-bot` or `all`.
 */
const SECTIONS = [
  { name: "constitution", roots: ["AGENTS.md", "CONTEXT.md"] },
  { name: "persona", roots: ["agents/uno-bot/AGENT.md"] },
  { name: "skills", roots: ["skills"] },
  { name: "connectors", roots: ["docs/connectors"] },
  { name: "engineering", roots: ["docs/engineering"] },
  { name: "conventions", roots: ["docs/conventions"] },
];

/**
 * Char budgets, in chars because these files have paragraph-length lines. The
 * contract they enforce is stated in `AGENTS.md` § The loading contract; this is
 * the assertion of it, so an edit that blows a budget fails the build instead of
 * being noticed months later by whoever re-measures.
 *
 * MEASURED ON THE BUNDLED BODY, not the file: frontmatter is stripped before
 * assembly, so it costs the prompt nothing, and charging a doc ~100 chars for
 * declaring where it belongs would tax the very thing #159 made mandatory.
 * An `ide-only` region still counts against a per-file budget — no budgeted file
 * carries one today, and a persona or face that grew one would be worth seeing.
 *
 * Budgets attach to a doc's ROLE — the persona, a Worker face — never to a path,
 * so renaming a skill cannot silently drop its budget.
 */
const BUDGETS = {
  // Headroom over today's ~163k, sized to absorb ordinary authoring and to fail
  // on a whole doc arriving unnoticed. Raise it deliberately, in a PR that says
  // what the prompt bought for the chars.
  assembled: 170_000,
  persona: 28_000,
  botFace: 7_000,
};

/** The budget a member is held to, or null when its role carries none. */
function budgetFor({ rel, section }) {
  if (section === "persona") return { limit: BUDGETS.persona, role: "persona" };
  if (rel.endsWith("/bot.md")) return { limit: BUDGETS.botFace, role: "Worker face" };
  return null;
}

const n = (x) => x.toLocaleString("en-US");

/** Frontmatter is metadata for this script, not content for the model. */
function splitFrontmatter(text) {
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const close = text.indexOf("\n---", 4);
  if (close === -1) return { meta: {}, body: text };
  const meta = {};
  for (const line of text.slice(4, close).split("\n")) {
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body: text.slice(close + 4).replace(/^\n+/, "") };
}

/** Every .md under a root, or the root itself when it is a file. */
function walk(rel) {
  const abs = path.join(repoRoot, rel);
  if (!existsSync(abs)) return [];
  const stat = statSync(abs);
  if (stat.isFile()) return rel.endsWith(".md") ? [rel] : [];
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    out.push(...walk(path.posix.join(rel, entry.name)));
  }
  return out;
}

/**
 * Sort key. Paths sort lexically, except that a skill's shared procedure loads
 * before its Worker delta — the one ordering rule a document does own, because
 * `method.md` is meaningless read second.
 */
function sortKey(rel) {
  const skill = rel.match(/^skills\/([^/]+)\//);
  if (!skill) return rel;
  const face = rel.endsWith("/references/method.md") ? "0" : "1";
  // `rel` is appended so two docs in the same skill and face can never tie —
  // a tie would leave their order up to the sort's stability, which is a
  // silent way for the prompt to differ between runs.
  return `skills/${skill[1]}/${face}/${rel}`;
}

// Drop `<!-- ide-only -->…<!-- /ide-only -->` regions — replicated EXACTLY from
// the old src/agent/skills.ts stripIdeOnly so the baked prompt matches.
function stripIdeOnly(text) {
  if (!text) return text;
  return text.replace(/[^\n]*<!--\s*ide-only\s*-->[\s\S]*?<!--\s*\/ide-only\s*-->[^\n]*\n?/g, "");
}

// Guard: verify the repo root is the one that actually holds the harness before
// we trust any path (checked in the task brief).
// Structural sentinels only — naming a member file here would make the repo
// check die confusingly the day that file is renamed, and would put a filename
// back in the one script that is supposed to hold none.
for (const sentinel of ["AGENTS.md", "CONTEXT.md", "skills"]) {
  if (!existsSync(path.join(repoRoot, sentinel))) {
    console.error(`[bundle-harness] repo root check failed: ${sentinel} not found under ${repoRoot}`);
    process.exit(1);
  }
}

// ── Output paths, and the committed bytes, read up front ─────────────────────
//
// The two artifacts this script owns. `harness.ts` is what the Worker imports;
// `harness-bundle.md` is the readable companion (#160). Both are derived from
// one assembly below, so they cannot drift from each other.
const outDir = path.join(here, "..", "src", "generated");
const outFile = path.join(outDir, "harness.ts");
const companionFile = path.join(here, "..", "harness-bundle.md");

const CHECK = process.argv.includes("--check");

// Snapshot the COMMITTED bytes before a single char is assembled. A staleness
// guard that generates first and compares against what it just wrote cannot
// fail; reading the working tree up front — and never writing under `--check`
// (this script's only writes are the two calls at the very bottom, both
// unreachable in check mode) — is what makes the guard able to say no.
const committed = CHECK
  ? {
      [outFile]: existsSync(outFile) ? readFileSync(outFile, "utf8") : "",
      [companionFile]: existsSync(companionFile) ? readFileSync(companionFile, "utf8") : "",
    }
  : null;

// ── Membership, derived ──────────────────────────────────────────────────────
//
// Every doc under a section root must DECLARE where it belongs. A doc with no
// `embodiment` fails the build: silence used to mean "not bundled", so a new
// convention nobody listed was a rule the bot never learned, and nothing said so.
const members = [];
const undeclared = [];
// The docs under these same roots that declare `embodiment: ide` — everything
// the walk SAW and did not bundle. Not used to assemble anything; counted, and
// reported below. See the census note after the guards.
const ideOnly = [];

for (const section of SECTIONS) {
  const found = [];
  for (const root of section.roots) {
    for (const rel of walk(root)) {
      const { meta } = splitFrontmatter(readFileSync(path.join(repoRoot, rel), "utf8"));
      if (!meta.embodiment) {
        undeclared.push(rel);
        continue;
      }
      if (meta.embodiment === "uno-bot" || meta.embodiment === "all") found.push(rel);
      else if (meta.embodiment === "ide") ideOnly.push(rel);
    }
  }
  found.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  members.push(...found.map((rel) => ({ rel, section: section.name })));
}

if (undeclared.length) {
  console.error(
    `[bundle-harness] ${undeclared.length} doc(s) under a bundle section declare no \`embodiment\`:\n` +
      undeclared.map((p) => `  ${p}`).join("\n") +
      "\n  -> add `embodiment: all | ide | uno-bot` to the frontmatter. There is no default:" +
      "\n     a doc that does not say where it belongs is a rule nobody can find.",
  );
  process.exit(1);
}

if (!members.length) {
  console.error("[bundle-harness] no members matched — the glob is broken, refusing to ship an empty prompt.");
  process.exit(1);
}

// ── The embodiment census (#174) ─────────────────────────────────────────────
//
// One line stating what this walk saw: every doc under the section roots, split
// into the ones bundled and the ones marked `ide`. It changes no artifact — it
// is stdout only — and the bundle does not need it.
//
// IT EXISTS FOR A READER OUTSIDE THIS SCRIPT. `check:negation` now ratchets the
// IDE-side docs as well as the bundled ones, and the IDE corpus is exactly the
// complement measured here: same roots, same frontmatter, the other answer. A
// guard that re-walked those roots on its own would be a second glob that can
// disagree with this one — the failure #159 deleted — so it walks them and then
// checks itself against this line. The `--check OK` file count already plays
// that role for the bundled half (#234); this is the same witness for the other
// half, and for the total, so a root silently dropped from either list fails
// instead of narrowing a corpus in silence.
console.log(
  `[bundle-harness] embodiment census: ${n(members.length + ideOnly.length)} declared doc(s) under the ` +
    `section roots — ${n(members.length)} bundled, ${n(ideOnly.length)} ide-only`,
);

// Read every member from the LOCAL repo. Frontmatter is stripped: it addresses
// this script, not the model, and paying prompt chars for it would be a tax on
// having made membership declarative.
const raw = members.map(({ rel }) => {
  const abs = path.join(repoRoot, rel);
  // Normalise endings at the read boundary. Line endings are a checkout
  // artifact — no .gitattributes here and core.autocrlf defaults on for
  // Windows — so bundling on Windows baked ~1,500 stray CRs into the prompt
  // and dirtied this generated file on every run. Semantically inert to a
  // model, but it makes the baked bytes depend on WHO deployed, and the
  // system prompt is the cached prefix.
  const text = readFileSync(abs, "utf8").replace(/\r\n/g, "\n");
  return splitFrontmatter(text).body;
});

// ── Char budgets, per file ───────────────────────────────────────────────────
const overBudget = [];
raw.forEach((body, i) => {
  const budget = budgetFor(members[i]);
  if (budget && body.length > budget.limit) {
    overBudget.push({ rel: members[i].rel, ...budget, size: body.length });
  }
});

if (overBudget.length) {
  console.error(
    `[bundle-harness] ${overBudget.length} file(s) over its char budget:\n` +
      overBudget
        .map(
          ({ rel, role, size, limit }) =>
            `  ${rel} (${role}): ${n(size)} chars against a budget of ${n(limit)} — over by ${n(size - limit)}`,
        )
        .join("\n") +
      "\n  -> every char here ships in the system prompt on every request. Cut restatement first:" +
      "\n     a rule that is stated elsewhere in the bundle should be cited, not quoted.",
  );
  process.exit(1);
}

// Assembly: first member raw, every other prefixed with a path comment so the
// bundle stays traceable back to a file; empty (post-strip) members skipped.
const parts = raw.map(stripIdeOnly);
const assembled = parts
  .map((text, i) => {
    if (!text) return "";
    return i === 0 ? text : `\n\n---\n\n<!-- ${members[i].rel} -->\n\n${text}`;
  })
  .join("");

// stripIdeOnly needs a MATCHED pair — an unbalanced or misspelled marker simply
// doesn't match, and the IDE-only block ships into the system prompt silently.
// Fail the build instead: a surviving marker proves something didn't strip.
if (/<!--\s*\/?\s*ide-only\s*-->/i.test(assembled)) {
  console.error(
    "[bundle-harness] an <!-- ide-only --> marker survived assembly — unbalanced or misspelled pair. " +
      "IDE-only content would ship in the bot prompt. Fix the markers and re-run.",
  );
  process.exit(1);
}

// ── Char budget, assembled ───────────────────────────────────────────────────
if (assembled.length > BUDGETS.assembled) {
  console.error(
    `[bundle-harness] the assembled bundle is over its char budget: ${n(assembled.length)} chars ` +
      `against a budget of ${n(BUDGETS.assembled)} — over by ${n(assembled.length - BUDGETS.assembled)} ` +
      `(${members.length} files).\n` +
      "  -> the whole bundle is the prompt's cached prefix, paid on every request. Cut, or raise the" +
      "\n     budget deliberately in a PR that says what the prompt bought for the chars.",
  );
  process.exit(1);
}

// ── Blueprint instance-data drift guard ──────────────────────────────────────
//
// WHAT IT CATCHES: counts and membership lists about the blueprint's CONTENTS
// baked into the harness. The blueprint changes daily; this bundle updates on
// deploy. "There are 5 phases" was committed, bundled and shipping while there
// were six (terminology.md, live find 2026-08-17), and the bot's answer was
// wrong for as long as nobody re-read the file.
//
// The invariant: instance VOCABULARY is a contract (layer names, the
// `Planned:` / `Prototype:` markers — those stay); instance INVENTORY is a bug (counts,
// membership lists — those must be retrieved, per ADR-013 §6 "cache the
// foundation, retrieve the rest").
//
// WHY IT RUNS ON `assembled`, NOT THE SOURCE FILES: `ide-only` regions are
// stripped by then, which removes the SQL query recipes for free — so the
// obvious false-positive source (`limit 5`, `union all select`) never reaches
// the regex. That is also why this sits AFTER the surviving-marker check above:
// if stripping didn't happen, the build has already failed.
//
// There is no PR CI in this repo — every workflow is `schedule` or
// `workflow_dispatch` — so `npm run deploy` is the only real gate, which is why
// the guard lives here rather than in a lint step nobody runs.

// Nouns that make a nearby digit an inventory claim rather than a quantity.
const BLUEPRINT_NOUNS = "phases|scenarios|paths|steps|layers|cells|path_steps|cell_dependencies";
// Explicit, per-line/block opt-out. REQUIRED rather than optional: the nav
// guide deliberately keeps a historical rot ledger, and a guard with no escape
// would either delete real content or be switched off wholesale.
const INSTANCE_DATA_OK = /<!--\s*instance-data-ok:\s*.+?-->/i;
// See the spelled-count pattern below — measured at 100% false positives.
const SPELLED_COUNTS_ENABLED = false;

const INSTANCE_DATA_PATTERNS = [
  // "6 phases", "737 cells", "23 scenarios"
  { name: "count-before-noun", re: new RegExp(String.raw`\b\d[\d,]*\s+(?:${BLUEPRINT_NOUNS})\b`, "i") },
  // "phases: 6", "cells = 737", "scenarios (23)"
  { name: "noun-before-count", re: new RegExp(String.raw`\b(?:${BLUEPRINT_NOUNS})\b\s*[:=(]\s*\d`, "i") },
  // the markdown-table form: | `cells` | 737 |
  { name: "table-row", re: new RegExp(String.raw`\|\s*\x60?(?:${BLUEPRINT_NOUNS})\x60?\s*\|\s*\d`, "i") },
  // "there are 6 …" — an enumeration claim even when the noun drifts
  { name: "there-are-n", re: /\bthere are \d+\b/i },
  // SPELLED-OUT counts — MEASURED AND DISABLED, kept because the measurement is
  // the useful part.
  //
  // It was added because the digit patterns are blind to the very find that
  // motivated this guard: terminology.md enumerated the phases as a closed list
  // of "five" when there were six — committed, bundled, shipping. But run
  // against the real bundle it scored 4 hits and 4 FALSE POSITIVES ("Three
  // paths" = retrieval paths, "two steps" = a procedure, "Three scenarios" = a
  // heading, "three cells" = prose), while every digit pattern scored zero.
  // English does not distinguish an inventory claim from a quantity, and at
  // 100% FP this pattern would train people to ignore the guard.
  //
  // Flip to true only alongside a way to tell the two apart (e.g. requiring the
  // word "blueprint" in the same sentence).
  ...(SPELLED_COUNTS_ENABLED
    ? [
        {
          name: "spelled-count-before-noun",
          re: new RegExp(
            String.raw`\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:${BLUEPRINT_NOUNS})\b`,
            "i",
          ),
        },
      ]
    : []),
];

function findInstanceData(text) {
  // Dates are the dominant false positive ("2026-08-08", "verified 2026").
  // Blanked, not deleted, so line numbers stay usable in the report.
  const dateless = text
    .replace(/\d{4}-\d{2}-\d{2}/g, "<date>")
    .replace(/\b20\d\d\b/g, "<year>");
  const lines = dateless.split("\n");

  // The escape applies to the containing line AND the contiguous non-blank
  // block it sits in — a markdown table carries one marker, not one per row.
  const exempt = new Set();
  lines.forEach((line, i) => {
    if (!INSTANCE_DATA_OK.test(line)) return;
    for (let j = i; j >= 0 && lines[j].trim(); j--) exempt.add(j);
    for (let j = i; j < lines.length && lines[j].trim(); j++) exempt.add(j);
    exempt.add(i);
  });

  const hits = [];
  lines.forEach((line, i) => {
    if (exempt.has(i)) return;
    for (const { name, re } of INSTANCE_DATA_PATTERNS) {
      const m = re.exec(line);
      if (m) {
        hits.push({ line: i + 1, pattern: name, match: m[0], text: line.trim().slice(0, 160) });
        break; // one finding per line — the remediation is the same either way
      }
    }
  });
  return hits;
}

// ── LOG-ONLY FOR NOW ─────────────────────────────────────────────────────────
// The false-positive rate is ESTIMATED, not measured, and this guard sits on
// the one gate that can block a deploy. Run it in warn mode for a cycle, read
// the findings, then flip THIS ONE LINE to true to make it blocking.
const INSTANCE_DATA_GUARD_BLOCKING = false;

const instanceDataHits = findInstanceData(assembled);
if (instanceDataHits.length) {
  const report =
    `[bundle-harness] ${instanceDataHits.length} possible blueprint INSTANCE DATA hit(s) in the assembled harness:\n` +
    instanceDataHits
      .map((h) => `  assembled:${h.line}  (${h.pattern}: "${h.match}")\n    ${h.text}`)
      .join("\n") +
    "\n  -> Counts and membership lists about the blueprint's CONTENTS go stale between deploys and" +
    "\n     ship as confident wrong answers. Delete the number and let search_blueprint retrieve it," +
    "\n     or, if the figure is deliberate (a historical ledger, a fixed contract), mark the line/block:" +
    "\n       <!-- instance-data-ok: why this number is allowed to be frozen -->";
  if (INSTANCE_DATA_GUARD_BLOCKING) {
    console.error(report);
    process.exit(1);
  }
  console.warn(`${report}\n  (log-only: set INSTANCE_DATA_GUARD_BLOCKING = true in this script to make it blocking)`);
}

const contents =
  "// GENERATED by scripts/bundle-harness.mjs — do not edit by hand. Run: npm run bundle:harness\n" +
  `export const HARNESS = ${JSON.stringify(assembled)};\n`;

// ── The companion, rendered from the same assembly ───────────────────────────
//
// Two halves, in this order because a reviewer asks "what moved?" before "what
// does it now say?":
//   1. the manifest — load order, path, chars, running total, budget;
//   2. the assembled prompt, verbatim, exactly the string baked into harness.ts.
//
// `Chars` is what SHIPS (post `ide-only` strip). `Running total` is the length
// of the assembled prompt through that member, so it carries the divider each
// member after the first contributes and the last row equals the whole prompt.
// The two columns therefore differ by the dividers, which is the point: the
// budget column is measured on the body, the running total on the prompt.
function renderCompanion() {
  let running = 0;
  const rows = parts.map((body, i) => {
    const { rel, section } = members[i];
    const piece = body ? (i === 0 ? body : `\n\n---\n\n<!-- ${rel} -->\n\n${body}`) : "";
    running += piece.length;
    const budget = budgetFor(members[i]);
    // Budgets are asserted on the pre-strip body, so an `ide-only` region still
    // counts — the manifest marks the same rows the assertion would.
    const over = budget && raw[i].length > budget.limit ? raw[i].length - budget.limit : 0;
    const stripped = raw[i].length - body.length;
    return {
      order: i + 1,
      section,
      rel,
      chars: body.length ? `${n(body.length)}${stripped ? ` (−${n(stripped)} ide-only)` : ""}` : "empty after strip",
      running: n(running),
      budget: budget ? `${n(budget.limit)} (${budget.role})${over ? ` ⚠️ **over by ${n(over)}**` : ""}` : "—",
    };
  });

  const totalOver = assembled.length - BUDGETS.assembled;
  return (
    "---\n" +
    "summary: Generated readable companion to the baked Worker prompt — the load-order manifest plus the assembled harness as markdown.\n" +
    "---\n\n" +
    "<!-- GENERATED by scripts/bundle-harness.mjs — do not edit by hand. Run: npm run bundle:harness -->\n\n" +
    "# uno-bot harness bundle — generated, do not edit\n\n" +
    "**Nothing here is a source.** This file is written by `agents/uno-bot/scripts/bundle-harness.mjs`\n" +
    "from the docs listed in the manifest, and it is the readable twin of\n" +
    "`agents/uno-bot/src/generated/harness.ts` — the same assembly, which that file can only hold as\n" +
    "one escaped string. To change what the bot is told, edit the doc, then run\n" +
    "`npm run bundle:harness`. An edit made here is erased by the next run, and\n" +
    "`npm run check:harness-bundle` fails while this file is behind its sources.\n\n" +
    "## Manifest\n\n" +
    `Load order is a bundle-level fact, declared once in the bundler's \`SECTIONS\` list. ` +
    `**${n(assembled.length)} chars from ${n(members.length)} files**, against an assembled budget of ` +
    `${n(BUDGETS.assembled)}` +
    (totalOver > 0 ? ` — ⚠️ **over by ${n(totalOver)}**.` : ` (${n(-totalOver)} to spare).`) +
    "\n\n" +
    "| # | Section | Doc | Chars | Running total | Budget |\n" +
    "|--:|---------|-----|------:|--------------:|--------|\n" +
    rows
      .map(
        (r) =>
          `| ${r.order} | ${r.section} | [\`${r.rel}\`](../../${r.rel}) | ${r.chars} | ${r.running} | ${r.budget} |`,
      )
      .join("\n") +
    "\n\n" +
    "`Chars` is the body as it ships, after `<!-- ide-only -->` regions are dropped; the strip is shown\n" +
    "where it happened. Per-file budgets are asserted on the body BEFORE that strip, so an IDE-only\n" +
    "region still costs a budgeted doc. `Running total` is the assembled prompt's length through that\n" +
    "row, so it also carries the `---` divider and path comment every member after the first adds —\n" +
    "which is why the last running total exceeds the sum of the chars column. A row marked over budget\n" +
    "cannot normally appear: the bundler refuses to write either artifact once a budget is blown, so\n" +
    "the marker is what a relaxed or raised budget would have to explain.\n\n" +
    "## The assembled prompt\n\n" +
    "Verbatim from here to the end of the file — this is the string baked into\n" +
    "`agents/uno-bot/src/generated/harness.ts` and handed to the model as Block 0 of every request.\n\n" +
    "---\n\n" +
    assembled +
    "\n"
  );
}

const companion = renderCompanion();

// `--check`: compare what this run WOULD write against the committed bytes
// snapshotted at the top of this file — before assembly, so the comparison can
// never be against something this run produced — and write nothing. Every other
// generator in this repo has a --check counterpart; this one did not, so a
// harness doc could be edited and the baked copy left behind with nothing
// noticing until someone read the bot's answer.
if (CHECK) {
  // Compare on normalised endings. The HARNESS string itself is JSON-escaped,
  // so the only real newlines in that file are the two wrapper ones — and on a
  // Windows checkout those arrive as CRLF while `contents` is built with "\n".
  // That 2-char difference reported the harness as STALE on every Windows run,
  // which is a guard crying wolf rather than a guard. The companion is real
  // markdown and gets the same treatment for the same reason.
  const norm = (t) => t.replace(/\r\n/g, "\n");
  // BOTH artifacts, one guard: the companion is not decoration a reviewer can
  // let rot. Every artifact this script owns is compared, so a doc edited
  // without regenerating fails on whichever of the two is behind — and the
  // message names it.
  const stale = [
    { file: outFile, expected: contents, hint: "src/generated/harness.ts" },
    { file: companionFile, expected: companion, hint: "harness-bundle.md" },
  ].filter(({ file, expected }) => norm(committed[file]) !== norm(expected));

  if (stale.length) {
    console.error(
      `[bundle-harness] ${stale.length} generated artifact(s) STALE — a bundled harness doc changed but the generated file was not regenerated:\n` +
        stale
          .map(
            ({ file, expected }) =>
              `  ${file}\n    committed: ${n(committed[file].length)} chars · regenerated: ${n(expected.length)} chars`,
          )
          .join("\n") +
        "\n  -> run `npm run bundle:harness` and commit " +
        stale.map(({ hint }) => hint).join(" + ") +
        ".",
    );
    process.exit(1);
  }
  console.log(
    `[bundle-harness] --check OK (${assembled.length} chars from ${members.length} files; ` +
      `harness.ts + harness-bundle.md both current)`,
  );
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, contents, "utf8");
writeFileSync(companionFile, companion, "utf8");

console.log(`[bundle-harness] wrote ${outFile} (${assembled.length} chars from ${members.length} files)`);
console.log(`[bundle-harness] wrote ${companionFile} (manifest + assembled prompt, ${n(companion.length)} chars)`);
