<!-- Tier: 2 -->
<!-- ~150 tokens | Load for: deciding which tool/integration path to use -->

# Integrations Index

One row per connected tool: where its conventions live, what touches it. Concrete scripts/env vars: `skills/uno-prototype/references/integrations-index.json`.

| Tool | Conventions | Primary access | Written by |
|---|---|---|---|
| Notion | `docs/conventions/notion.md` | Notion MCP / API | `writers/notion` only |
| Figma | `docs/conventions/figma-workspace.md` (workspace) · `skills/uno-prototype/references/figma-mcp-guide.md` (MCP pipeline) | Figma MCP (`get_design_context`, `get_screenshot`, `get_variable_defs`, `search_design_system`) | `writers/figma` only |
| Slack | `docs/conventions/slack.md` | uno-bot Worker | the uno-bot embodiment |
| Supabase (`uno-blueprint`) | `docs/conventions/supabase.md` | `blueprint_search` / PostgREST | `writers/blueprint` only |
| Storybook (`uno-storybook`) | source of truth in `design-system/` stories; setup `.storybook/main.js` | read directly | skills (component work) |
| Netlify | deploy notes: `docs/context/product/plus-uno.md` + `skills/uno-publish/references/deployment-guide.md` | `netlify.toml` | uno-publish |
| Loom | share-out role: `docs/conventions/slack.md` (bundle) | manual recording; URL in bundle | humans |
| Stitch MCP | wireframe generation for exploration | MCP | — |
| Playwright MCP | external-site capture ("HTML to Design"), browser e2e | global `.claude.json` | — |

If a runtime lacks an MCP, state the limitation explicitly and continue with repo-native stories/specs/scripts.
