---
status: pending
priority: p2
issue_id: 014
tags: [code-review, agent-native, tools]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (assistant panel + App Home diff)
---

# Add a channel-history read tool so the panel's natural deictic ask has a lane

## Problem
The assistant panel tells the model which channel the user has open, and the panel's most natural ask — "what's happening in this channel?" — has no serving tool: `slack_thread_read` needs a permalink, `slack_search` is keyword-only. The prompt example was trimmed for now (skills.ts no longer advertises "what's happening here"), but the capability gap remains. The Worker already has the plumbing (`conversationsReplies` in slack/api.ts; conversations.history is the same shape).

## Proposed solution
Read-only `slack_channel_read` tool (conversations.history, most-recent N messages) in tool-definitions.json + AGENT.md dispatch table, with the same privacy pre-clearing rules as `slack_search` (respect SLACK_SEARCH_PRIVATE_ALLOWLIST). Then restore "what's happening here" to the sanctioned deictic examples in skills.ts renderAssistantContextBlock.

## Acceptance
- [ ] Panel ask "what's happening in here?" answers from the open channel's recent messages
- [ ] Private-channel allowlist respected; tsc clean; AGENT.md + tool-definitions.json + skills.ts all updated together
