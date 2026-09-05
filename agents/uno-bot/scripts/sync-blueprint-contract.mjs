#!/usr/bin/env node
// One-way sync of the cross-repo blueprint contract from the uno-blueprint
// app repo (its src/lib/blueprintContract.ts is the CANONICAL home) into this
// Worker's vendored copy, with a drift check for CI: `--check` exits 1 when
// the vendored bytes differ instead of copying.
//
// Same pattern as the app's own scripts/sync-agent-skill.mjs (plugin → app).
// Two coordination bugs shipped silently before the contract existed (renamed
// slices column, re-shaped findings column — both made bot reads return empty
// for weeks); a drifted copy now fails loudly here instead.
//
// ── The account rides the same seam (#412) ───────────────────────────────────
//
// The blueprint's agent-facing account of itself — `docs/agents/blueprint.md`
// (the core: shape, status vocabulary, retrieval, the schema rendered from the
// live catalog) and `docs/agents/blueprint-direct-access.md` (query recipes
// and service-key notes for an agent with SQL) — is written in the blueprint
// repo, where a column rename and the sentence describing it are one commit.
// uno-bot vendors both through THIS script, into `docs/connectors/supabase/`,
// so they enter the prompt by the bundler's `embodiment:` glob like any other
// doc and drift reddens the same gate the contract already stands on. The
// vendored copy is rendered, not copied byte-for-byte: it gets the frontmatter
// this repo's bundler needs and a header saying where it came from; everything
// below the header is the source's bytes. The core declares `embodiment: all`
// (the Worker and IDE sessions both read it); the supplement declares
// `embodiment: ide`, so the glob never bundles it — the Worker has no key and
// no SQL, and the recipes would only cost it prompt. A region wrap was tried
// first and rejected: a Worker-read doc whose whole body is `ide-only` is a
// member the bundler assembles as nothing and manifests as a row, and the
// companion's own test holds one row per member actually in the prompt.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { posix, resolve } from "node:path";

const APP = resolve(process.env.BLUEPRINT_REPO ?? "../../../../../uno-blueprint");
// Where the vendored docs land. Resolved from the working directory, which is
// `agents/uno-bot` when run through npm; PLUS_UNO_ROOT overrides it so the
// test can point both targets at a throwaway tree.
const REPO = resolve(process.env.PLUS_UNO_ROOT ?? "../..");
const ACCOUNT_REPO = "BilLogic/plus-uno-blueprint";
const ACCOUNT_DIR = "docs/agents";

const check = process.argv.includes("--check");

/**
 * The map. `source` is the path in the app repo; `target` the vendored path;
 * `render` turns source bytes into vendored bytes (identity for the contract).
 * `label` is what the log and the drift message call the file.
 */
const TARGETS = [
  {
    label: "blueprint-contract.ts",
    source: resolve(APP, "src/lib/blueprintContract.ts"),
    target: resolve("src/generated/blueprint-contract.ts"),
    shown: "src/generated/blueprint-contract.ts",
    render: (text) => text,
  },
  {
    label: "blueprint.md",
    source: resolve(APP, ACCOUNT_DIR, "blueprint.md"),
    target: resolve(REPO, "docs/connectors/supabase/blueprint.md"),
    shown: "docs/connectors/supabase/blueprint.md",
    render: (text, rev) => renderAccount(text, rev, { file: "blueprint.md", embodiment: "all" }),
  },
  {
    label: "blueprint-direct-access.md",
    source: resolve(APP, ACCOUNT_DIR, "blueprint-direct-access.md"),
    target: resolve(REPO, "docs/connectors/supabase/blueprint-direct-access.md"),
    shown: "docs/connectors/supabase/blueprint-direct-access.md",
    render: (text, rev) =>
      renderAccount(text, rev, {
        file: "blueprint-direct-access.md",
        embodiment: "ide",
        // This repo's routing line, stated positively: the source's summary
        // carries a ban ("never a restatement"), and check:negation ratchets
        // the IDE corpus whole-file, frontmatter included.
        summary:
          "Query recipes and service-key notes for agents that read the blueprint's database directly rather than through the portal — the supplement to blueprint.md, which it adds to",
      }),
  },
];

