// Bakes the assembled harness into the Worker bundle (src/generated/harness.ts)
// so serving the system prompt costs ZERO subrequests at runtime — the docs are
// co-located in this repo, so the baked copy updates on deploy.
//
// MEMBERSHIP IS A PROPERTY OF THE DOCUMENT. Each doc declares
// `embodiment: all | ide | uno-bot` in its own frontmatter and this script globs
// for it; there is no list of files here to disagree with reality (#159).
//
// SO IS DELIVERY (#423). A Worker-read doc may add `disclosure: reference` to
// its frontmatter. It then leaves the prompt and enters a second artifact from
// the SAME assembly — `src/generated/references.ts`, a name → text map the
// `read_reference` tool serves at zero subrequests — so the Worker reaches it
// only on the turns whose pointer fires. The key is `disclosure` because that
// is the glossary word (CONTEXT.md: *disclosed* — reference pushed out of the
// always-loaded tier behind a pointer), and its one value is `reference`, the
// ladder rung it names. Absent means loaded: the default is the prompt, and a
// doc has to say so to leave it. `embodiment` still decides WHO reads a doc;
// `disclosure` decides HOW the Worker gets it, so it is only legal on a doc the
// Worker reads (`all` or `uno-bot`) — on an `ide` doc it names a delivery for
// a reader that does not exist, and the build fails rather than bake a map
// entry nobody can reach.
//
// A reference is NAMED by its path with the shape words removed — `skills/` and
// `references/` carry no meaning to the model — so `skills/uno-maintain/
// references/method.md` is `uno-maintain/method`: the skill's own name leads,
// which is the word the face's pointer fires on. A doc outside `skills/` keeps
// its path sans `.md`.
//
// ORDER IS A BUNDLE-LEVEL FACT no single document can know, so it is declared
// once, in SECTIONS below, and nowhere else. Within a section, members sort by
// path — except a skill's `method.md`, which precedes its `bot.md` by rule.
// A per-doc sort weight was rejected: it spreads one global decision across
// twenty files and turns a missing weight into a silent misplacement.
//
// ── ONE FUNCTION, TWO CALLERS ────────────────────────────────────────────────
//
// `assemble({ repoRoot })` reads the tree and returns what it computed: the
// members, the sections, the disclosed docs, the census, the three artifacts as
// strings, the committed bytes they are compared against, the manifest, and the
// findings. It writes nothing, prints nothing and exits nothing, which is what
// lets two callers share it — the CLI at the bottom of this file, which keeps
// every flag and message it has always had, and
// `agents/uno-bot/scripts/check-harness-bundle.mjs`, which returns the same
// defects as findings so the harness runner can call the staleness guard
// in-process instead of reading an exit code.
//
// A DEFECT ABORTS THE ASSEMBLY at the same point the old `process.exit(1)`
// stood, and the finding is returned rather than printed. That is deliberate:
// once a doc under a section root declares no embodiment, or a budget is blown,
// everything downstream is a measurement of a tree that must not ship, and
// collecting further findings over it would report consequences as causes.
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

