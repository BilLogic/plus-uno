---
summary: Tokens — Overview & Decision Tree
---

<!-- Tier: 2 -->
# Tokens — Overview & Decision Tree

## Non-Negotiable Rules

- Color, spacing, typography, radius and elevation come from compile-ready tokens (e.g. `var(--color-on-surface)`) — not raw values, and not Figma literal names.
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
| Modal (confirmation, detail panel) | **modal** | `--size-modal-*` |
| Page frame: topbar, sidebar, grid, content width, modal width | **layout** | `--layout-*` (per breakpoint) |
| The Frame around the content box, and the rounded Page inside it | **Frame**, **Page** | `--frame-*`, `--page-pad`, `--page-stack-*`, `--page-radius` |
| The Blanket: the full-screen layer under a modal | **Blanket** | `--overlay-*` |
| Floating layer with no Blanket (menu, popup, tooltip, flag) | **Popup** | `--popover-*` |
| A value one component needs that no shared role covers (a size-20 Tile's radius 5) | **component-scoped**, used only inside that component | `--tile-*` |

The frame and layer tokens (`_frame_layers.scss`) carry the spec's `Collection/property-variant` names with no family prefix: `--card-stack-sm`, `--modal-radius`, `--section-stack-md`. They sit beside the older `--size-*` names of the same layers while uses move to them pattern by pattern.

## Token References

- [Color](color.md) — Color roles, SMART framework, surfaces, interaction states
- [Spacing](spacing.md) — Spacing hierarchy, element/card/section/modal/table tokens
- [Typography](typography.md) — Font families, weights, classes, sizing
- [Elevation](elevation.md) — Shadow depth tokens


## Reading and binding tokens

- A token's name says how to use it: foundation, property, modifier. In Figma the parts join with slashes (`color/text/subtle`); in code a color token drops its foundation and gains the `ds` prefix (`--ds-text-subtle`), and a pattern token lowercases the collection and joins with dashes (`Card/radius-sm` is `--card-radius-sm`).
- Numeric steps are the rem value × 100: `space-050` is 8, `space-100` is 16, `space-0625` is 10.
- A token is used bare. Never write a fallback: `var(--ds-text)`, not `var(--ds-text, #172b4d)`.
- Choose by meaning, never by a matching value. Never bind a primitive in a component.
- Themes are variable modes: `color / foundations` has Light, Dark, Light IC and Dark IC; `spacing / layout` has 768, 1024 and 1440.

