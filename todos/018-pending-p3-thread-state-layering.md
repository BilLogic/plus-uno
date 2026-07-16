---
status: pending
priority: p3
issue_id: 018
tags: [code-review, architecture]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (assistant panel + App Home diff)
---

# Fix inverted type dependency: thread-state-client imports a Slack wire type

## Problem
`thread-state-client.ts` now imports `AssistantContext` from `./slack/types` — the first slack→state-layer dependency in that direction (type-only, no cycle, but inverted: slack modules import from the state client, not vice versa). The DO itself deliberately stores the record as `unknown`.

## Proposed solution
Declare the persisted payload type where the other DO payload types live (PendingProposal pattern: defined in thread-state-client itself) and have slack/types alias it — or make save/load generic over the payload.

## Acceptance
- [ ] No import from src/slack/ inside thread-state-client.ts; tsc clean