// Frontmatter is metadata for this script, not content for the model — and
// where it STOPS decides both the char budgets below and `check:negation`'s
// bundled count (#238), so the split lives in one shared module rather than
// once here and once in each guard that has to agree with it.
import { frontmatter } from "../../../scripts/lib/corpus.mjs";
import { isEntry } from "../../../scripts/lib/findings.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)); // agents/uno-bot/scripts
/** The repo root this package sits in, for a caller that names none. */
export const REPO_ROOT = path.resolve(here, "../../.."); // two levels above agents/uno-bot

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
  // Headroom over today's ~170k, sized to absorb ordinary authoring and to fail
  // on a whole doc arriving unnoticed. Raise it deliberately, in a PR that says
  // what the prompt bought for the chars.
  //
  // RAISED 170k -> 175k (#616). The deep-module batch #592-#625 spent the old
  // ceiling's whole headroom on vocabulary: nine modules landed and five of them
  // added the CONTEXT.md glossary row every seam in this repo carries, which is
  // what lets a later ticket name the thing instead of re-describing it. What the
  // 5k bought: the `eval case` and `unreachable` rows here, and room for the rows the
  // rest of the batch's tickets will need. The floor below is untouched, so this
  // moves the ceiling only.
  assembled: 175_000,
  persona: 28_000,
  botFace: 7_000,
  // Tier 1 — the constitution, always loaded. `AGENTS.md` § The loading contract
  // states this number in prose ("Budget ≤20k chars: a tier that bloats defeats
  // the tier"), and `check:harness-budgets` (#510) reads the manifest this script
  // writes to hold that sentence to this constant. The budget attaches to the
  // constitution's ROLE, like the persona's and the face's, so it cannot be lost
  // by a rename.
  constitution: 20_000,
  // A FLOOR beside the ceiling (#418). The assembled bundle is the cached prefix
  // of every Gemini request, and each cache Google offers has a minimum size
  // under which it caches nothing. A bundle cut below that minimum does not
  // fail: the prompt ships at full price on every iteration of every turn, and
  // the only trace is a log field nobody reads. So a cut that is too deep is a
  // cost regression that ships green, which is the failure mode this file
  // exists to stop.
  //
  // WHICH MINIMUM APPLIES FOLLOWS THE CACHE THE DEPLOYMENT USES, and that is
  // decided by `GEMINI_REGION` in wrangler.toml — read by activeFloor() below,
  // never restated here, so the bundler cannot disagree with the Worker about
  // which cache is in effect. Two cases, both real:
  //
  //   `global` (production, 2026-09-05): `cachedContents` is a regional
  //   resource, so src/gemini/cache.ts declines to create the explicit cache on
  //   every turn (`GET /debug/gemini-cache` reports the reason verbatim); the
  //   explicit cache this floor once guarded had never been created. The only
  //   caching in effect is Google's IMPLICIT cache, measured per request from
  //   `usageMetadata.cachedContentTokenCount` (`cached_in=` on the [uno-bot]
  //   log line). Its documented minimum for the Gemini 3.x Flash models is
  //   4,096 tokens (ai.google.dev/gemini-api/docs/caching, read 2026-09-05);
  //   this harness measures ~4.0 chars per token, so 16,384 chars.
  //
  //   a region (e.g. `us-central1`): the EXPLICIT cache is created — one
  //   cachedContents object, one-hour TTL — and Vertex refuses to create it
  //   under a larger minimum. PROVISIONAL VALUE: the Vertex docs reached on
  //   2026-09-04 did not state the 3.x minimum; one aggregator says 32,768
  //   tokens, so 131,072 chars. Measure it on the first deploy after the region
  //   changes: `GET /debug/gemini-cache` (auth-gated) reports cache_tokens and
  //   whether the create succeeded; replace the number and record the date.
  //
  // The manifest line names the active floor with the cache and region it
  // follows from, so a reader of harness-bundle.md sees which case is live.
  assembledFloorImplicit: 16_384,
  assembledFloorExplicit: 131_072,
  // Room kept above the floor so ordinary editing cannot brush it. Re-derive
  // beside the explicit floor once that one is measured.
  assembledFloorMargin: 4_000,
};

/** The budget a member is held to, or null when its role carries none. */
function budgetFor({ rel, section }) {
  if (section === "constitution") return { limit: BUDGETS.constitution, role: "constitution" };
  if (section === "persona") return { limit: BUDGETS.persona, role: "persona" };
  if (rel.endsWith("/bot.md")) return { limit: BUDGETS.botFace, role: "Worker face" };
  return null;
}

const n = (x) => x.toLocaleString("en-US");

/**
 * The floor in force, chosen by the cache the deployment uses. `GEMINI_REGION`
 * is read from wrangler.toml — the line the Worker deploys with — because the
 * floor is a property of that deployment, and a region stated here would be a
 * second copy of a decision the toml already holds. A toml without the line is
 * a finding: with no region there is no cache, and no floor to assert.
 *
 * @returns {{floor: object, message: null} | {floor: null, message: string}}
 */
function activeFloor(repoRoot) {
  const tomlRel = "agents/uno-bot/wrangler.toml";
  const toml = readFileSync(path.join(repoRoot, tomlRel), "utf8");
  const m = toml.match(/^GEMINI_REGION\s*=\s*"([^"]+)"/m);
  if (!m) {
    return {
      floor: null,
      message:
        `${tomlRel} has no \`GEMINI_REGION = "…"\` line, so the floor cannot be chosen: ` +
        "the floor follows the cache the deployment uses, and the region decides which cache that is.",
    };
  }
  const region = m[1];
  const implicit = region === "global";
  const value = implicit ? BUDGETS.assembledFloorImplicit : BUDGETS.assembledFloorExplicit;
  const cache = implicit ? "implicit" : "explicit";
  return {
    message: null,
    floor: {
      region,
      cache,
      value,
      margin: BUDGETS.assembledFloorMargin,
      // One wording for the manifest and the failure message:
      // "16,384 + 4,000 (implicit cache, GEMINI_REGION global)".
      label: `${n(value)} + ${n(BUDGETS.assembledFloorMargin)} (${cache} cache, GEMINI_REGION ${region})`,
    },
  };
}

/** Every .md under a root, or the root itself when it is a file. */
function walk(repoRoot, rel) {
  const abs = path.join(repoRoot, rel);
  if (!existsSync(abs)) return [];
  const stat = statSync(abs);
  if (stat.isFile()) return rel.endsWith(".md") ? [rel] : [];
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    out.push(...walk(repoRoot, path.posix.join(rel, entry.name)));
  }
  return out;
}

