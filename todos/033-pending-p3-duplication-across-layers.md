---
status: pending
priority: p3
issue_id: 033
tags: [code-review, harness, duplication]
dependencies: []
---

# Same rule stated in many places; one set already disagrees

## Problem Statement

`agents/README.md:32` states the law — "A rule lives exactly once" — and `loading-order.md:14` claims to hold "the only Tier-2 table; nothing else may duplicate it". Both are false as written. Most duplicates currently agree, which is what makes them cheap to ignore and expensive later; one set has already drifted.

## Findings

Already disagreeing:
- Message-length ceiling, four values in one prompt: `AGENT.md:16` ~1000 chars · `uno-review/bot.md:34` ~1500 · `AGENT.md:135` >3000 · `slack.md:78` ~4000.

Duplicated but currently consistent:
- Seven Tier-2 load tables: `loading-order.md:14`, `AGENTS.md:124`, and one in each of the six `skills/*/SKILL.md`. `uno-prototype/SKILL.md:103` labels itself "(mirrors AGENTS.md § Progressive loading)" — an admitted third copy. `loading-order.md:24` delegates exactly one row (DS agent-views); the other four AGENTS.md rows are straight restatements.
- "Marketplace publishing is not a bot tool" — 16 locations, five of them inside `uno-publish/bot.md` alone, plus two tool schemas.
- "Never invent select options" — 9 locations.
- "Surface conflicts, never blend" — 5 locations.
- `AGENT.md:38-77` dispatch table (~3,241 chars) largely restates `tool-definitions.json` descriptions, which are more specific. Evidence the layer is optional: `slack_user_profile` and `slack_channel_members` are implemented and appear zero times in the 154k prompt — they route on schema alone. The collision traps at `:68-76` are genuinely additive and should stay.

Counter-example done right: the Figma capability boundary — stated once in `AGENT.md § My lane`, pointed at from four files.

## Proposed Solutions

1. Pick one message-length ceiling; delete the six skill-level Tier-2 tables in favor of pointers; collapse the marketplace restatements to one + pointers. Small-medium, ~1.4k chars saved, mostly risk-free.
2. As above plus trimming the AGENT.md dispatch rows that the schemas already carry (~2.1k). Medium risk — gate on an eval run, not on this review.

## Acceptance Criteria

- [ ] One message-length rule
- [ ] `loading-order.md:14`'s exclusivity claim is either true or rewritten
- [ ] Marketplace boundary stated once

## Work Log

- 2026-07-30: Found by simplicity + architecture reviews; duplicate locations enumerated and checked for agreement.
