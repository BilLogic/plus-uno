<!-- Tier: 2 -->
<!-- ~120 tokens | Load for: deciding which MCP or integration path to use -->

# Integrations Guide

## When to Load
- Load this when deciding which integration/tool path to use.
- For concrete scripts/env vars/commands/calls, load `.agent/skills/uno-prototype/references/integrations-index.json` and `.agent/skills/uno-prototype/references/tokens-index.json`.

## Integration Routing Rules
- **Figma MCP**: primary for design-tool-driven implementation. Full tool reference: `.agent/skills/uno-prototype/references/figma-mcp-guide.md`. Key tools: `get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`, `search_design_system`, `create_design_system_rules`, `create_new_file` (canvas write-back).
- **Stitch MCP**: primary for consulting/iteration wireframe generation.
- If runtime lacks an MCP, explicitly state the limitation and continue with repo-native stories/specs/scripts.

## Canonical Repo Docs
- Figma workflow: `.agent/skills/uno-prototype/references/figma-workflow.md`
- Storybook setup: `.storybook/main.js`, `.storybook/preview.jsx`
- Token sync CI: `.github/workflows/sync-figma-tokens.yml`
- Playwright MCP: Global configuration in `.claude.json`

## Playwright MCP Integration
- **Use for:** Capturing external websites to Figma (via "HTML to Design" workflow) or running browser-based end-to-end tests.
- **Installation:** Pre-configured in global `.claude.json`.
- **Key capability:** Allows the agent to control a browser instance to interact with pages the agent cannot directly access or modify (e.g., third-party sites).
- **Figma Workflow:** Required by the `generate_figma_design` tool when targeting external URLs.
