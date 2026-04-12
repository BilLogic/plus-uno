<!-- Tier: 2 -->
# Tokens — Overview & Decision Tree

## Non-Negotiable Rules

- Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
- Choose semantic layer first (element/card/section/modal/table), then pick token.
- Use primitives only for token-definition work, not feature implementation.

## Semantic Layer Decision Tree

| Context | Layer | Token prefix |
|---------|-------|--------------|
| Atomic interactive control (button, input, badge) | **element** | `--size-element-*` |
| Bounded content container (info card, data card) | **card** | `--size-card-*` |
| Page region or column (sidebar, main content) | **section** | `--size-section-*` |
| Tabular data (rows, cells, headers) | **table** | `--size-table-*` |
| Overlay or dialog (confirmation, detail panel) | **modal** | `--size-modal-*` |

## Token References

- [Color](../styles/color.md) — Color roles, SMART framework, surfaces, state layers
- [Spacing](../styles/spacing.md) — Spacing hierarchy, element/card/section/modal/table tokens
- [Typography](../styles/typography.md) — Font families, weights, classes, sizing
- [Elevation](../styles/elevation.md) — Shadow depth tokens