/**
 * Sort key. Paths sort lexically, except that a skill's shared procedure loads
 * before its Worker face — the one ordering rule a document does own, because
 * `method.md` is meaningless read second. A disclosed method never reaches this
 * sort: it is in the map, not the prompt, and the face points at it.
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

/** The name read_reference knows a disclosed doc by. Stated once; see the header. */
function referenceName(rel) {
  return rel.replace(/\.md$/, "").replace(/^skills\//, "").replace(/\/references\//, "/");
}

// Drop `<!-- ide-only -->…<!-- /ide-only -->` regions — replicated EXACTLY from
// the old src/agent/skills.ts stripIdeOnly so the baked prompt matches.
function stripIdeOnly(text) {
  if (!text) return text;
  return text.replace(/[^\n]*<!--\s*ide-only\s*-->[\s\S]*?<!--\s*\/ide-only\s*-->[^\n]*\n?/g, "");
}

// ── The artifacts this script owns ───────────────────────────────────────────
//
// `harness.ts` is what the Worker imports; `harness-bundle.md` is the readable
// companion (#160); `references.ts` is the reference map (#423), the disclosed
// docs keyed by the name `read_reference` takes. All three are derived from one
// assembly, so they cannot drift from each other, and all three are held to one
// staleness guard.
//
// Named repo-relative because both callers want them that way: a finding says
// `file`, and the CLI joins the root back on for the sentence a human reads.
const HARNESS_TS = "agents/uno-bot/src/generated/harness.ts";
const COMPANION_MD = "agents/uno-bot/harness-bundle.md";
const REFERENCES_TS = "agents/uno-bot/src/generated/references.ts";

/** The three outputs, in the order a staleness report names them. */
export const ARTIFACTS = [
  { rel: HARNESS_TS, hint: "src/generated/harness.ts" },
  { rel: COMPANION_MD, hint: "harness-bundle.md" },
  { rel: REFERENCES_TS, hint: "src/generated/references.ts" },
];

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
// the regex. That is also why this sits AFTER the surviving-marker check below:
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
function renderCompanion({ members, raw, parts, assembled, disclosed, referenceMap, floor, floorLine }) {
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
  const aboveFloor = assembled.length - floorLine;
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
    (totalOver > 0 ? ` — ⚠️ **over by ${n(totalOver)}**` : ` (${n(-totalOver)} to spare)`) +
    `, and a floor of ${floor.label}` +
    (aboveFloor < 0 ? ` — ⚠️ **short by ${n(-aboveFloor)}**.` : `, ${n(aboveFloor)} above it.`) +
    " The floor is the minimum the cache in force will hold — Google's implicit cache on the `global`" +
    " endpoint, the explicit `cachedContents` cache on a regional one — chosen by `GEMINI_REGION` in" +
    " `agents/uno-bot/wrangler.toml`; a bundle cut under it ships uncached." +
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
    "## Disclosed references\n\n" +
    (disclosed.length
      ? `These docs declare \`disclosure: reference\` and ship in \`agents/uno-bot/src/generated/references.ts\` ` +
        "— the map the `read_reference` tool serves — instead of the prompt. They cost the prompt nothing " +
        `and load only on the turns whose pointer fires. **${n(disclosed.length)} reference(s), ` +
        `${n(Object.values(referenceMap).reduce((t, x) => t + x.length, 0))} chars.**\n\n` +
        "| Name | Doc | Chars |\n" +
        "|------|-----|------:|\n" +
        disclosed
          .map(({ rel, name }) => `| \`${name}\` | [\`${rel}\`](../../${rel}) | ${n(referenceMap[name].length)} |`)
          .join("\n") +
        "\n\n"
      : "None. A Worker-read doc joins this table by declaring `disclosure: reference`.\n\n") +
    "## The assembled prompt\n\n" +
    "Verbatim from here to the end of the prompt — this is the string baked into\n" +
    "`agents/uno-bot/src/generated/harness.ts` and handed to the model as Block 0 of every request.\n" +
    (disclosed.length
      ? "The disclosed references follow it, each under its `<!-- reference: name -->` marker, verbatim\n" +
        "as baked into `references.ts`, so a sweep over this file from the prompt marker down reads\n" +
        "everything the bot can be told.\n\n"
      : "\n") +
    "---\n\n" +
    assembled +
    "\n" +
    disclosed
      .map(({ name }) => `\n\n---\n\n<!-- reference: ${name} -->\n\n${referenceMap[name]}\n`)
      .join("")
  );
}

