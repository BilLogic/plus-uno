# Skill and Design-System Maintenance Runbook

This runbook keeps agent guidance aligned with actual code.

## Goals

- Keep `.agent` guidance synchronized with DS source, tokens, and scripts.
- Catch stale paths or outdated examples early.
- Document when to run existing automation.

## Core Maintenance Cycle

1. Verify token pipeline health
- Confirm `.env` contains Figma keys when token sync is needed.
- Run `npm run sync:tokens` (if pulling from Figma).
- Run `npm run generate:tokens`.
- Inspect diffs in `packages/plus-ds/src/tokens/*.scss`.

2. Verify component discovery paths
- Spot-check exports in:
  - `packages/plus-ds/src/index.js`
  - `packages/plus-ds/src/components/index.js`
  - `packages/plus-ds/src/forms/index.js`
- Confirm referenced components still exist.

3. Verify Storybook coverage
- Run `npm run storybook`.
- Confirm stories resolve under paths configured in `.storybook/main.js`.

4. Verify agent docs still map to reality
- Check `.agent/SKILL.md` mode routing.
- Check all files in `.agent/references`, `.agent/assets`, `.agent/scripts` for broken paths.

## Trigger Conditions for Updating Agent Docs

Update `.agent` files when any of these change:
- Token naming/structure
- Component export barrels
- Storybook story location conventions
- Figma sync workflows/scripts
- High-level DS structure (components/forms/specs)

## Recommended Validation Commands

- `rg --files .agent`
- `rg -n "packages/plus-ds|playground|.storybook|scripts/" .agent`
- `.agent/scripts/validate-doc-links.sh`
- `npm run storybook` (manual verification)
- `npm run sync:tokens && npm run generate:tokens` (when token sync is in scope)

## Notes

- Many scripts in `scripts/` are one-off migration/debug tools. Prefer the package scripts in `package.json` for recurring workflows.
- Keep docs explicit that Figma MCP and Stitch MCP are critical when available in runtime, with documented fallback behavior when unavailable.
