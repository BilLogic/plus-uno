---
status: pending
priority: p2
issue_id: 006
tags: [code-review, harness]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Split IDE-only content out of the bot's prompt assembly (~1,200 words)

## Problem
The Worker's system prompt carries content it cannot act on: notion.md's Project-hub golden sections (~430w), Enhanced-markdown quirks (~180w), OAuth plumbing narration (~100w); AGENTS.md's npm Commands table (~70w), Progressive-loading table (~230w), and IDE-only forbidden patterns 7-15 (~200w).

## Proposed solutions
1. (Recommended) Marker-based strip: skills.ts assembleSystem() drops sections between <!-- ide-only --> ... <!-- /ide-only --> markers; add markers to AGENTS.md + notion.md. One code change, files stay whole for IDE readers. Effort: Small-Medium (needs Worker deploy).
2. Split files (notion-core.md / notion-authoring.md; AGENTS-core) and repoint SKILL_PATHS. Effort: Medium, more churn.

## Acceptance
- [ ] Assembled bot prompt drops ~1.2k words; IDE-facing files unchanged for IDE readers; harness integrity sweep still passes.
