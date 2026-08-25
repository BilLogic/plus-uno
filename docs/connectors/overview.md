---
embodiment: ide
summary: One row per connected tool: where its conventions live, what touches it
---

# Integrations Index

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand, ~150 tokens) · distilled 2026-07-07 · load when deciding which tool or integration path to use. -->

One row per connected tool: where its conventions live, what touches it. Concrete sync scripts/env vars for the Figma pipeline: `design-system/guidelines/figma/overview.md` § Quick commands.

| Tool | Conventions | Primary access | Written by |
|---|---|---|---|
| Notion | `docs/connectors/notion.md` | MCP: `notion-plus` · `notion-parsnip` · `notion-personal` | `writers/notion` only |
| Figma | `docs/connectors/figma.md` (workspace) · `design-system/guidelines/figma/mcp-guide.md` (MCP pipeline) | MCP: `figma-plus` · `figma-parsnip` (+ Cursor Figma plugin / Dev Mode) | `writers/figma` only |
| Slack | `docs/connectors/slack.md` | IDE MCP: `slack-plus` · `slack-parsnip` (separate OAuth each); bot: uno-bot Worker | the uno-bot embodiment |
| Supabase (`uno-blueprint`) | `docs/connectors/supabase/overview.md` | `search_blueprint` / PostgREST | `writers/blueprint` only |
| Storybook (`uno-storybook`) | source of truth in `design-system/` stories; setup `.storybook/main.js` | MCP `storybook` at `http://localhost:4200/mcp` while `npm run storybook` runs | skills (component work) |
| Netlify | deploy notes: `docs/product-and-service/plus-uno.md` + `skills/uno-publish/references/deployment-guide.md` | MCP `netlify` · `netlify.toml` | uno-publish |
| Cloudflare | — | MCP `cloudflare` (`https://mcp.cloudflare.com/mcp`, OAuth) | maintain / deploy |
| GitHub | — | MCP `github` | skills / maintain |
| Amplitude | — | MCP `Amplitude` (OAuth) | research |
| NotebookLM | — | MCP `notebooklm` | research |
| Loom | share-out role: `docs/connectors/slack.md` (bundle) | manual recording; URL in bundle | humans |
| Stitch MCP | wireframe generation for exploration | MCP | — |
| Playwright MCP | external-site capture ("HTML to Design"), browser e2e | global `.claude.json` | — |

**Slack dual-workspace:** the official Slack MCP plugin is single-workspace. Named HTTP entries (`slack-plus`, `slack-parsnip`) share `https://mcp.slack.com/mcp` but keep separate OAuth sessions — authenticate each and pick the matching workspace in the browser popup.

If a runtime lacks an MCP, state the limitation explicitly and continue with repo-native stories/specs/scripts.
