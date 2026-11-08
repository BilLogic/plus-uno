---
summary: Tokens — Overview & Decision Tree
---

<!-- Tier: 2 -->
# Tokens — Overview & Decision Tree

## Non-Negotiable Rules

- Color, spacing, typography, radius and elevation come from compile-ready tokens (e.g. `var(--ds-text)`) — not raw values, and not Figma literal names.
- Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
- Choose the tier first (component, then pattern, then semantics, then primitives; see the ladder below), then pick token.
- Use primitives only for token-definition work, not feature implementation.

## The four-tier ladder (#1756)

One plan (`scripts/lib/tokens/plan.mjs`'s `TOKEN_LADDER`, ADR-038), most general to most specific. Figma collection on the left, code prefix on the right; every token, by tier, is listed in `architecture/token-tiers-name-map.md`.

| Tier | Figma collection | Holds | Code |
|---|---|---|---|
| Primitives | `spacing / primitives` | Space, Radius, Stroke and Size ladders, ×16 numbering | `--space-*`, `--radius-*`, `--stroke-*`, `--size-*` |
| Semantics | `spacing / semantics` | Pad, Stack, Inline, Radius (the safety net — steps only, no density), Border, Focus, Grid, Screen, Content, Size roles | `--pad-*`, `--stack-*`, `--inline-*`, `--radius-*`, `--border-*`, `--focus-ring-*`, `--grid-*`, `--screen-*`, `--content-*`, `--icon-*` / `--control-*` / etc. |
| Patterns | `spacing / patterns` | Frame (Sidebar), Page, Section, Card, Table, Blanket, Modal, Popover, Drawer, Focused page — density (`default`/`compact`/`spacious`) lives here | `--frame-*`, `--page-*`, `--card-*`, `--modal-*`, `--blanket-*`, … |
| Components | `spacing / components` | A value exactly one component needs that no shared token covers (Button radius, Calendar day sizes, Checkbox/Radio control sizes, Listbox limits, …) — density here too | `--<component>-*`, e.g. `--button-radius-default` |

`layers` (z-index) is its own non-spacing family, code only: `--layer-*` (card, dialog, flag, modal, navigation, popup, blanket, spotlight, tooltip).

**Fallback rule.** Reach for a component token first; if none fits, the pattern collection; failing that, semantics. The test for "is this a pattern token": would the value change if the pattern changed? If yes, it belongs to the pattern (or component); if the value is just a shared step nothing specific owns, it is semantics.

**Current names only.** Outside `specs/` the code reads only the names above, and `npm run check:old-system` keeps it that way.

## Token References

- [Color](../../src/styles/Colors.mdx) — Color roles, SMART framework, surfaces, interaction states
- [Spacing](../../src/styles/Spacing.mdx) — Spacing on the four-tier ladder
- [Typography](typography.md) — Font families, weights, classes, sizing
- [Elevation](../../src/styles/Elevation.mdx) — Shadow depth tokens


## Reading and binding tokens

- A token's name says how to use it: foundation, property, modifier. In Figma the parts join with slashes (`color/text/subtle`); in code a color token drops its foundation and gains the `ds` prefix (`--ds-text-subtle`), and a pattern token lowercases the collection and joins with dashes (`Card/radius-sm` is `--card-radius-sm`).
- Numeric steps are the rem value × 100: `space-050` is 8, `space-100` is 16, `space-0625` is 10.
- A token is used bare. Never write a fallback: `var(--ds-text)`, not `var(--ds-text, #172b4d)`.
- Choose by meaning, never by a matching value. Never bind a primitive in a component. The one exception is the Logo, whose brand artwork reads palette primitives so it looks the same on every surface.
- Themes are variable modes: `color / semantics` (renamed from `color / foundations`) has Light, Dark, Light IC and Dark IC; the breakpoint modes (768, 1024, 1440) now sit on whichever of Semantics or Patterns owns the token, per the four-tier ladder above — `spacing / layout` is dissolved, not a live collection.

