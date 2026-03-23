---
name: maintaining
description: >
  Update, fix, or sync the design system itself.
  Use for "Update", "Fix", "Sync", existing code modifications, token updates, bug fixes.
---

# Maintaining

Update the design system — fix bugs, sync tokens, update components, maintain docs.

## Prerequisites

- `docs/design-system/modes/maintaining.md` — maintaining workflow
- `docs/design-system/maintenance/runbook.md` — maintenance procedures
- `docs/design-system/maintenance/sync-checklist.md` — token sync verification
- `docs/design-system/maintenance/scripts.md` — available scripts

## Scope

This skill covers changes to the design system itself (`design-system/src/`), NOT product features or prototypes. Use for:
- Component bug fixes
- Token sync and generation
- Style updates
- Storybook story updates
- DS documentation updates
- Agent doc maintenance (`.agent/` files)

## Workflow

1. **Understand the issue** — what's broken or needs updating?
2. **Read the source** — component source, styles, stories
3. **Fix or update** — follow existing patterns exactly
4. **Token workflow** — if touching tokens: `npm run sync:tokens` → `npm run generate:tokens`
5. **Validate in Storybook** — `npm run storybook` and check affected stories
6. **Update docs if needed** — STRUCTURE.md, component docs, cheat sheets

## Rules

- Always read component source + story + styles before modifying
- Run `npm run generate:tokens` after any token source changes
- Validate in Storybook after component behavior changes
- Update `.agent/assets/PLUS_CHEAT_SHEET.md` if component API changes
