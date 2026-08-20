// Bakes the assembled harness into the Worker bundle (src/generated/harness.ts)
// so serving the system prompt costs ZERO subrequests at runtime — the docs are
// co-located in this repo, so the baked copy updates on deploy. This SKILL_PATHS
// list is now the source of truth; the output must stay byte-identical to what
// the old runtime assembleSystem() produced (same order, dividers, ide-only
// stripping). Run: npm run bundle:harness
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url)); // agents/uno-bot/scripts
const repoRoot = path.resolve(here, "../../.."); // repo root (two levels above agents/uno-bot)

// Mirror of the current SKILL_PATHS from src/agent/skills.ts. This is the
// source of truth now.
const SKILL_PATHS = [
  "AGENTS.md", // the constitution (repo root)
  "agents/uno-bot/AGENT.md", // this embodiment's persona delta
  // Per skill: references/method.md (runtime-neutral core) then bot.md (Worker delta)
  "skills/uno-research/references/method.md",
  "skills/uno-research/bot.md",
  "skills/uno-synthesize/references/method.md",
  "skills/uno-synthesize/bot.md",
  "skills/uno-prototype/references/method.md",
  "skills/uno-prototype/bot.md",
  "skills/uno-publish/references/method.md",
  "skills/uno-publish/bot.md",
  "skills/uno-review/references/method.md",
  "skills/uno-review/bot.md",
  "skills/uno-maintain/references/method.md",
  "skills/uno-maintain/bot.md",
  "docs/conventions/terminology.md",
  "docs/conventions/notion.md",
  "docs/conventions/figma-workspace.md",
  "docs/conventions/slack.md",
  "docs/conventions/supabase.md",
  "docs/conventions/blueprint-navigation.md",
  "docs/conventions/writing-style.md",
  // The standing-automation registry: "what runs on a schedule / who owns it"
  // is a live Slack question, and the table is the only answer to it.
  "docs/conventions/automations.md",
];

// Drop `<!-- ide-only -->…<!-- /ide-only -->` regions — replicated EXACTLY from
// the old src/agent/skills.ts stripIdeOnly so the baked prompt matches.
function stripIdeOnly(text) {
  if (!text) return text;
  return text.replace(/[^\n]*<!--\s*ide-only\s*-->[\s\S]*?<!--\s*\/ide-only\s*-->[^\n]*\n?/g, "");
}

// Guard: verify the repo root is the one that actually holds the harness before
// we trust any path (checked in the task brief).
for (const sentinel of ["AGENTS.md", "docs/conventions/notion.md"]) {
  if (!existsSync(path.join(repoRoot, sentinel))) {
    console.error(`[bundle-harness] repo root check failed: ${sentinel} not found under ${repoRoot}`);
    process.exit(1);
  }
}

// Files the Worker deliberately does NOT carry. Every skill face and every
// convention must appear here or in SKILL_PATHS — see the coverage guard below.
const NOT_BUNDLED = new Set([
  "docs/conventions/coding.md", // repo code authoring; the Worker writes no code
  "docs/conventions/tech-stack.md", // dependency/version table; IDE-side
  "docs/conventions/integrations.md", // MCP server names — the Worker has no MCP
  "docs/conventions/article-writing-style.md", // 39k chars for essay-length recaps
]);

// Coverage guard: a MISSING listed file already fails below, but the reverse —
// a new skill face or convention that nobody adds to SKILL_PATHS — was silent,
// and silence here means the bot never learns a rule that exists. Every such
// file must be bundled or explicitly excluded; adding one and forgetting both
// fails the build.
const mustBeAccountedFor = [
  ...readdirSync(path.join(repoRoot, "skills"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => [`skills/${d.name}/bot.md`, `skills/${d.name}/references/method.md`]),
  ...readdirSync(path.join(repoRoot, "docs/conventions"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => `docs/conventions/${f}`),
].filter((p) => existsSync(path.join(repoRoot, p)));

const listed = new Set(SKILL_PATHS);
const unaccounted = mustBeAccountedFor.filter((p) => !listed.has(p) && !NOT_BUNDLED.has(p));
if (unaccounted.length) {
  console.error(
    `[bundle-harness] ${unaccounted.length} file(s) are neither bundled nor explicitly excluded:\n` +
      unaccounted.map((p) => `  ${p}`).join("\n") +
      "\n  -> add to SKILL_PATHS (the bot needs it) or to NOT_BUNDLED (with the reason).",
  );
  process.exit(1);
}

// Read every listed file from the LOCAL repo. Any missing file is a FAILURE —
// never silently ship a partial rulebook.
const raw = SKILL_PATHS.map((p) => {
  const abs = path.join(repoRoot, p);
  if (!existsSync(abs)) {
    console.error(`[bundle-harness] MISSING harness file: ${p} (expected at ${abs})`);
    process.exit(1);
  }
  return readFileSync(abs, "utf8");
});

// Same assembly as the old assembleSystem(): index 0 raw, every other file
// prefixed with `\n\n---\n\n<!-- ${path} -->\n\n`; empty (post-strip) files skipped.
const parts = raw.map(stripIdeOnly);
const assembled = parts
  .map((text, i) => {
    if (!text) return "";
    return i === 0 ? text : `\n\n---\n\n<!-- ${SKILL_PATHS[i]} -->\n\n${text}`;
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
const BLUEPRINT_NOUNS = "phases|scenarios|paths|steps|layers|cells|path_steps|cell_triggers";
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

const outDir = path.join(here, "..", "src", "generated");
mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "harness.ts");
const contents =
  "// GENERATED by scripts/bundle-harness.mjs — do not edit by hand. Run: npm run bundle:harness\n" +
  `export const HARNESS = ${JSON.stringify(assembled)};\n`;

// `--check`: regenerate to memory and compare against the COMMITTED artifact
// instead of writing. Every other generator in this repo has a --check
// counterpart; this one did not, so a harness doc could be edited and the baked
// copy left behind with nothing noticing until someone read the bot's answer.
if (process.argv.includes("--check")) {
  const current = existsSync(outFile) ? readFileSync(outFile, "utf8") : "";
  if (current !== contents) {
    console.error(
      `[bundle-harness] ${outFile} is STALE — a bundled harness doc changed but the generated file was not regenerated.\n` +
        `  committed: ${current.length} chars · regenerated: ${contents.length} chars\n` +
        "  -> run `npm run bundle:harness` and commit src/generated/harness.ts.",
    );
    process.exit(1);
  }
  console.log(`[bundle-harness] --check OK (${assembled.length} chars from ${SKILL_PATHS.length} files)`);
  process.exit(0);
}

writeFileSync(outFile, contents, "utf8");

console.log(`[bundle-harness] wrote ${outFile} (${assembled.length} chars from ${SKILL_PATHS.length} files)`);
