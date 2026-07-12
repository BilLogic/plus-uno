---
status: pending
priority: p2
issue_id: 003
tags: [code-review, quality]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# proposal_resolve error paths orphan parallel tool_use blocks → API 400 kills the turn

## Problem
In both provider loops, when proposal_resolve is rejected (no pending / wrong requester / bad decision), the assistant content is pushed back with a tool_result for ONLY the resolve call; any other parallel tool_use in the same response has no matching tool_result, the next API call 400s, and the user gets the generic ❌. run-agent.ts:406-453, gemini-agent.ts:226-251.

## Proposed solution
On the rejected-resolve path, emit an error/"deferred" tool_result for every other tool_use id in the same assistant message, in both loops (share the helper via loop-shared extraction, see 005).

## Acceptance
- [ ] A model response containing proposal_resolve + another tool call no longer 400s on the follow-up request in either lane.
