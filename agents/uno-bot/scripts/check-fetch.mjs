// Build guard: every outbound network call must go through net.ts's
// countedFetch, and every Durable Object stub call must be charge()d, because
// the budget gate reads a real subrequest counter (ADR-022). A call the counter
// can't see makes the gate say "plenty of headroom" while the invocation is
// already past Cloudflare's 50 — the 👀-then-silence failure.
//
// Not airtight — `const f = fetch; f(url)` is undetectable by regex. It catches
// the accidents (a new integration, a copy-pasted call, a new DO binding), not
// a determined bypass.
//
// Run: npm run check:fetch (also runs as part of deploy)
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "..", "src");

// net.ts owns the one real fetch.
const ALLOWED_BARE_FETCH = new Set(["net.ts"]);

// DO stub calls are real subrequests that never touch fetch(), so they must be
// charge()d by hand. Allowlisted by file:line-content so a NEW stub call fails
// the build instead of silently going uncounted — the one surface the meter
// cannot instrument itself.
const CHARGED_STUB_CALLS = new Set([
  "thread-state-client.ts", // call() charges 1 for every ThreadState hop
  "slack/events.ts", // enqueueAgentJob charges 1 for the AgentRunner hop
]);

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

const offences = [];
for (const rel of readdirSync(srcDir, { recursive: true })) {
  if (!rel.endsWith(".ts") || rel.startsWith("generated/")) continue;
  const unix = rel.split(path.sep).join("/");
  const lines = readFileSync(path.join(srcDir, rel), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (PROSE_LINE.test(line)) return;
    const at = `  src/${unix}:${i + 1}: ${line.trim()}`;
    if (GLOBAL_FETCH.test(line)) {
      offences.push(`${at}\n    -> globalThis/self/window.fetch bypasses the meter; import countedFetch.`);
      return;
    }
    if (BARE_FETCH.test(line) && !HANDLER_DEF.test(line) && !ALLOWED_BARE_FETCH.has(unix)) {
      offences.push(`${at}\n    -> bare fetch(); import countedFetch from net.ts.`);
      return;
    }
    if (STUB_FETCH.test(line) && !GLOBAL_FETCH.test(line) && !CHARGED_STUB_CALLS.has(unix)) {
      offences.push(`${at}\n    -> looks like a Durable Object / service-binding call. Those are real\n       subrequests the meter can't see: charge(1, "<label>") next to it, then\n       add this file to CHARGED_STUB_CALLS.`);
    }
  });
}

if (offences.length) {
  console.error(`[check-fetch] ${offences.length} uncounted call site(s) — see ADR-022:\n${offences.join("\n")}`);
  process.exit(1);
}

console.log("[check-fetch] ok — every outbound call is counted");
