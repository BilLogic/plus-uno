# Design Tool and Integration Links

This repo integrates design data primarily through Figma workflows.

## Critical MCP Integrations

- Figma MCP (critical): use for design-context extraction when implementation starts from design artifacts.
- Stitch MCP (critical): use for brief/PRD-to-wireframe generation in consulting and iteration workflows.
- If either MCP is unavailable in the current runtime, continue with repository docs/stories/specs and explicitly note the limitation.

## Figma Workflow Documentation

- `packages/plus-ds/guidelines/guides/figma-workflow.md`

Key points:
- Fetch design context and screenshot before implementation from design links.
- Sync tokens via API scripts when maintaining DS tokens.

## Figma Script Entry Points

- `scripts/sync-figma-tokens.js`
- `scripts/list-figma-components.js`
- `scripts/inspect_nodes.js`
- `scripts/debug_token_values.js`

## Environment Setup

- `.env.example`
- Required env vars:
  - `FIGMA_FILE_KEY`
  - `FIGMA_ACCESS_TOKEN`

## Storybook (Design Review Surface)

- Command: `npm run storybook`
- Config: `.storybook/main.js`, `.storybook/preview.jsx`

## CI Automation

- Token sync workflow: `.github/workflows/sync-figma-tokens.yml`

## Notes on Other Integrations

- Code Connect is mentioned in workflow guidance but no dedicated mapping registry is committed in this repo.
- Stitch MCP is runtime-dependent and may not be configured in all agent environments.