/**
 * The vendored account. Frontmatter is this repo's (`embodiment` as the map
 * says; the source's `summary` is kept so INDEX.md can route it, unless the
 * map supplies its own routing line), followed by
 * a header naming the origin, then the source's body unchanged except that
 * links which leave `docs/agents/` in the blueprint repo are pointed at that
 * repo on GitHub, because the files they name are not here.
 *
 * The revision is recorded in frontmatter, where the bundler strips it, and is
 * the one line `--check` ignores: a CI checkout is shallow and a local one is
 * not, so any revision derived from git differs between the two and a
 * comparison that included it would drift on every commit to the app.
 */
function renderAccount(text, rev, { file, embodiment, summary }) {
  const { meta, body } = splitFrontmatter(text);
  const origin = `${ACCOUNT_REPO} ${ACCOUNT_DIR}/${file}`;
  const routing = summary ?? meta.summary;
  const front =
    "---\n" +
    `embodiment: ${embodiment}\n` +
    (routing ? `summary: ${routing}\n` : "") +
    `vendored_from: ${origin}\n` +
    `vendored_revision: ${rev}\n` +
    "---\n\n";
  const header =
    `<!-- VENDORED from ${origin} by agents/uno-bot/scripts/sync-blueprint-contract.mjs. ` +
    "Edit it there: this copy is overwritten by the sync, and `npm run check:contract` fails on drift. -->\n\n";
  return front + header + rewriteLinks(body, file);
}

/** Frontmatter off, the way scripts/lib/frontmatter.mjs does it — inlined so
 *  this script stays runnable from a bare `agents/uno-bot` in the test. */
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

/** A relative link to a sibling account doc stays relative (the sibling is
 *  vendored beside it); any other relative link leaves this repo. */
function rewriteLinks(body, file) {
  const siblings = new Set(TARGETS.map((t) => t.label).filter((l) => l !== file && l.endsWith(".md")));
  return body.replace(/\]\(([^)\s#]+)(#[^)]*)?\)/g, (whole, href, hash = "") => {
    if (/^[a-z]+:/.test(href) || siblings.has(href)) return whole;
    const rel = posix.normalize(posix.join(ACCOUNT_DIR, href));
    return `](https://github.com/${ACCOUNT_REPO}/blob/main/${rel}${hash})`;
  });
}

/** The app checkout's revision, for the record. BLUEPRINT_REVISION wins, so a
 *  tarball with no `.git` can still say what it is; otherwise git; otherwise
 *  "unknown". Never part of the comparison — see renderAccount. */
function revisionOf() {
  if (process.env.BLUEPRINT_REVISION) return process.env.BLUEPRINT_REVISION;
  const git = spawnSync("git", ["-C", APP, "rev-parse", "--short=12", "HEAD"], { encoding: "utf8" });
  const out = git.status === 0 ? git.stdout.trim() : "";
  return /^[0-9a-f]{7,40}$/.test(out) ? out : "unknown";
}

/** The revision a vendored account already records, so `--check` renders the
 *  source against the same one. */
function recordedRevision(target) {
  if (!existsSync(target)) return "unknown";
  const m = readFileSync(target, "utf8").match(/^vendored_revision:\s*(\S+)$/m);
  return m ? m[1] : "unknown";
}

/**
 * Say it where someone will see it, not only in the log.
 *
 * #258: the skip banner below was already printed on every deploy, and nobody
 * read it — a `SKIPPED:` line inside a job that finishes green is invisible.
 * The vendored contract then drifted for real (plus-uno-blueprint#144 renamed
 * the breadcrumb label to `Lane` while the vendored copy went on declaring
 * `Layer`) and was found by hand rather than by the gate.
 *
 * `::warning::` puts a line on the run's summary page and against the workflow
 * file; `$GITHUB_STEP_SUMMARY` puts it in the job summary a reader lands on
 * first. Both are no-ops off CI, so local runs are unchanged.
 */
function announce(level, message) {
  // Only on CI. Off it, the plain sentence has already been printed above and
  // the `::error::` prefix is workflow syntax that reads like a broken tool —
  // which matters here, because the drift message tells people to run this
  // script by hand.
  if (!process.env.GITHUB_ACTIONS) return;
  console.error(`::${level}::${message}`);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) return;
  const icon = level === "warning" ? "⚠️" : level === "error" ? "❌" : "✅";
  try {
    appendFileSync(summary, `${icon} **contract gate** — ${message}\n`);
  } catch {
    // A summary file that cannot be written must not fail the deploy; the
    // annotation above has already been emitted.
  }
}

