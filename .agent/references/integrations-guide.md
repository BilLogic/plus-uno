<!-- ~120 tokens | Load for: deciding which MCP or integration path to use -->

# Integrations Guide

## When to Load
- Load this when deciding which integration/tool path to use.
- For concrete scripts/env vars/commands/calls, load `.agent/assets/integrations-index.json` and `.agent/assets/tokens-index.json`.

## Integration Routing Rules
- Figma MCP: primary for design-tool-driven implementation (context + screenshot + mapping/variables).
- Stitch MCP: primary for consulting/iteration wireframe generation.
- If runtime lacks an MCP, explicitly state the limitation and continue with repo-native stories/specs/scripts.

## Canonical Repo Docs
- Figma workflow: `packages/plus-ds/guidelines/guides/figma-workflow.md`
- Storybook setup: `.storybook/main.js`, `.storybook/preview.jsx`
- Token sync CI: `.github/workflows/sync-figma-tokens.yml`
