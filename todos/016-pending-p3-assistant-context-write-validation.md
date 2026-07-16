---
status: pending
priority: p3
issue_id: 016
tags: [code-review, security]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (assistant panel + App Home diff)
---

# Whitelist-validate assistant context at the DO write, not just the prompt read

## Problem
`putAssistantContext` (thread-state.ts) stores `context` verbatim as unbounded `unknown`. The read side is now inert (formatAssistantContext regex-validates channel_id before it reaches the system prompt, 2026-07-16), but the write side still accepts any shape/size, and `assistantContextKey` joins channel:thread with an unescaped `:` (aliasing possible, consistent with the file's other keys; DO ingress is stub-only today).

## Proposed solution
At write time, extract only `{channel_id, team_id, enterprise_id}` as ID-regex-validated strings, reject anything else, cap body size. Makes prompt-injection via a polluted record structurally impossible instead of caller-dependent.

## Acceptance
- [ ] Oversized / mis-shaped context bodies rejected with 400; stored records always match the whitelist shape; tsc clean
