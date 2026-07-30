---
status: complete
priority: p2
issue_id: 067
tags: [code-review, worker, cache]
dependencies: []
---

# Gemini cache: key on content hash, not the hand-bumped BUILD

Three findings from the architecture review of gemini/cache.ts + gemini-agent.ts:

1. CONFIRMED fragility: the cache key includes BUILD (`cache.ts:50-52`), a hand-maintained string. A prompt-only hotfix that forgets the bump serves the OLD harness via cachedContent for up to 50 min — the exact convention-shaped invariant this codebase eliminated in the meter. Fix: hash `stableSystem` (already in hand at the call site) into the key. Small.
2. PLAUSIBLE semantics drift: on cache hit, per-request context (sender, pending proposal) rides as the OLDEST user turn (`contents.unshift`), before all history — different salience than systemInstruction, and two consecutive user turns (strict-alternation risk if Vertex tightens). Consider appending just before the current user turn instead. Small, wants an eval run.
3. CONFIRMED-correct-but-fragile: the fallback `contents.shift()` mirrors the unshift across 43 lines; a future leading-turn insertion silently deletes history. Make the removal self-describing (`if (contents[0]?.parts?.[0]?.text === perRequestSystem)`). Tiny.

Also noted: `figma-poll.ts:437,442` and oauth KV traffic never `charge()` the internal bucket — telemetry-only gap today; matters only if an internal gate ever trusts the count.
