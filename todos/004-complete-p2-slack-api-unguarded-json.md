---
status: pending
priority: p2
issue_id: 004
tags: [code-review, quality]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# slackCall/slackGet unguarded res.json() can silently no-op a confirmed ✅

## Problem
src/slack/api.ts:31,49 — a Slack 5xx/HTML response throws out of res.json(); via the uncaught postMessage in agent/resolve-proposal.ts:29 the throw skips executeTool, so a user's ✅ silently does nothing while the proposal stays pending.

## Proposed solution
Wrap fetch+parse in slackCall/slackGet; on failure return { ok:false, error } (every caller already handles ok:false). In resolveProposal, execute the tool regardless of the ack-message outcome.

## Acceptance
- [ ] Simulated Slack 500 on the ack message still executes the confirmed tool and posts the outcome on the next successful call.