// ── The manifest (#510) ──────────────────────────────────────────────────────
//
// A BUILD artifact, not a committed one. Everything in it is already computed
// by the assembly — members and their embodiment, the section they load in, the
// chars each contributes, the budgets, the census — and until it existed the
// only way for a root guard to have any of it was to parse the sentences the
// CLI prints. Three guards did (`scripts/lib/bundled-set.mjs`, and through it
// `check:negation` and `check:skill-overlap`), which made the wording of a log
// line load-bearing: reword the census and a guard silently narrows its corpus
// to nothing, which is the failure #234 built a witness against rather than
// removed. A datum has no wording to break.
//
// THE STDOUT SENTENCES ARE UNCHANGED. They are for a human watching a build and
// stay exactly as they were; the manifest is for a reader that parses.
//
// It is written under `--check` too, and that is not a violation of the "writes
// nothing" contract: that contract is about the three COMMITTED artifacts a
// stale-bundle guard compares, and the manifest is neither committed nor
// compared — it is gitignored build output, and a guard that asks this script
// `--check` is exactly the caller that needs it.
//
// One row per DECLARED doc — the three answers the walk can give, under one
// `delivery` key, so a reader asking "who does the Worker read" filters rather
// than parses. `chars` is the body the budgets are asserted on (pre-strip, the
// same number the companion's budget column uses); `shippedChars` is what
// reaches the prompt or the reference map after `<!-- ide-only -->` regions go.
// An ide-only doc has no shipped length: nothing of it ships anywhere.
function renderManifest({ members, raw, parts, assembled, disclosed, referenceMap, ideOnly, floor, floorLine }) {
  const memberRows = members.map(({ rel, section, embodiment }, i) => ({
    path: rel,
    embodiment,
    section,
    delivery: "bundled",
    order: i + 1,
    chars: raw[i].length,
    shippedChars: parts[i].length,
    budget: budgetFor({ rel, section }),
  }));
  const disclosedRows = disclosed.map(({ rel, section, name, embodiment }) => ({
    path: rel,
    embodiment,
    section,
    delivery: "disclosed",
    name,
    chars: referenceMap[name].length,
    shippedChars: referenceMap[name].length,
    budget: budgetFor({ rel, section }),
  }));
  const ideRows = ideOnly.map(({ rel, section, chars }) => ({
    path: rel,
    embodiment: "ide",
    section,
    delivery: "ide-only",
    chars,
    shippedChars: null,
    budget: null,
  }));
  const rows = [...memberRows, ...disclosedRows, ...ideRows];

  // Per-section totals, in SECTIONS order — the bundle's own order, so the
  // table reads the way the prompt loads.
  const sections = SECTIONS.map(({ name }) => {
    const mine = rows.filter((r) => r.section === name);
    const shipped = mine.filter((r) => r.delivery !== "ide-only");
    return {
      name,
      docs: mine.length,
      bundled: mine.filter((r) => r.delivery === "bundled").length,
      disclosed: mine.filter((r) => r.delivery === "disclosed").length,
      ideOnly: mine.filter((r) => r.delivery === "ide-only").length,
      chars: shipped.reduce((t, r) => t + r.shippedChars, 0),
    };
  });

  return {
    generatedBy: "agents/uno-bot/scripts/bundle-harness.mjs",
    // The census, as the datum the stdout sentence states in prose. Same four
    // numbers, same walk; a guard reads these instead of that sentence.
    census: {
      underRoots: members.length + disclosed.length + ideOnly.length,
      bundled: members.length,
      disclosed: disclosed.length,
      ideOnly: ideOnly.length,
    },
    // The constants, verbatim, so a doc that writes a budget down in prose can
    // be held to the number the build actually asserts (`check:harness-budgets`).
    budgets: { ...BUDGETS },
    floor: {
      region: floor.region,
      cache: floor.cache,
      value: floor.value,
      margin: floor.margin,
      line: floorLine,
      label: floor.label,
    },
    assembled: { chars: assembled.length, files: members.length, budget: BUDGETS.assembled },
    references: { count: disclosed.length, chars: Object.values(referenceMap).reduce((t, x) => t + x.length, 0) },
    sections,
    members: rows,
  };
}

/**
 * Read the tree and return the whole assembly. No writes, no prints, no exits.
 *
 * @param {{repoRoot?: string}} [ctx]
 * @returns {{
 *   members: {rel: string, section: string, embodiment: string}[],
 *   sections: typeof SECTIONS,
 *   disclosed: {rel: string, section: string, name: string, embodiment: string}[],
 *   census: {underRoots: number, bundled: number, disclosed: number, ideOnly: number} | null,
 *   artifacts: Record<string, string>,
 *   committed: Record<string, string> | null,
 *   manifest: object | null,
 *   findings: import('../../../scripts/lib/findings.mjs').Finding[],
 * }}
 *   `artifacts` and `manifest` are empty and null when a finding aborted the
 *   assembly: there is nothing to compare a tree against that must not ship.
 */
