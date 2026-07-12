---
status: pending
priority: p3
issue_id: 011
tags: [code-review, quality]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Durable Object event:/hist: keys grow without bound

## Problem
thread-state.ts:191-216 — event-dedup records are written per Slack event with TTL checked only on read; nothing deletes them. Single-instance DO storage grows forever.

## Proposed solution
Periodic alarm() sweep deleting expired event: and stale hist: keys (or delete-on-expired-read as getHistory already does). Careful: AgentRunner DO owns its own alarms — this is the THREAD_STATE DO's alarm, currently unused.

## Acceptance
- [ ] Expired keys measurably removed; dedup semantics unchanged within TTL.
