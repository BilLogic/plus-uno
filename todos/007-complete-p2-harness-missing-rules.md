---
status: pending
priority: p2
issue_id: 007
tags: [code-review, harness]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Harness gaps: multi-user proposals, notion_update governance, global thread window

## Problems (from the harness review)
1. Nothing governs a multi-user thread where user B amends user A's in-flight ask pre-proposal — add to AGENT.md § Proposal gate: the proposal binds to the original asker; third-party amendments are surfaced to the requester, not silently folded in.
2. notion_update has a dispatch-table row but no governing rules (allowed fields, status-move policy, exact-match selects) — add a bullet to uno-maintain's bot face.
3. The ~50-message thread window is specified only in uno-synthesize/uno-publish; make it a global limit in AGENT.md § My lane, skills keep only their consequence.

## Acceptance
- [ ] Each gap has exactly one canonical statement; no duplication introduced.
