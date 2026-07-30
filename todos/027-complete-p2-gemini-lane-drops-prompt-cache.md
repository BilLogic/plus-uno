---
status: pending
priority: p2
issue_id: 027
tags: [code-review, cost, worker, performance]
dependencies: []
---

# The production lane discards the 1h prompt cache and re-sends the harness per iteration

## Problem Statement

`skills.ts` attaches `cache_control: {ttl: "1h"}` to the stable system block, with a documented cost argument. The Vertex-Claude lane honors it. The Gemini lane — which is the production default — flattens the blocks to a string and drops the directive. The ~40k-token harness is then rebuilt inside the per-iteration model call, up to `MAX_ITERATIONS = 16` times per user message.

## Findings

- `src/agent/skills.ts:48` sets `cache_control: { type: "ephemeral", ttl: "1h" }`; `:45-47` explains why.
- `src/agent/gemini-agent.ts:206` — `systemBlocks.map(b => b.text).join("\n\n")`, then `:216` `systemInstruction: { parts: [{ text: systemText }] }`. No `cachedContent`, none anywhere in `src/gemini/`.
- `wrangler.toml:140` — `MODEL_PROVIDER = "gemini"`; `run-agent.ts:6` marks it DEFAULT / production.
- `gemini-agent.ts` rebuilds `body` inside `callGemini`, called from the iteration loop.
- Bundle measured at 154,573 chars ≈ 38–43k tokens.

Unverified mitigation: Gemini implicit context caching may discount a byte-stable leading prefix automatically. Nothing in the code requests or measures it, and it would not survive a prefix change.

## Proposed Solutions

1. Measure first — log Gemini `usageMetadata.cachedContentTokenCount` for a few turns and see whether implicit caching is already covering it. Small, and it decides whether anything else is needed.
2. Use Gemini explicit context caching for the stable block. Medium; adds a cache lifecycle to manage and a subrequest to create/refresh it.
3. Leave as-is and document it, if measurement shows implicit caching covers it. Small.

## Acceptance Criteria

- [ ] Actual cached-token behavior on the Gemini lane is measured, not assumed
- [ ] `skills.ts`'s cache comment states which lanes honor it
- [ ] If uncached: a decision recorded either way

## Work Log

- 2026-07-30: Found by ce:review bundle audit; `gemini-agent.ts:206,216` and `wrangler.toml:140` verified directly.

## Work Log (continued)

- 2026-07-30: **Measurement instrumented, decision deferred to data.** `gemini-agent.ts` now reads `usageMetadata.cachedContentTokenCount` and reports it as `cached_in=` on the `[uno-bot]` telemetry line; `skills.ts` states which lane honours `cache_control` so the next reader doesn't assume both do. Nothing else changed: whether to build an explicit `cachedContent` depends on what `cached_in=` shows after a few live turns, and guessing would be the same mistake the subrequest budget already taught. Status moved pending → ready; the remaining work is reading the logs post-deploy.

## Work Log (continued, 2026-07-30 — implemented)

`src/gemini/cache.ts` implements Vertex explicit context caching for the Gemini lane's system prompt, and `gemini-agent.ts` uses it:

- The harness (block 0 of `buildSystemBlocks`) becomes a `cachedContents` resource with a 1h TTL, referenced by name on every `generateContent` call. Per-request blocks (sender, pending proposal) are deliberately excluded — including them would change the cached bytes every turn and guarantee a miss. When a cache is in use they ride as a leading user turn instead, because Vertex rejects a request that sets both `cachedContent` and `systemInstruction`.
- Memoised in isolate scope, backed by `HARNESS_KV`, keyed by `(region, model, BUILD)`. A deploy that changes the harness can never hit a cache built from the old text; a failure is negative-cached for the hour so an unsupported configuration costs one wasted subrequest per hour rather than one per message.
- Every failure path returns null and the prompt goes inline — the previous behaviour byte for byte. A mid-turn fallback to `GEMINI_FALLBACK_MODEL` drops the cache too, since a `cachedContents` resource is bound to the model that created it and carrying the name over would turn a recoverable 429 into a hard 400.
- `GET /debug/gemini-cache` reports which side of this a deployment is on, without a model call.

**It is inert on the current config, and that is a config decision, not a code gap.** `GEMINI_REGION = "global"`, and `cachedContents` is a regional resource — the global endpoint cannot serve one. Setting a region (e.g. `us-central1`) enables it, but that var is shared with the Vertex-Claude lane and regional endpoints differ in model availability, so it needs a smoke test of both `/debug/gemini` and `/debug/vertex-claude`. Documented at the var in `wrangler.toml`; the call is Bill's.

**Verified:** both fallback branches, in workerd — `{"region":"global",…,"reason":"GEMINI_REGION is `global`…"}` and with `--var GEMINI_REGION:us-central1` it passes the region gate and stops at the credential check. The create-and-use path needs live Vertex credentials on a regional endpoint; `cached_in=` on the `[uno-bot]` line and `/debug/gemini-cache` are how it gets confirmed after deploy.