export function assemble({ repoRoot = REPO_ROOT } = {}) {
  /** @type {import('../../../scripts/lib/findings.mjs').Finding[]} */
  const findings = [];
  const result = (extra) => ({
    members: [],
    sections: SECTIONS,
    disclosed: [],
    census: null,
    artifacts: {},
    committed: null,
    manifest: null,
    findings,
    ...extra,
  });

  // Verify the repo root is the one that actually holds the harness before we
  // trust any path. Structural sentinels only — naming a member file here would
  // make the check die confusingly the day that file is renamed, and would put
  // a filename back in the one script that is supposed to hold none.
  for (const sentinel of ["AGENTS.md", "CONTEXT.md", "skills"]) {
    if (!existsSync(path.join(repoRoot, sentinel))) {
      findings.push({ message: `repo root check failed: ${sentinel} not found under ${repoRoot}` });
      return result();
    }
  }

  // Snapshot the COMMITTED bytes before a single char is assembled. A staleness
  // guard that generates first and compares against what it just wrote cannot
  // fail; reading the working tree up front is what makes the guard able to say
  // no, so it happens here rather than in whichever caller remembers to.
  const committed = Object.fromEntries(
    ARTIFACTS.map(({ rel }) => {
      const abs = path.join(repoRoot, rel);
      return [rel, existsSync(abs) ? readFileSync(abs, "utf8") : ""];
    }),
  );

  // ── Membership, derived ────────────────────────────────────────────────────
  //
  // Every doc under a section root must DECLARE where it belongs. A doc with no
  // `embodiment` is a finding: silence used to mean "not bundled", so a new
  // convention nobody listed was a rule the bot never learned, and nothing said so.
  const members = [];
  const undeclared = [];
  // The docs under these same roots that declare `embodiment: ide` — everything
  // the walk SAW and did not bundle. Not used to assemble anything; counted, and
  // carried in the census.
  const ideOnly = [];
  // Worker-read docs that declare `disclosure: reference` — the third answer the
  // walk can give. They ship in the reference map, never in the prompt.
  const disclosed = [];
  // `disclosure` on a doc that cannot carry it: an `ide` doc, or a value that is
  // not the one word this script knows. Both are findings below.
  const misdisclosed = [];

  for (const section of SECTIONS) {
    const found = [];
    for (const root of section.roots) {
      for (const rel of walk(repoRoot, root)) {
        // Endings normalised at the read boundary for the same reason the member
        // read below does it: a body length that depends on WHO checked the repo
        // out is not a measurement, and the manifest publishes this one.
        const { meta, body } = frontmatter(readFileSync(path.join(repoRoot, rel), "utf8").replace(/\r\n/g, "\n"));
        if (!meta.embodiment) {
          undeclared.push(rel);
          continue;
        }
        const workerReads = meta.embodiment === "uno-bot" || meta.embodiment === "all";
        if (meta.disclosure !== undefined) {
          if (meta.disclosure !== "reference") {
            misdisclosed.push({ rel, why: `\`disclosure: ${meta.disclosure}\` is not a delivery this script knows` });
          } else if (!workerReads) {
            misdisclosed.push({ rel, why: `\`disclosure: reference\` on an \`embodiment: ${meta.embodiment}\` doc names a Worker delivery for a doc the Worker never reads` });
          } else {
            disclosed.push({ rel, section: section.name, name: referenceName(rel), embodiment: meta.embodiment });
          }
          continue;
        }
        if (workerReads) found.push({ rel, embodiment: meta.embodiment });
        else if (meta.embodiment === "ide") ideOnly.push({ rel, section: section.name, chars: body.length });
      }
    }
    found.sort((a, b) => sortKey(a.rel).localeCompare(sortKey(b.rel)));
    members.push(...found.map(({ rel, embodiment }) => ({ rel, section: section.name, embodiment })));
  }
  disclosed.sort((a, b) => a.name.localeCompare(b.name));

  if (misdisclosed.length) {
    findings.push({
      message:
        `${misdisclosed.length} doc(s) carry a \`disclosure\` this script cannot honour:\n` +
        misdisclosed.map(({ rel, why }) => `  ${rel}: ${why}`).join("\n") +
        "\n  -> the one value is `disclosure: reference`, and only a doc the Worker reads (`embodiment: all`" +
        "\n     or `uno-bot`) can carry it. Absent means loaded into the prompt.",
    });
    return result({ committed });
  }

  if (undeclared.length) {
    findings.push({
      message:
        `${undeclared.length} doc(s) under a bundle section declare no \`embodiment\`:\n` +
        undeclared.map((p) => `  ${p}`).join("\n") +
        "\n  -> add `embodiment: all | ide | uno-bot` to the frontmatter. There is no default:" +
        "\n     a doc that does not say where it belongs is a rule nobody can find.",
    });
    return result({ committed });
  }

  if (!members.length) {
    findings.push({ message: "no members matched — the glob is broken, refusing to ship an empty prompt." });
    return result({ committed });
  }

  // ── The embodiment census (#174) ───────────────────────────────────────────
  //
  // What this walk saw: every doc under the section roots, split into the ones
  // bundled, the ones disclosed and the ones marked `ide`. It changes no
  // artifact, and the bundle does not need it.
  //
  // IT EXISTS FOR A READER OUTSIDE THIS SCRIPT. `check:negation` now ratchets
  // the IDE-side docs as well as the bundled ones, and the IDE corpus is exactly
  // the complement measured here: same roots, same frontmatter, the other
  // answer. A guard that re-walked those roots on its own would be a second glob
  // that can disagree with this one — the failure #159 deleted — so it walks
  // them and then checks itself against these four numbers. The `--check OK`
  // file count already plays that role for the bundled half (#234); this is the
  // same witness for the other half, and for the total, so a root silently
  // dropped from either list fails instead of narrowing a corpus in silence.
  const census = {
    underRoots: members.length + disclosed.length + ideOnly.length,
    bundled: members.length,
    disclosed: disclosed.length,
    ideOnly: ideOnly.length,
  };
  const partial = (extra) => result({ members, disclosed, census, committed, ...extra });

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
    return frontmatter(text).body;
  });

  // The disclosed docs, read the same way: frontmatter off, endings normalised,
  // `ide-only` regions dropped — the Worker is the reader, so the IDE's regions
  // are as foreign here as in the prompt. Keyed by name for the map.
  const referenceMap = Object.fromEntries(
    disclosed.map(({ rel, name }) => {
      const text = readFileSync(path.join(repoRoot, rel), "utf8").replace(/\r\n/g, "\n");
      return [name, stripIdeOnly(frontmatter(text).body)];
    }),
  );

  // ── Char budgets, per file ─────────────────────────────────────────────────
  const overBudget = [];
  raw.forEach((body, i) => {
    const budget = budgetFor(members[i]);
    if (budget && body.length > budget.limit) {
      overBudget.push({ rel: members[i].rel, ...budget, size: body.length });
    }
  });

  if (overBudget.length) {
    findings.push({
      message:
        `${overBudget.length} file(s) over its char budget:\n` +
        overBudget
          .map(
            ({ rel, role, size, limit }) =>
              `  ${rel} (${role}): ${n(size)} chars against a budget of ${n(limit)} — over by ${n(size - limit)}`,
          )
          .join("\n") +
        "\n  -> every char here ships in the system prompt on every request. Cut restatement first:" +
        "\n     a rule that is stated elsewhere in the bundle should be cited, not quoted.",
    });
    return partial();
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
  // Fail instead: a surviving marker proves something didn't strip.
  if (/<!--\s*\/?\s*ide-only\s*-->/i.test(assembled + Object.values(referenceMap).join(""))) {
    findings.push({
      message:
        "an <!-- ide-only --> marker survived assembly — unbalanced or misspelled pair. " +
        "IDE-only content would ship to the bot (in the prompt or the reference map). Fix the markers and re-run.",
    });
    return partial();
  }

  // ── Char budget, assembled ─────────────────────────────────────────────────
  if (assembled.length > BUDGETS.assembled) {
    findings.push({
      message:
        `the assembled bundle is over its char budget: ${n(assembled.length)} chars ` +
        `against a budget of ${n(BUDGETS.assembled)} — over by ${n(assembled.length - BUDGETS.assembled)} ` +
        `(${members.length} files).\n` +
        "  -> the whole bundle is the prompt's cached prefix, paid on every request. Cut, or raise the" +
        "\n     budget deliberately in a PR that says what the prompt bought for the chars.",
    });
    return partial();
  }

  // ── Char floor, assembled (#418) ───────────────────────────────────────────
  //
  // Asserted on the SAME quantity as the ceiling — the assembled prompt, which is
  // the cached block in its entirety — so the two bounds cannot disagree about
  // what they measure. Fails the same way the ceiling does: no artifact is
  // assembled, and the finding names the floor, the cache it follows, the margin
  // and the shortfall.
  const chosen = activeFloor(repoRoot);
  if (!chosen.floor) {
    findings.push({ message: chosen.message });
    return partial();
  }
  const floor = chosen.floor;
  const floorLine = floor.value + floor.margin;
  if (assembled.length < floorLine) {
    const consequence =
      floor.cache === "implicit"
        ? "below the floor Google's implicit cache holds none of the prompt, and it ships"
        : "below the floor the Gemini lane cannot create its explicit context cache, and the prompt ships inline";
    findings.push({
      message:
        `the assembled bundle is under its char floor: ${n(assembled.length)} chars ` +
        `against a floor of ${floor.label} — short by ${n(floorLine - assembled.length)} (${members.length} files).\n` +
        `  -> ${consequence}` +
        "\n     at full price every iteration. Put a document back, or lower the floor" +
        "\n     deliberately in a PR that cites the /debug/gemini-cache measurement it rests on.",
    });
    return partial();
  }

  const instanceDataHits = findInstanceData(assembled);
  if (instanceDataHits.length) {
    const report =
      `${instanceDataHits.length} possible blueprint INSTANCE DATA hit(s) in the assembled harness:\n` +
      instanceDataHits
        .map((h) => `  assembled:${h.line}  (${h.pattern}: "${h.match}")\n    ${h.text}`)
        .join("\n") +
      "\n  -> Counts and membership lists about the blueprint's CONTENTS go stale between deploys and" +
      "\n     ship as confident wrong answers. Delete the number and let search_blueprint retrieve it," +
      "\n     or, if the figure is deliberate (a historical ledger, a fixed contract), mark the line/block:" +
      "\n       <!-- instance-data-ok: why this number is allowed to be frozen -->";
    if (INSTANCE_DATA_GUARD_BLOCKING) {
      findings.push({ message: report });
      return partial();
    }
    // A warning travels: it is printed by the CLI and reported by the check
    // module, and fails neither. Flipping the constant above makes it blocking
    // in both, which is the point of the flag living in one place.
    findings.push({
      message: `${report}\n  (log-only: set INSTANCE_DATA_GUARD_BLOCKING = true in this script to make it blocking)`,
      severity: "warning",
    });
  }

  const contents =
    "// GENERATED by scripts/bundle-harness.mjs — do not edit by hand. Run: npm run bundle:harness\n" +
    `export const HARNESS = ${JSON.stringify(assembled)};\n`;

  // The reference map, from the same walk (#423). Baked, so a read_reference call
  // is a property lookup: zero subrequests, nothing to fail on a cold start.
  const referencesContents =
    "// GENERATED by scripts/bundle-harness.mjs — do not edit by hand. Run: npm run bundle:harness\n" +
    "// The disclosed docs (`disclosure: reference` in their frontmatter), keyed by the name\n" +
    "// the read_reference tool takes. Same assembly as harness.ts; held to the same --check.\n" +
    `export const REFERENCES: Record<string, string> = ${JSON.stringify(referenceMap)};\n`;

  const rendered = { members, raw, parts, assembled, disclosed, referenceMap, ideOnly, floor, floorLine };

  return result({
    members,
    disclosed,
    census,
    committed,
    artifacts: {
      [HARNESS_TS]: contents,
      [COMPANION_MD]: renderCompanion(rendered),
      [REFERENCES_TS]: referencesContents,
    },
    manifest: renderManifest(rendered),
  });
}

