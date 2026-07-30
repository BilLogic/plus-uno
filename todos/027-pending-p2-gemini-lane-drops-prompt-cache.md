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
