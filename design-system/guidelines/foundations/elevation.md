---
summary: Elevation creates visual hierarchy through shadows
---

<!-- Tier: 2 -->

# Elevation Tokens

Elevation creates visual hierarchy through shadows.

## Elevation Levels

| Token | Usage |
|-------|-------|
| `--elevation-light-1` | Subtle lift |
| `--elevation-light-2` | Cards, dropdowns |
| `--elevation-light-3` | Popovers, toasts |
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

```css
.my-card {
  box-shadow: var(--elevation-light-2);
}

.my-modal {
  box-shadow: var(--elevation-light-4);
}

.my-dropdown {
  box-shadow: var(--elevation-light-2);
}
```

## Elevation Hierarchy

| Component Type | Recommended Elevation |
|----------------|----------------------|
| Cards | `--elevation-light-2` |
| Dropdowns | `--elevation-light-2` |
| Popovers, toasts | `--elevation-light-3` |
| Modals | `--elevation-light-4` |
| Dialogs | `--elevation-light-5` |

## Rules

1. **Use sparingly** - Elevation should create meaningful hierarchy
2. **Match to context** - Higher elevation for more important overlays
3. **Never hardcode shadows** - Always use elevation tokens
