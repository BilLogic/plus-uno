# PLUS Design Tokens

Reference for semantic tokens. Always use tokens instead of hardcoded values.

## Colors

### Semantic Colors
```css
--color-primary
--color-secondary
--color-tertiary
--color-success
--color-warning
--color-danger
--color-info
```

### Surface Colors
```css
--color-surface
--color-surface-container
--color-surface-variant
--color-on-surface
```

### Neutral Colors
```css
--color-neutral
--color-neutral-variant
```

## Typography

### Font Families
| Family | Usage |
|--------|-------|
| Lato | Headlines (H1-H6) |
| Merriweather Sans | Body text (B1-B3) |
| Open Sans | UI text |
| Source Code Pro | Code blocks |

### Font Sizes
```css
--font-size-h1 through --font-size-h6
--font-size-b1 through --font-size-b3
--font-size-fa-sm, --font-size-fa-md, --font-size-fa-lg  /* Icons */
```

## Spacing

### Element Level
```css
--size-element-pad-x-sm: 8px
--size-element-pad-x-md: 10px
--size-element-pad-x-lg: 16px
--size-element-pad-y-sm: 4px
--size-element-pad-y-md: 6px
--size-element-pad-y-lg: 8px
--size-element-gap-xs: 4px   /* Label-to-input only */
--size-element-gap-sm: 8px
--size-element-gap-md: 10px
```

### Section Level
```css
--size-section-pad-x-md
--size-section-pad-y-md
--size-section-gap-md
--size-section-gap-lg
```

## Border Radius
```css
--size-element-radius-sm: 2px
--size-element-radius-md: 4px
--size-element-radius-lg: 8px
--size-element-radius-full: 999px  /* Pills, badges */
```

## Elevation
```css
--elevation-1  /* Cards */
--elevation-2  /* Dropdowns */
--elevation-3  /* Modals */
```

## Full Reference

For complete token list, see:
- `develop/foundations/colors.md`
- `develop/foundations/typography.md`
- `develop/foundations/layout.md`
