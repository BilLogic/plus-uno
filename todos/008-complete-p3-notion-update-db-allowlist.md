---
status: cancelled
priority: p3
issue_id: 008
tags: [code-review, security]
dependencies: []
created: 2026-07-12
cancelled: 2026-07-13
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# CANCELLED — notionUpdate Roadmap-DB parent allowlist

## Why cancelled
Intentional design (2026-07-13): `notion_update` may touch **any** page/DB the integration is shared on. Safety is the ✅ proposal gate + requester identity + exact-match selects — not a parent-DB fence. Restricting to Roadmap would block Decisions DB, running notes, and hub appends that the conventions now require.

See `docs/conventions/notion.md` § Write surfaces and `skills/uno-maintain/bot.md` § notion_update governance.
