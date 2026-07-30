---
status: pending
priority: p2
issue_id: 052
tags: [code-review, harness, worker, product-decision]
dependencies: []
---

# The Worker prompt says both "no PRD exceptions" and "mid-fi PRD optional"

Same bundle, ~180 lines apart:
- `skills/uno-prototype/references/method.md:15-16` (§0): "No PRD → do not enter this skill… there are no exceptions and no 'idea-only' bypass."
- `skills/uno-prototype/bot.md:16`: "PRD requirement splits by fidelity — confirm fidelity FIRST… mid-fi draft → PRD optional (offer to skip it…)".

The bot face predates today's §0 hardening and may be an INTENDED Slack carve-out (quick mid-fi draft from a pasted frame without ceremony). But as written the model holds two opposite instructions on the same fact.

## Proposed Solutions
1. If the Slack carve-out is intended (likely — it matches the bot's lighter surface): method.md §0 gains one sentence — "Exception: the Slack face may offer a PRD-less mid-fi draft (bot.md owns that rule)" — and bot.md cites §0 for everything else. Small; needs Bill's confirmation of intent.
2. If not intended: bot.md:16 aligns to §0. Small; changes live bot behavior.
