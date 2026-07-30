---
status: pending
priority: p1
issue_id: 025
tags: [code-review, harness, safety, gate]
dependencies: []
---

# Two answers to "who may confirm a proposal" ship in the same system prompt

## Problem Statement

The ✅ gate is the repo's core safety mechanism. The bundled prompt states its authorization rule twice, incompatibly. A model reading both may refuse a valid confirmation or accept one it believes unauthorized — and the docs disagree with the code either way.

## Findings

- `docs/conventions/slack.md:31` (bundled) — "requester-only, 60-min expiry".
- `agents/uno-bot/AGENT.md:116` (bundled) — "anyone in the thread may confirm or cancel, not just the original requester".
- Code is unambiguous: `src/slack/gate.ts:9-10` "the requester lock was removed 2026-07-14", same at `gate.ts:78` and `slack/events.ts:381`. `src/agent/skills.ts:112` injects "anyone in the thread may confirm or cancel" per pending proposal.
- `agents/uno-bot/README.md:35` also says "requester-only confirm".
- The 60-min half of `slack.md:31` is correct (`thread-state.ts:58`), which is what makes the stale half easy to miss.

Related enumeration drift in the same section: `AGENT.md:109` lists six gated tools and omits `notion_update`, which is in `SIDE_EFFECT_TOOLS` (`src/agent/types.ts:42-50`) and is gated in AGENT.md's own dispatch table at `:60`.

## Proposed Solutions

1. Fix `slack.md:31` and `uno-bot/README.md:35` to match the code; add `notion_update` to `AGENT.md:109`. Small, no risk.
2. As above, plus make `SIDE_EFFECT_TOOLS` the single source: have the gate list in AGENT.md name the constant rather than enumerate. Medium — prose can't import, so this means a generation step or a check script.

## Acceptance Criteria

- [ ] One authorization statement across slack.md, AGENT.md, uno-bot/README.md, matching gate.ts
- [ ] Gated-tool list matches `SIDE_EFFECT_TOOLS` exactly
- [ ] ADR-020 (requester-scoped visibility) checked for whether it needs a note about the lock removal

## Work Log

- 2026-07-30: Found by ce:review consistency audit; verified against gate.ts and types.ts.
