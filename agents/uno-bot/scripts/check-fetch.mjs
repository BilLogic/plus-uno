// Build guard: every outbound network call must go through net.ts's
// countedFetch, and every Durable Object stub call must be charge()d, because
// the budget gate reads a real subrequest counter (ADR-022). A call the counter
// can't see makes the gate say "plenty of headroom" while the invocation is
// already past Cloudflare's 50 — the 👀-then-silence failure.
//
// This is the SECOND line of defence, not the only one: net.ts also meters
// globalThis.fetch, so a call that slips these regexes is still counted. The
// guard's job is to keep call sites on countedFetch (which is also where the
// timeout policy lives) and to catch the one case the runtime patch can't — an
// alias captured at module scope in a file that evaluates before net.ts.
//
// It reads only `agents/uno-bot/src/`, but it takes the repo root like every
// other check on the findings interface (#509) and derives that directory
// itself, so the harness runner can import it from the root and call
// `run({ repoRoot })` without knowing where this package sits.
//
// Run: npm run check:fetch (also runs as part of deploy)
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { main } from "../../../scripts/lib/findings.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "..", "..", "..");

/** The one tree this guard reads, wherever the repo root happens to be. */
const srcDirIn = (repoRoot) => path.join(repoRoot, "agents", "uno-bot", "src");

// net.ts owns the one real fetch.
const ALLOWED_BARE_FETCH = new Set(["net.ts"]);

// DO stub calls are real subrequests that never touch fetch(), so they must be
// charge()d by hand. Allowlisted by file:line-content so a NEW stub call fails
// the build instead of silently going uncounted — the one surface the meter
// cannot instrument itself.
const CHARGED_STUB_CALLS = new Set([
  "slack/events.ts", // enqueueAgentJob charges 1 for the AgentRunner hop
]);

// A Durable Object RPC hop — `stub.readHistory(ref, at)` (#493) — is the same
// kind of uncounted internal subrequest, but it is INVISIBLE to the regex
// below: there is no `.fetch(` to match, and a method call on a stub looks like
// any other method call. So this guard cannot be the thing that keeps RPC hops
// charged. What keeps them charged is that they are confined to one function:
// `hop()` in src/thread-state/durable-object.ts charges 1 and is the only place
// in the module that touches a stub, and tests/workerd asserts the internal
// counter rises by exactly one per hop. If a second module ever calls a Durable
// Object by RPC, it needs its own single charged call site and its own test —
// this file will not catch it.

// Skip whole-line comments only — this file's own history explains "fetch()" in
// prose several times. Trailing comments are NOT stripped: naive `//`-splitting
// eats the `//` inside a URL literal and takes the real call with it, and a
// missed call costs the reply while a false positive costs one word.
const PROSE_LINE = /^\s*(?:\/\/|\*|\/\*)/;
const BARE_FETCH = /(?<![.\w])fetch\s*\(/;
const GLOBAL_FETCH = /\b(?:globalThis|self|window)\s*\.\s*fetch\s*\(/;
const STUB_FETCH = /\.\s*fetch\s*\(/;
// A handler DEFINITION takes a typed parameter: `async fetch(request: Request)`.
// Without the `\w+\s*:` a fire-and-forget statement — `fetch(url).catch(…)`,
// which this codebase does write — would exempt itself by sitting at line start.
const HANDLER_DEF = /^\s*(?:async\s+)?fetch\s*\(\s*\w+\s*:/;
// `const f = fetch` / `wrap(fetch)` / `[fetch]` — a reference, not a call. Only
// these shapes, not any bare word `fetch`, so prose and "fetch failed" strings
// stay quiet. A module-scope alias is the one hole the runtime patch can't
// close (net.ts may evaluate after the file that captured it).
const ALIAS_FETCH = /=\s*fetch\s*(?![(\w])|[([,]\s*fetch\s*[,)\]]/;

// Each offence already carries its own `->` line, because what to do about it
// depends on which of the four shapes matched. This paragraph carries the one
// thing the deleted banner said and no single offence does: why an uncounted
// call site matters at all.
export const REMEDY =
  "  -> See ADR-022. The budget gate reads a real subrequest counter, so a call\n" +
  "     site the counter cannot see makes the gate report headroom that is not\n" +
  "     there, and the invocation dies past Cloudflare's 50 with nothing said.";

/**
 * @param {{repoRoot?: string}} [ctx]
 * @returns {import('../../../scripts/lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const srcDir = srcDirIn(repoRoot);
  const offences = [];
  for (const rel of readdirSync(srcDir, { recursive: true })) {
    if (!rel.endsWith(".ts") || rel.startsWith("generated/")) continue;
    const unix = rel.split(path.sep).join("/");
    const lines = readFileSync(path.join(srcDir, rel), "utf8").split("\n");
    lines.forEach((line, i) => {
      if (PROSE_LINE.test(line)) return;
      // `src/<file>:<line>` is relative to this package, not to the repo, so it
      // stays inside the sentence rather than moving into a Finding's `file`.
      const at = `src/${unix}:${i + 1}: ${line.trim()}`;
      if (GLOBAL_FETCH.test(line)) {
        offences.push(`${at}\n    -> globalThis/self/window.fetch bypasses the meter; import countedFetch.`);
        return;
      }
      if (BARE_FETCH.test(line) && !HANDLER_DEF.test(line) && !ALLOWED_BARE_FETCH.has(unix)) {
        offences.push(`${at}\n    -> bare fetch(); import countedFetch from net.ts.`);
        return;
      }
      if (ALIAS_FETCH.test(line) && !ALLOWED_BARE_FETCH.has(unix)) {
        offences.push(`${at}\n    -> aliases the global fetch. A module-scope alias can be captured before\n       net.ts patches the global, escaping the meter; use countedFetch.`);
        return;
      }
      if (STUB_FETCH.test(line) && !GLOBAL_FETCH.test(line) && !CHARGED_STUB_CALLS.has(unix)) {
        offences.push(`${at}\n    -> looks like a Durable Object / service-binding call. Those are INTERNAL\n       subrequests (separate 1,000 cap) the meter can't see: charge(1, "<label>")\n       next to it, then add this file to CHARGED_STUB_CALLS.`);
      }
    });
  }
  return offences.map((message) => ({ message }));
}

/** The green line. The ✓ says "ok"; this says what was proved. */
export function summary() {
  return "every outbound call is counted";
}

main(import.meta.url, "check:fetch", { run, summary, remedy: REMEDY });
