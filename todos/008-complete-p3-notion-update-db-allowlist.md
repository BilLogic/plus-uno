---
status: pending
priority: p3
issue_id: 008
tags: [code-review, security]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# notionUpdate lacks the Roadmap-DB parent allowlist that archiveCard enforces

## Problem
integrations/notion.ts notionUpdate PATCHes properties and appends free-text blocks to ANY page the integration can reach; archiveCard fetches the page first and refuses non-Roadmap parents. Asymmetric scope, gated only by ✅.

## Proposed solution
Reuse archiveCard's parent-check (fetch page, verify parent database_id ∈ allowlist) before update/append; extend the allowlist deliberately if non-Roadmap updates are ever intended.

## Acceptance
- [ ] notion_update against a non-Roadmap page returns a plain refusal before any write.
