---
status: pending
priority: p2
issue_id: 005
tags: [code-review, architecture]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Extract agent/loop-shared.ts — kill the lane import cycle and 6 drift-prone duplicates

## Problem
run-agent.ts ↔ gemini-agent.ts import each other (contract types + executeReadOnlyTool live in the Anthropic lane); MAX_ITERATIONS/MAX_TOKENS/READONLY_TOOL_BUDGET, the budget-exhausted note string, the emitInterim filter, the synthesis fallback, and proposal_resolve validation are copy-pasted between lanes and will drift silently (the Gemini copies already lack the tuning rationale comments).

## Proposed solution
New agent/loop-shared.ts exporting: AgentInput/AgentResult/AgentImage types, executeReadOnlyTool, the caps + budget-note constants, makeInterimEmitter(), resolve-validation helpers. Tiny agent/index.ts owns the MODEL_PROVIDER dispatch; both lanes become leaves. Fold finding 003's helper here too. ~100 lines net deleted, no behavior change.

## Acceptance
- [ ] No import from gemini-agent.ts back into run-agent.ts (or vice versa); tsc clean; caps changed in ONE place reach both lanes.
