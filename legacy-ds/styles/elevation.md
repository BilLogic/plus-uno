# Elevation

## Elevation Light - Material Design 3

Elevation tokens provide box-shadow values for creating depth and hierarchy in the UI.

### Elevation 1
- Token: `--elevation-light-1`
- Value: `0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)`
- Use for: Subtle elevation, cards at rest

### Elevation 2
- Token: `--elevation-light-2`
- Value: `0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)`
- Use for: Slightly raised elements, hover states

### Elevation 3
- Token: `--elevation-light-3`
- Value: `0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)`
- Use for: Modals, dialogs, raised cards

### Elevation 4
- Token: `--elevation-light-4`
- Value: `0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)`
- Use for: Prominent modals, important overlays

### Elevation 5
- Token: `--elevation-light-5`
- Value: `0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)`
- Use for: Maximum elevation, critical dialogs

## Usage Example

```css
.card {
    box-shadow: var(--elevation-light-1);
}

.card:hover {
    box-shadow: var(--elevation-light-2);
}

.modal {
    box-shadow: var(--elevation-light-3);
}
```

## Elevation Principles

1. **Use elevation tokens**: Always use elevation tokens instead of custom box-shadow values
2. **Match elevation to importance**: Use higher elevation for more important/urgent content
3. **Consider context**: Modals typically use elevation 3-5, cards use elevation 1-2

## See Also

- [Overview](overview.md) - Styles overview and navigation
- [Colors](colors.md) - Color tokens and usage

