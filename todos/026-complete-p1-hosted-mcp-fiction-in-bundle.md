---
status: pending
priority: p1
issue_id: 026
tags: [code-review, harness, prompt-quality]
dependencies: []
---

# The bundle describes hosted MCP connectors the Worker does not have

## Problem Statement

Both agent lanes log `mcp=off` and the Worker has 18 local tools, no MCP. The prompt tells the bot otherwise in five places, including one that names three source files that do not exist. The bot is routed to prefer tools it cannot call, with its real tools cast as "fallback".

## Findings

- `docs/conventions/notion.md:12` (bundled, 731 chars) — "Hosted Notion MCP — READS only… `mcp_toolset` allowlist (`agents/uno-bot/src/agent/mcp.ts`)… OAuth 2.1 (`src/oauth/notion.ts`)". Verified: `src/agent/mcp.ts` MISSING; `src/oauth/notion.ts` MISSING (`src/oauth/` holds `mcp-oauth.ts`, `slack.ts`); `/oauth/notion/start` not routed in `src/index.ts`; zero `mcp_toolset` hits in `src/`.
- Same paragraph: "Slack = reads + messaging writes direct via MCP". The bot's only Slack writes are `slack_react` and `shareout_post`.
- `AGENT.md:46` and `:101` — "hosted GitHub MCP preferred, `github_read` fallback". No GitHub MCP. `src/tools/github-read.ts:14` says it "replaces the hosted GitHub MCP's code search".
- `AGENT.md:126` — "Slack MCP emoji search" before choosing a reaction. No emoji tool exists in the 18.
- `AGENT.md:93` — routes to `notion-fetch`, an MCP tool name.
- All of this contradicts `AGENT.md:142` in the same prompt: "both lanes run the SAME local tool roster (no hosted MCP)".

## Proposed Solutions

1. Delete the hosted-MCP paragraph from notion.md; rewrite the four AGENT.md references to name the real tool with no "preferred/fallback" framing. Small, no risk — highest value per char in the bundle.
2. As above plus a check script asserting every tool name in bundled markdown exists in `tool-definitions.json`. Medium; catches the next instance automatically.

## Acceptance Criteria

- [ ] No bundled text names an MCP server or a tool absent from `tool-definitions.json`
- [ ] `AGENT.md:142`'s "no hosted MCP" statement has no contradictions in the bundle
- [ ] Broken source paths in notion.md:12 gone

## Work Log

- 2026-07-30: Found by all four review agents independently; file absence verified by ls.
