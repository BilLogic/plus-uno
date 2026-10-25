---
summary: Elevation creates visual hierarchy through shadows
---

<!-- Tier: 2 -->

# Elevation Tokens

Elevation creates visual hierarchy through shadows. A surface lifts by its
shadow, not by a different gray: a raised card and an overlay keep the page's
own fill (`color.md` § Surface Colors).

## Elevation Levels

| Token | Usage |
|-------|-------|
| `--elevation-light-1` | Subtle lift |
| `--elevation-light-2` | Clickable cards on hover or drag |
| `--elevation-light-3` | Floating layers still on legacy tokens (listboxes, the floating sidebar) |
| `--elevation-light-4` | Legacy, unused |
| `--elevation-light-5` | Dialogs |
| `--ds-surface-overlay` + `--ds-shadow-overlay` | Modals, menus, popovers, tooltips and toasts: `elevation.surface.overlay` + `elevation.shadow.overlay` |

## Shadow Values

Levels 1-3 now point at the generated `elevation.shadow.*` tokens
(`design-system/src/tokens/color/_legacy-aliases.scss`), which change with the
color mode: levels 1-2 share the raised shadow and level 3 is the overlay
shadow. Levels 4 and 5 keep their own values; no modal uses them, since modals
take the overlay pair like every other floating layer.

```css
--elevation-light-1: var(--ds-shadow-raised);
--elevation-light-2: var(--ds-shadow-raised);
--elevation-light-3: var(--ds-shadow-overlay);
--elevation-light-4: 0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15);
--elevation-light-5: 0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15);
```

## Usage

A card names the surface role, which pairs the fill with its shadow
(`design-system/src/tokens/_elevation.scss`). A layer on the new color tokens
(a modal, menu, popover, tooltip or toast) names the overlay pair directly:
`--ds-surface-overlay` with `--ds-shadow-overlay`, whose 1px ring is the edge,
so it draws no border.

```css
.my-card {
  background-color: var(--surface-raised);
  border: var(--size-card-border-sm) solid var(--color-outline-variant);
  box-shadow: none;
}

.my-card--clickable:hover,
.my-card--dragging {
  box-shadow: var(--surface-raised-shadow); /* Light/2 */
}

.my-menu {
  background-color: var(--ds-surface-overlay);
  box-shadow: var(--ds-shadow-overlay);
}

.my-modal {
  background-color: var(--ds-surface-overlay);
  box-shadow: var(--ds-shadow-overlay); /* the blanket sets it apart, not the shadow */
}
```

## Elevation Hierarchy

| Component Type | Recommended Elevation |
|----------------|----------------------|
| Cards at rest | none: a 1px outline-variant border |
| Clickable cards on hover or drag | `--elevation-light-2` |
| Modals, menus, dropdowns, popovers, tooltips, toasts | `--ds-surface-overlay` + `--ds-shadow-overlay` |
| Listboxes and the floating sidebar, until they move to the new tokens | `--elevation-light-3` |
| Dialogs | `--elevation-light-5` |

Every floating layer takes the overlay pair, `elevation.surface.overlay` with
`elevation.shadow.overlay`: menus and dropdowns, Popover, Tooltip, Toast and
Flag, and modals. A modal is set apart from a menu by the blanket under it
(`--ds-blanket`), not by a heavier shadow.

## Rules

1. **Use sparingly** - Elevation should create meaningful hierarchy
2. **Match to context** - Higher elevation for more important overlays
3. **Never hardcode shadows** - Always use elevation tokens