/**
 * The artifacts whose committed bytes differ from what this assembly would
 * write, in the order a report names them.
 *
 * Compared on NORMALISED endings. The HARNESS string itself is JSON-escaped, so
 * the only real newlines in that file are the two wrapper ones — and on a
 * Windows checkout those arrive as CRLF while the assembly builds with "\n".
 * That 2-char difference reported the harness as STALE on every Windows run,
 * which is a guard crying wolf rather than a guard. The companion is real
 * markdown and gets the same treatment for the same reason.
 *
 * BOTH COMPANION AND MAP ARE IN IT, not just harness.ts: the companion is not
 * decoration a reviewer can let rot. Every artifact this script owns is
 * compared, so a doc edited without regenerating fails on whichever is behind
 * — and the report names it.
 *
 * @param {{artifacts: Record<string, string>, committed: Record<string, string> | null}} assembly
 * @returns {{rel: string, hint: string, expected: string, committed: string}[]}
 */
export function staleArtifacts({ artifacts, committed }) {
  if (!committed || !Object.keys(artifacts).length) return [];
  const norm = (t) => t.replace(/\r\n/g, "\n");
  return ARTIFACTS.filter(({ rel }) => norm(committed[rel] ?? "") !== norm(artifacts[rel])).map(({ rel, hint }) => ({
    rel,
    hint,
    expected: artifacts[rel],
    committed: committed[rel] ?? "",
  }));
}

