---
status: pending
priority: p2
issue_id: 028
tags: [code-review, harness, prompt-quality]
dependencies: []
---

# ~4.6k chars of IDE-only guidance ship to the Worker outside the ide-only fence

## Problem Statement

The `ide-only` mechanism works and is guarded (`bundle-harness.mjs:84` fails the build on an unbalanced marker). It is simply drawn around the wrong regions: four AGENTS.md sections of identical character to the fenced ones ship whole, and they contradict the persona delta the bot loads right after.

## Findings

Ships but unusable (chars measured post-strip):
- `AGENTS.md:55-63` § Storybook MCP — 1,094. "endpoint at http://localhost:4200/mcp while `npm run storybook` runs… use it as the primary interface to the design system".
- `AGENTS.md:65-73` § Documentation IA contract — 1,500. `node scripts/sync-storybook-sort.mjs`, taxonomy JSON.
- `AGENTS.md:75-82` § Grid & breakpoint contract — 1,694. `_layout.scss`, Figma variable modes.
- `AGENTS.md:51-53` § Knowledge Architecture — 415. `npm run generate:agent`.
- `AGENTS.md:84-102` § Forbidden patterns — 2,919, of which ~1,500 is code-authoring law (never install packages, never deep-import, validate in Storybook). Rules 16–17 are bot-relevant.
- All contradicted by `agents/uno-bot/AGENT.md:85`: "I can't: no filesystem, shell, git, or subagents."

Seams left by the current strip:
- `AGENTS.md:145-148` — the explanatory comment sits after `<!-- /ide-only -->`, so it ships: it tells the bot two sections were removed from its prompt, and names `src/agent/skills.ts stripIdeOnly`, which now lives in `scripts/bundle-harness.mjs:46`. Same stale pointer at `notion.md:92`.
- `blueprint-navigation.md:136` — the bot's copy ends "In-IDE, count it:" with the SQL stripped. Colon promising nothing, at end of file.

## Proposed Solutions

1. Wrap the four sections in `ide-only`, move the orphan comment inside the fence, fix the two seams. Small, no behavior risk — the IDE keeps everything.
2. As above plus splitting the bot-relevant forbidden patterns into their own unfenced block. Medium; needs judgment on which rules a designer might ask the bot about.

## Acceptance Criteria

- [ ] No `npm`/`node`/localhost instruction in the generated harness
- [ ] No dangling colon or orphan cross-reference at a strip seam
- [ ] `stripIdeOnly` pointers name bundle-harness.mjs

## Work Log

- 2026-07-30: Found by simplicity + bundle audits; seams quoted from the generated harness, not inferred.
