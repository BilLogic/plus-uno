---
status: pending
priority: p3
issue_id: 015
tags: [code-review, architecture, budget]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (assistant panel + App Home diff)
---

# Detect the assistant surface deterministically instead of the D-prefix + thread_ts heuristic

## Problem
`isAssistantThread` (slack/assistant.ts) collapses "is a DM" and "is an assistant-panel thread" into `channel.startsWith("D")`. The 2026-07-16 review pass narrowed the damage (status set/clear and context load now also require `event.thread_ts`, so plain top-level DMs skip the doomed calls), but a threaded non-panel DM still fires `assistant.threads.setStatus` calls that fail with a warn, and the haiku lane still pays one wasted clear per panel turn. The gate also silently depends on the Slack app's Agent toggle being on.

## Proposed solution
The authoritative signal already exists: an `actx:` record (or the assistant thread itself) only exists if `assistant_thread_started` fired. Load context first and gate status affordances on having actually seen the panel; track a `statusSet` boolean through handleUserMessage → onMessage so the finally-clear only fires when a status was set.

## Acceptance
- [ ] No assistant.threads.* calls on non-panel DM turns; no clear when nothing was set
- [ ] Panel loader still sets/clears correctly incl. on throw; tsc clean
