---
status: pending
priority: p2
issue_id: 029
tags: [code-review, harness, correctness]
dependencies: []
---

# Bundled capability lists disagree with the tool schemas

## Problem Statement

Several bundled files enumerate what the bot can do. Each enumeration has drifted from `tool-definitions.json` / `src/`, and each teaches the model to not use a capability it has, or to reach for one it lacks.

## Findings

- `skills/uno-synthesize/bot.md:16` — "`notion_create` files prd|intake only". Real enum: `["prd","intake","decision"]` (`src/tools/notion-create.ts:14`, `tool-definitions.json`). `notion.md:57` documents the `decision` surface. Wrong in the skill that most often files decisions.
- `AGENT.md:109` — gated-tool list omits `notion_update` (in `SIDE_EFFECT_TOOLS`, `src/agent/types.ts:42-50`). Tracked in todo 025.
- "Research & notes DB": `notion.md:29` says findings land on a hub subpage, "not a separate DB, and not a bot surface". Four bundled/skill files instruct writing to it as a DB — `uno-research/SKILL.md:48,59`, `uno-synthesize/SKILL.md:54`, `uno-synthesize/references/method.md:33`, `uno-synthesize/bot.md:16`.
- Marketplace dual-write: `uno-publish/bot.md:21` cites "a dual-write to the JS catalog" as the live reason IDE-only; `uno-publish/SKILL.md:56` says that dual-write is retired.
- Design QA trigger: `uno-review/method.md:17` and `bot.md:16` describe an RTT auto-trigger; `automations.md:26` says it is "❌ not built — no Notion webhook exists" and the status column does not exist yet.
- `docs/conventions/coding.md:59` says register prototypes in `prototypes-data.js`; `uno-publish/SKILL.md:56` says do not add new IDs there.

## Proposed Solutions

1. Fix each statement against code. Small, mechanical, no risk.
2. Add a check script: every tool name and surface enum mentioned in bundled markdown must exist in `tool-definitions.json`. Medium; makes this class build-blocking like check-fetch.

## Acceptance Criteria

- [ ] Every bundled capability claim matches code
- [ ] One statement per capability, others point at it
- [ ] Decided whether the check script is worth it (see todo 030)

## Work Log

- 2026-07-30: Found by consistency + simplicity audits; each enum verified against src/.
