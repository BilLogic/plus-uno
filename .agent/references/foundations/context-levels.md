# Context Levels Reference

Use context levels to scope component discovery and token selection.

## Level 1: Elements

- Typical location: `packages/plus-ds/src/components/`, `packages/plus-ds/src/forms/`
- Examples: Button, Badge, Input, Select, Switch
- Typical token scope: `--size-element-*`

## Level 2: Cards

- Typical location: `packages/plus-ds/src/specs/*/Cards/`
- Purpose: Grouped content modules
- Typical token scope: `--size-card-*`

## Level 3: Sections

- Typical location: `packages/plus-ds/src/specs/*/Sections/`
- Purpose: Major page regions
- Typical token scope: `--size-section-*`

## Level 4: Tables

- Typical location: `packages/plus-ds/src/specs/*/Tables/`
- Purpose: Tabular data + controls
- Typical token scope: `--size-table-*`

## Level 5: Modals

- Typical location: `packages/plus-ds/src/components/` and `packages/plus-ds/src/specs/*/Modals/`
- Purpose: Focused overlay interactions
- Typical token scope: `--size-modal-*`

## Level 6: Pages/Specs

- Typical location: `packages/plus-ds/src/specs/*/Pages/`
- Purpose: Full compositions with responsive behavior and state orchestration

## Usage Rule

Identify the current context level before picking components or tokens.
