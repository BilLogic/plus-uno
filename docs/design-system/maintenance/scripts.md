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

## Used by CI

- `.github/workflows/sync-figma-tokens.yml`
  - Scheduled daily token sync and generation.
  - Commits token changes when detected.

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
