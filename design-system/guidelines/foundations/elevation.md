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
| `--elevation-light-3` | Floating layers without a scrim |
| `--elevation-light-4` | Modals |
| `--elevation-light-5` | Dialogs |

## Shadow Values

```css
--elevation-light-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
--elevation-light-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
--elevation-light-3: 0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15);
--elevation-light-4: 0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15);
--elevation-light-5: 0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15);
```

## Usage

A floating layer and a card name the surface role, which pairs the fill with
its shadow (`design-system/src/tokens/_elevation.scss`). A modal names its level
directly, because no role carries Light/4.

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
  background-color: var(--surface-overlay);
  box-shadow: var(--surface-overlay-shadow); /* Light/3 */
}

.my-modal {
  background-color: var(--surface-overlay);
  box-shadow: var(--elevation-light-4);
}
```

## Elevation Hierarchy

| Component Type | Recommended Elevation |
|----------------|----------------------|
| Cards at rest | none: a 1px outline-variant border |
| Clickable cards on hover or drag | `--elevation-light-2` |
| Menus, dropdowns, popovers, tooltips, toasts, listboxes | `--elevation-light-3` |
| Modals | `--elevation-light-4` |
| Dialogs | `--elevation-light-5` |

Every floating layer without a scrim takes Light/3: menus and dropdowns,
Popover, Tooltip, Toast and Flag, and Listbox. A modal sits on the white overlay
fill (`--surface-overlay`) over a scrim, with Light/4.

## Rules

1. **Use sparingly** - Elevation should create meaningful hierarchy
2. **Match to context** - Higher elevation for more important overlays
3. **Never hardcode shadows** - Always use elevation tokens
