<!-- ~350 tokens | Load for: understanding which repo scripts exist and when to use them -->

# Script Inventory and Usage Guidance

This is a practical inventory of existing repository scripts and when to use them.

## Frequently Used (Operational)

- `scripts/sync-figma-tokens.js`
  - Purpose: Pull token variables from Figma API and update local token-source JSON.
  - Trigger: Design-token maintenance and sync jobs.
  - Entrypoint: `npm run sync:tokens`

- `scripts/generate-all-tokens.js`
  - Purpose: Generate SCSS token files from source JSON.
  - Trigger: After sync or token source edits.
  - Entrypoint: `npm run generate:tokens`

- `scripts/storybook-networkinterfaces-fix.cjs`
  - Purpose: Stabilize Storybook startup in environments where `os.networkInterfaces()` fails.
  - Trigger: Automatically used by `npm run storybook`.

## Figma Automation Pipeline

- `scripts/poll-figma-library.js`
  - Purpose: Poll Figma for component/version changes, diff against snapshot, notify Slack.
  - Entrypoint: `npm run figma:poll` / `npm run figma:poll:init`

- `scripts/fetch-figma-component.js`
  - Purpose: Fetch design context (nodes, screenshots, variables) from Figma REST API for CI.
  - Entrypoint: `npm run figma:fetch-component`

- `scripts/ai-component-sync.js`
  - Purpose: Call Claude API to generate component code changes from Figma design context.
  - Used by: `.github/workflows/figma-component-sync.yml`

- `scripts/notify-slack.js`
  - Purpose: Post design system change notifications to Slack `#ds-sync` via Incoming Webhook.
  - Entrypoint: `npm run notify:slack`

- `scripts/figma-write-back.js`
  - Purpose: Post-merge Figma annotations (dev resources, comments).
  - Entrypoint: `npm run figma:write-back`

- `scripts/publish-code-connect.js`
  - Purpose: Publish Code Connect mappings to Figma Dev Mode.
  - Entrypoint: `npm run figma:publish-code-connect`

See `.agent/skills/uno-compound/references/` for related setup instructions.

## Used by CI

- `.github/workflows/figma-library-poll.yml`
  - Polls Figma every 30 min for component changes.
  - Posts to Slack, creates GitHub Issues, triggers token sync.

- `.github/workflows/sync-figma-tokens.yml`
  - Scheduled daily token sync and generation.
  - Creates PR with token changes and notifies Slack.

- `.github/workflows/figma-component-sync.yml`
  - Triggered by `repository_dispatch` from poll workflow.
  - Fetches Figma design context, runs AI code generation, creates PR.

## Investigative / Migration Utilities (Use Case Dependent)

- `scripts/list-figma-components.js`
- `scripts/inspect_nodes.js`
- `scripts/debug_token_values.js`
- `scripts/verify_breakpoints.js`
- `scripts/compare_codebase_tokens.js`
- `scripts/compare_extracted_tokens.js`
- `scripts/smart_token_compare.js`
- `scripts/restore-tokens.js`
- `scripts/regenerate-colors.js`
- `scripts/convert-tokens.js`
- `scripts/fix_*`, `scripts/update_imports.js`, `scripts/refactor_*`

These scripts may contain older paths or migration assumptions. Review before execution.

## Safe Execution Guidance

1. Prefer package.json scripts first.
2. Read script source before running one-off utilities.
3. Confirm target paths match current repository layout.
4. Run script on a clean branch or with clear diff visibility.
