#!/usr/bin/env node
// The workflow's entry point into `verify-deployed.mjs` — environment in,
// exit code and annotations out. Everything with a decision in it — the polling,
// the diagnosis, and the parsing of UNO_BOT_HOLD_SAMPLES — lives next door and
// is tested there, so what remains here is wiring.
import { buildIdFromEnv } from "./build-id.mjs";
import { holdSamples, verifyDeployed } from "./verify-deployed.mjs";
import { appendFileSync } from "node:fs";

const URL_ = process.env.UNO_BOT_HEALTH_URL ?? "https://uno-bot.bryanhuang628.workers.dev/health";

/**
 * Samples to keep watching after our build appears, at 5s each.
 *
 * 30 is 150 seconds. Every overwrite observed so far landed within ~40s, and
 * the window is set well past that on purpose: a hold trimmed to the one case
 * we have measured proves nothing about the next one. An explicit `0` from the
 * repo variable disables it. The parsing lives in the tested module.
 */
const HOLD = holdSamples(process.env.UNO_BOT_HOLD_SAMPLES);

/** Say it on the run's summary page, not only in the log (the lesson of #258). */
function announce(level, message) {
  if (!process.env.GITHUB_ACTIONS) return;
  console.error(`::${level}::${message}`);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) return;
  try {
    appendFileSync(summary, `${level === "error" ? "❌" : "✅"} **deploy** — ${message}\n`);
  } catch {
    // The annotation above has already been emitted; a summary that cannot be
    // written must not change the deploy's outcome.
  }
}

if (HOLD === null) {
  console.error(
    `UNO_BOT_HOLD_SAMPLES must be a non-negative integer, got ${JSON.stringify(process.env.UNO_BOT_HOLD_SAMPLES)}`,
  );
  process.exit(1);
}

// Derived by the SAME module the bundle was built with, so the two can never
// drift apart. Re-deriving the format here would be a second definition of the
// stamp, and the second one would be wrong eventually.
const expected = buildIdFromEnv();
console.log(`expected: uno-bot ok ${expected}`);

const result = await verifyDeployed({ expected, url: URL_, holdAttempts: HOLD });

if (result.ok) {
  announce("notice", `\`${expected}\` is serving, and held for the whole window.`);
  process.exit(0);
}

const headline =
  result.reason === "overwritten"
    ? `\`${expected}\` deployed and was then OVERWRITTEN — /health now says \`${result.serving}\`.`
    : `the worker never served \`${expected}\` — last seen \`${result.serving}\`.`;

console.error(headline);
console.error(result.diagnosis);
announce("error", `${headline} ${result.diagnosis}`);
process.exit(1);
