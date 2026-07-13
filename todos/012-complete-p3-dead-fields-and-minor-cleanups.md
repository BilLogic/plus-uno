---
status: pending
priority: p3
issue_id: 012
tags: [code-review, quality]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Minor dead code: unread proposal fields, gemini client dedup, github _list param

## Items
1. PendingProposal.assistantContent + toolUseId: persisted, never read (the resume path never shipped); the Gemini lane needs a type-lie cast to feed it. Drop both fields + casts (thread-state-client.ts:13-17, events.ts:583, gemini-agent.ts:267).
2. SlackEventFile.id declared, never read (events.ts:25).
3. geminiGenerate re-implements geminiEndpoint's URL/auth logic (gemini/client.ts:48-70 vs 116-136) — call the helper.
4. githubReadPath's unused _list param + tools/github-read.ts still parsing input.list — drop both.

## Acceptance
- [ ] tsc clean; proposal save/confirm round-trip verified in sandbox after deploy.
