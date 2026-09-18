// A RATCHET over the Worker's own source: `MODEL_PROVIDER` is read in exactly
// one place (#605).
//
// The claim is old — `run-agent.ts`'s `selectProvider` has carried the comment
// "the ONE place `MODEL_PROVIDER` is read" since #497, and CONTEXT.md §
// ModelProvider says the same — and it was false for as long as it stood:
// `agent/draft-judge.ts` read the var too and picked its own model and thinking
// level behind it. Two readers is not a style problem. It is two answers to
// "which model answered this request", and the second one was assembling a
// model-plus-level pair that matched no tier (ADR-028).
//
// So the claim gets a test rather than a comment. Prose cannot fail; this can.
// A new reader — a probe, a second judge, a classifier — either goes through
// `selectProvider` or turns this red and argues its case here.
//
// It scans TEXT rather than types on purpose: what a reader looks like is
// `env.MODEL_PROVIDER`, and no compiler check distinguishes that from any other
// field read. The DECLARATION in `types.ts` and the many mentions in prose,
// docs and the bundled harness are not reads and are not counted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

/** Every .ts file under src/, relative to src/. */
function sources(dir = SRC, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...sources(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith(".ts")) out.push(rel);
  }
  return out;
}

// `env.MODEL_PROVIDER` / `env?.MODEL_PROVIDER` — a READ off the environment.
// Not `MODEL_PROVIDER?: string` (the declaration) and not the word in a comment.
const READ = /\benv\s*\??\s*\.\s*MODEL_PROVIDER\b/;
const EVERY_READ = new RegExp(READ.source, "g");

test("MODEL_PROVIDER is read in exactly one place — run-agent.ts's selectProvider", () => {
  const readers = sources().filter((rel) => READ.test(readFileSync(path.join(SRC, rel), "utf8")));
  assert.deepEqual(
    readers,
    ["agent/run-agent.ts"],
    "every caller that wants a model takes the one `selectProvider(env)` returns — see the draft " +
      "judge, which takes a ModelProvider rather than an Env (#605)",
  );
});

test("the one reader is inside selectProvider, which every caller goes through", () => {
  const src = readFileSync(path.join(SRC, "agent", "run-agent.ts"), "utf8");
  // Exported, so the draft judge's supplier (turn/env-deps.ts) can reach it
  // rather than re-deriving the choice from the same var.
  assert.match(src, /export function selectProvider\(env: Env\): ModelProvider \{/);
  const body = src.slice(src.indexOf("export function selectProvider"));
  const reads = [...src.matchAll(EVERY_READ)].length;
  assert.equal(reads, 1, "one read, and it is the selection's own");
  assert.match(body.slice(0, body.indexOf("\n}")), READ);
});
