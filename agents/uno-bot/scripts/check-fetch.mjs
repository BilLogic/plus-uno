// Build guard: every outbound network call must go through net.ts's
// countedFetch, because the budget gate now reads a real subrequest counter. A
// bare `fetch(` anywhere else is invisible to that counter — the gate would say
// "plenty of headroom" while the invocation was already past Cloudflare's 50,
// which is the exact 👀-then-silence failure the meter exists to end.
//
// This is the same fail-the-build shape as bundle-harness's ide-only marker
// check: the rule is only worth having if it can't be forgotten.
// Run: npm run check:fetch (also runs as part of deploy)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "..", "src");

// net.ts owns the one real fetch. Handler *definitions* (`async fetch(request`)
// and Durable Object stub calls (`stub.fetch(`) are not outbound fetches; the
// stub calls are charged explicitly via charge().
const ALLOWED_FILES = new Set(["net.ts"]);
const BARE_FETCH = /(?<![.\w])fetch\s*\(/;
const HANDLER_DEF = /^\s*(async\s+)?fetch\s*\(/;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) return walk(abs);
    return abs.endsWith(".ts") ? [abs] : [];
  });
}

const offences = [];
for (const file of walk(srcDir)) {
  const rel = path.relative(srcDir, file);
  if (ALLOWED_FILES.has(rel) || rel.startsWith("generated/")) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "");
    if (!BARE_FETCH.test(code)) return;
    if (HANDLER_DEF.test(code)) return; // `async fetch(request: Request)` handler
    offences.push(`  src/${rel}:${i + 1}: ${line.trim()}`);
  });
}

if (offences.length) {
  console.error(
    "[check-fetch] bare fetch( outside src/net.ts — these calls are invisible to the\n" +
      "subrequest meter, so the budget gate would under-count and the invocation can\n" +
      "die mid-turn with no reply. Import countedFetch from net.ts instead:\n" +
      offences.join("\n"),
  );
  process.exit(1);
}

console.log("[check-fetch] ok — all outbound calls route through countedFetch");
