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
| `--ds-shadow-raised` | Subtle lift; clickable cards on hover or drag |
| `--elevation-light-4` | Legacy, unused |
| `--elevation-light-5` | Dialogs |
| `--ds-surface-overlay` + `--ds-shadow-overlay` | Modals, menus, listboxes, popups, tooltips, flags and the floating sidebar: `elevation.surface.overlay` + `elevation.shadow.overlay` |

## Shadow Values

The raised and overlay shadows are the generated `elevation.shadow.*` tokens,
which change with the color mode. They replaced levels 1-3: levels 1-2 became
`--ds-shadow-raised` and level 3 became `--ds-shadow-overlay`. Levels 4 and 5
keep their own values; no modal uses them, since modals take the overlay pair
like every other floating layer.

```css
--elevation-light-4: 0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15);
--elevation-light-5: 0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15);
```

## Usage

A card names the raised surface role with the raised shadow
(`design-system/src/tokens/_elevation.scss`). A layer on the new color tokens
(a modal, menu, popup, tooltip or flag) names the overlay pair directly:
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
  box-shadow: var(--ds-shadow-raised);
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
| Clickable cards on hover or drag | `--ds-shadow-raised` |
| Modals, menus, dropdowns, listboxes, popups, tooltips, flags, the floating sidebar | `--ds-surface-overlay` + `--ds-shadow-overlay` |
| Dialogs | `--elevation-light-5` |

Every floating layer takes the overlay pair, `elevation.surface.overlay` with
`elevation.shadow.overlay`: menus and dropdowns, Listbox, Popup, Tooltip,
Flag, the Frame's floating sidebar, and modals. A modal is set apart from a menu by the blanket under it
(`--ds-blanket`), not by a heavier shadow.

## Rules

1. **Use sparingly** - Elevation should create meaningful hierarchy
2. **Match to context** - Higher elevation for more important overlays
3. **Never hardcode shadows** - Always use elevation tokens


## Foundation rules

- Five levels: sunken (the frame), default (the page), raised (cards), overlay (menus, popups, flags, the open sidebar, modals, dragged cards) and overflow (a shadow only). A surface lifts by its shadow, never by a darker fill.
- A card rests on the raised pair with no border; a clickable card lifts to the overlay shadow on hover and settles back on press.
- The tooltip is the one floating layer off the overlay pair: `--ds-background-neutral-bold` with `--ds-text-inverse`.
- Layers stack by the `--layout-z-index-*` tokens, never by a raw number.
- Raise one focal point; group related overlay actions in one toolbar.

