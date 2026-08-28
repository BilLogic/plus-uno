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
import { appendFileSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP = resolve(process.env.BLUEPRINT_REPO ?? "../../../../../uno-blueprint");
const SOURCE = resolve(APP, "src/lib/blueprintContract.ts");
const VENDORED = resolve("src/generated/blueprint-contract.ts");

const check = process.argv.includes("--check");

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

// Past here the source EXISTS, so the comparison is real and neither escape
// hatch applies to it: `BLUEPRINT_CONTRACT_OPTIONAL` covers a missing checkout,
// never a failing comparison. Drift fails the run whatever it is set to.
const same =
  existsSync(VENDORED) && readFileSync(SOURCE, "utf8") === readFileSync(VENDORED, "utf8");
if (same) {
  console.log("vendored contract matches the app");
  if (check) announce("notice", "vendored contract matches the app.");
} else if (check) {
  console.error("drift: src/generated/blueprint-contract.ts differs from the app's blueprintContract.ts");
  announce(
    "error",
    "drift — src/generated/blueprint-contract.ts differs from the app's " +
      "blueprintContract.ts. To repair, run this script WITHOUT --check from " +
      "agents/uno-bot, with BLUEPRINT_REPO pointing at a uno-blueprint checkout.",
  );
  process.exit(1);
} else {
  copyFileSync(SOURCE, VENDORED);
  console.log("synced: blueprint-contract.ts");
}