// ═════════════════════════════════════════════════════════════════════════════
// The CLI. Everything below is presentation and process: it prints the census a
// human watching a build reads, writes the artifacts, and exits. `--check` and
// `--manifest` keep the names, messages and exit codes they have always had,
// because `scripts/lib/bundled-set.mjs` and `scripts/check-harness-budgets.mjs`
// spawn this file for the manifest and read its exit code.
// ═════════════════════════════════════════════════════════════════════════════

/** Where `--manifest` writes when it is given no path. */
const DEFAULT_MANIFEST = path.join(here, "..", ".bundle", "harness-manifest.json");

/** The manifest path this run should write, or null when nothing asked for one. */
function manifestPath(argv = process.argv, env = process.env) {
  const i = argv.indexOf("--manifest");
  if (i !== -1) {
    const next = argv[i + 1];
    // `--manifest` alone means "the default path"; a following token that is not
    // another flag is the path to write.
    return next && !next.startsWith("-") ? path.resolve(next) : DEFAULT_MANIFEST;
  }
  const eq = argv.find((a) => a.startsWith("--manifest="));
  if (eq) return path.resolve(eq.slice("--manifest=".length));
  // The env var exists for a caller that cannot add an argv — an npm script
  // wrapper, a workflow step — and names the same file.
  if (env.HARNESS_MANIFEST) return path.resolve(env.HARNESS_MANIFEST);
  return null;
}

