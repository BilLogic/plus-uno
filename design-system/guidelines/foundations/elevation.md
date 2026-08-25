<!-- Tier: 2 -->

# Elevation Tokens

Elevation creates visual hierarchy through shadows.

## Elevation Levels

| Token | Usage |
|-------|-------|
| `--elevation-none` | No shadow - flat elements |
| `--elevation-sm` | Subtle lift - cards, dropdowns |
| `--elevation-md` | Moderate lift - modals, popovers |
| `--elevation-lg` | High lift - overlay dialogs |

## Shadow Values

```css
--elevation-none: none;
--elevation-sm: 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06);
--elevation-md: 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06);
--elevation-lg: 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.06);
```

## Usage

```css
.my-card {
  box-shadow: var(--elevation-sm);
}

.my-modal {
  box-shadow: var(--elevation-md);
}

.my-dropdown {
  box-shadow: var(--elevation-sm);
}
```

## Elevation Hierarchy

| Component Type | Recommended Elevation |
|----------------|----------------------|
| Flat elements | `none` |
| Cards | `sm` |
| Dropdowns | `sm` |
| Modals | `md` |
| Dialogs | `md` to `lg` |

## Rules

1. **Use sparingly** - Elevation should create meaningful hierarchy
2. **Match to context** - Higher elevation for more important overlays
3. **Never hardcode shadows** - Always use elevation tokens