// An ABSENT source is not a passing check.
//
// This used to `exit(check ? 0 : 1)` — "an absent app checkout must not fail
// CI". But the app checkout is absent on EVERY runner, so `--check` returned
// success without comparing anything, while the deploy workflow's header
// listed it as one of four gates protecting an auto-deploy to main. A gate that
// cannot fail is worse than no gate: it is a gate everyone believes in.
//
// Set BLUEPRINT_CONTRACT_OPTIONAL=1 to get the old behaviour, and say so out
// loud when you do — the deploy workflow sets it only when the checkout secret
// is unconfigured. BLUEPRINT_CONTRACT_REQUIRED=1 overrides it either way, so
// the skip can be closed off from repo settings without editing this file: set
// it once BLUEPRINT_REPO_TOKEN exists and an unconfigured checkout stops
// deploying instead of quietly not checking (#258).
//
// The contract is the sentinel for the whole checkout: if it is missing, the
// checkout is. An account doc missing from a checkout that HAS the contract is
// a different fact — the app has not published it — and fails below whatever
// the escape hatch says, because the hatch excuses a missing checkout, never a
// missing file.
const SOURCE = TARGETS[0].source;
if (!existsSync(SOURCE)) {
  const required = process.env.BLUEPRINT_CONTRACT_REQUIRED === "1";
  const optional = !required && process.env.BLUEPRINT_CONTRACT_OPTIONAL === "1";
  console.error(`blueprint contract not found at ${SOURCE} (set BLUEPRINT_REPO)`);
  if (check && optional) {
    console.error("SKIPPED: contract drift was NOT checked on this run.");
    announce(
      "warning",
      "SKIPPED — the app checkout is absent, so the vendored contract was not " +
        "compared against anything. Configure BLUEPRINT_REPO_TOKEN to arm it (#258).",
    );
    process.exit(0);
  }
  announce(
    "error",
    required
      ? `the app checkout is absent at ${SOURCE} and BLUEPRINT_CONTRACT_REQUIRED=1, ` +
        `so the skip is closed off.${check ? " The deploy stops here." : ""}`
      : `the app checkout is absent at ${SOURCE}, so ${check ? "drift cannot be checked" : "there is nothing to sync from"}.`,
  );
  process.exit(1);
}

const missing = TARGETS.filter((t) => !existsSync(t.source));
if (missing.length) {
  const list = missing.map((t) => t.source).join(", ");
  console.error(`blueprint account not found: ${list} — the app checkout is present but has not published it`);
  announce("error", `the app checkout at ${APP} lacks ${list}; the vendored account cannot be ${check ? "checked" : "synced"}.`);
  process.exit(1);
}

// Past here every source EXISTS, so the comparison is real and neither escape
// hatch applies to it: `BLUEPRINT_CONTRACT_OPTIONAL` covers a missing checkout,
// never a failing comparison. Drift fails the run whatever it is set to.
const rev = revisionOf();
const drifted = [];
let synced = 0;
for (const t of TARGETS) {
  const source = readFileSync(t.source, "utf8");
  const want = t.render(source, check ? recordedRevision(t.target) : rev);
  const same = existsSync(t.target) && readFileSync(t.target, "utf8") === want;
  if (same) continue;
  if (check) {
    drifted.push(t);
    continue;
  }
  writeFileSync(t.target, want);
  console.log(`synced: ${t.label}`);
  synced++;
}

if (check && drifted.length) {
  for (const t of drifted) console.error(`drift: ${t.shown} differs from the app's ${t.label}`);
  announce(
    "error",
    `drift — ${drifted.map((t) => t.shown).join(", ")} differs from the app's ` +
      `${drifted.map((t) => t.label).join(", ")}. To repair, run this script WITHOUT --check from ` +
      "agents/uno-bot, with BLUEPRINT_REPO pointing at a uno-blueprint checkout.",
  );
  process.exit(1);
}
if (!synced) {
  console.log("vendored contract matches the app");
  if (check) announce("notice", "vendored contract matches the app, and so does the account.");
}
