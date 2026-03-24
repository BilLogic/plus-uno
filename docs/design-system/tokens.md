# Tokens Guide — Index

Load the token type you need:

- [Color Tokens](tokens/tokens-color.md) — Color roles, SMART framework, surfaces, state layers
- [Spacing Tokens](tokens/tokens-spacing.md) — Spacing hierarchy, element/card/section/modal/table tokens
- [Typography Tokens](tokens/tokens-typography.md) — Font families, weights, classes, sizing
- [Elevation Tokens](tokens/tokens-elevation.md) — Shadow depth tokens

## Non-Negotiable Rules
- Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
- Choose semantic layer first (element/card/section/modal/table), then pick token.
- Use primitives only for token-definition work, not feature implementation.

## Semantic Layer Decision Tree

- Atomic interactive control (button, input, badge) → **element** → `--size-element-*`
- Bounded content container (info card, data card) → **card** → `--size-card-*`
- Page region or column (sidebar, main content area) → **section** → `--size-section-*`
- Tabular data (rows, cells, headers) → **table** → `--size-table-*`
- Overlay or dialog (confirmation, detail panel) → **modal** → `--size-modal-*`