/** One prefix for every line this script says, so a build log stays greppable. */
const say = (text) => `[bundle-harness] ${text}`;

function cli() {
  const CHECK = process.argv.includes("--check");
  const MANIFEST = manifestPath();
  const repoRoot = REPO_ROOT;

  const assembly = assemble({ repoRoot });
  const errors = assembly.findings.filter((f) => (f.severity ?? "error") === "error");
  const warnings = assembly.findings.filter((f) => (f.severity ?? "error") !== "error");

  // The census sentence stays exactly where it was: after the membership guards,
  // before the budgets, so a build that fails on a budget still says what the
  // walk saw.
  if (assembly.census) {
    const { underRoots, bundled, disclosed, ideOnly } = assembly.census;
    console.log(
      say(
        `embodiment census: ${n(underRoots)} declared doc(s) under the ` +
          `section roots — ${n(bundled)} bundled, ${n(disclosed)} disclosed, ${n(ideOnly)} ide-only`,
      ),
    );
  }

  for (const warning of warnings) console.warn(say(warning.message));

  if (errors.length) {
    for (const error of errors) console.error(say(error.message));
    process.exit(1);
  }

  // Written BEFORE the `--check` exit below, because the callers that need it are
  // exactly the guards that ask this script `--check`.
  if (MANIFEST) {
    mkdirSync(path.dirname(MANIFEST), { recursive: true });
    writeFileSync(MANIFEST, `${JSON.stringify(assembly.manifest, null, 2)}\n`, "utf8");
  }

  const abs = (rel) => path.join(repoRoot, rel);

  // `--check`: compare what this run WOULD write against the committed bytes
  // snapshotted before assembly — so the comparison can never be against
  // something this run produced — and write nothing. Every other generator in
  // this repo has a --check counterpart; this one did not, so a harness doc
  // could be edited and the baked copy left behind with nothing noticing until
  // someone read the bot's answer.
  if (CHECK) {
    const stale = staleArtifacts(assembly);
    if (stale.length) {
      console.error(
        say(
          `${stale.length} generated artifact(s) STALE — a bundled harness doc changed but the generated file was not regenerated:\n`,
        ) +
          stale
            .map(
              ({ rel, expected, committed }) =>
                `  ${abs(rel)}\n    committed: ${n(committed.length)} chars · regenerated: ${n(expected.length)} chars`,
            )
            .join("\n") +
          "\n  -> run `npm run bundle:harness` and commit " +
          stale.map(({ hint }) => hint).join(" + ") +
          ".",
      );
      process.exit(1);
    }
    const { chars, files } = assembly.manifest.assembled;
    console.log(
      say(
        `--check OK (${chars} chars from ${files} files; ` +
          `${assembly.disclosed.length} reference(s) disclosed; harness.ts + harness-bundle.md + references.ts all current)`,
      ),
    );
    process.exit(0);
  }

  const { chars, files } = assembly.manifest.assembled;
  for (const { rel } of ARTIFACTS) {
    mkdirSync(path.dirname(abs(rel)), { recursive: true });
    writeFileSync(abs(rel), assembly.artifacts[rel], "utf8");
  }

  console.log(say(`wrote ${abs(HARNESS_TS)} (${chars} chars from ${files} files)`));
  console.log(
    say(`wrote ${abs(COMPANION_MD)} (manifest + assembled prompt, ${n(assembly.artifacts[COMPANION_MD].length)} chars)`),
  );
  console.log(
    say(
      `wrote ${abs(REFERENCES_TS)} (${assembly.disclosed.length} reference(s): ` +
        `${assembly.manifest.members
          .filter((m) => m.delivery === "disclosed")
          .map((m) => `${m.name} ${n(m.chars)} chars`)
          .join(", ") || "none"})`,
    ),
  );
}

// Imported by the check module and by the tests, so it must do nothing on import.
if (isEntry(import.meta.url)) cli();
