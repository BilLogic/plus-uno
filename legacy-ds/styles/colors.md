# Colors

## Material Design 3 Color System

PLUS follows Material Design 3 color guidance: https://m3.material.io/styles/color/roles

All colors follow Material Design 3 roles and are sourced from Figma design system variables.

## Accent Colors

### Primary
- `--color-primary` - #0472a8 (Main primary color - for borders/backgrounds)
- `--color-primary-text` - #00547e (Primary text color - for text)
- `--color-on-primary` - #ffffff (Content color on primary)
- `--color-primary-container` - #61b5cf (Primary container background)
- `--color-on-primary-container` - #001e2e (Content color on primary container)
- `--color-inverse-primary` - #84cfff (Inverse primary color)

**Primary State Layers:**
- `--color-primary-state-08` - rgba(0, 101, 142, 0.08) (8% opacity)
- `--color-primary-state-12` - rgba(0, 101, 142, 0.12) (12% opacity)
- `--color-primary-state-16` - rgba(0, 101, 142, 0.16) (16% opacity)
- `--color-primary-container-state-08` - rgba(199, 231, 255, 0.08)
- `--color-primary-container-state-12` - rgba(199, 231, 255, 0.12)
- `--color-primary-container-state-16` - rgba(199, 231, 255, 0.16)

### Secondary
- `--color-secondary` - #445c6a (Main secondary color - for borders/backgrounds)
- `--color-secondary-text` - #3b525f (Secondary text color - for text)
- `--color-on-secondary` - #ffffff (Content color on secondary)
- `--color-secondary-container` - #5e849b (Secondary container background)
- `--color-on-secondary-container` - #09171f (Content color on secondary container)

**Secondary State Layers:**
- `--color-secondary-state-08` - rgba(68, 92, 106, 0.08)
- `--color-secondary-state-12` - rgba(68, 92, 106, 0.12)
- `--color-secondary-state-16` - rgba(68, 92, 106, 0.16)
- `--color-secondary-container-state-08` - rgba(94, 132, 155, 0.08)
- `--color-secondary-container-state-12` - rgba(94, 132, 155, 0.12)
- `--color-secondary-container-state-16` - rgba(94, 132, 155, 0.16)

### Tertiary
- `--color-tertiary` - #0e8175 (Main tertiary color)
- `--color-tertiary-text` - #005a50 (Tertiary text color - for text)
- `--color-on-tertiary` - #ffffff (Content color on tertiary)
- `--color-tertiary-container` - #85ecd5 (Tertiary container background)
- `--color-on-tertiary-container` - #005a50 (Content color on tertiary container)

**Tertiary State Layers:**
- `--color-tertiary-state-08` - rgba(14, 129, 117, 0.08)
- `--color-tertiary-state-12` - rgba(14, 129, 117, 0.12)
- `--color-tertiary-state-16` - rgba(14, 129, 117, 0.16)
- `--color-tertiary-container-state-08` - rgba(133, 236, 213, 0.08)
- `--color-tertiary-container-state-12` - rgba(133, 236, 213, 0.12)
- `--color-tertiary-container-state-16` - rgba(133, 236, 213, 0.16)

### Danger
- `--color-danger` - #ba1a1a (Main danger color - for borders/backgrounds)
- `--color-danger-text` - #9b0606 (Danger text color - for text)
- `--color-on-danger` - #ffffff (Content color on danger)
- `--color-danger-container` - #ffdad6 (Danger container background)
- `--color-on-danger-container` - #410002 (Content color on danger container)

**Danger State Layers:**
- `--color-danger-state-08` - rgba(190, 12, 22, 0.08)
- `--color-danger-state-12` - rgba(190, 12, 22, 0.12)
- `--color-danger-state-16` - rgba(190, 12, 22, 0.16)
- `--color-danger-container-state-08` - rgba(255, 218, 214, 0.08)
- `--color-danger-container-state-12` - rgba(255, 218, 214, 0.12)
- `--color-danger-container-state-16` - rgba(255, 218, 214, 0.16)

### Success
- `--color-success` - #3e691a (Main success color - for borders/backgrounds)
- `--color-success-text` - #2c5609 (Success text color - for text)
- `--color-on-success` - #ffffff (Content color on success)
- `--color-success-container` - #a1eb83 (Success container background)
- `--color-on-success-container` - #0c2000 (Content color on success container)

**Success State Layers:**
- `--color-success-state-08` - rgba(62, 105, 26, 0.08)
- `--color-success-state-12` - rgba(62, 105, 26, 0.12)
- `--color-success-state-16` - rgba(62, 105, 26, 0.16)
- `--color-success-container-state-08` - rgba(189, 242, 146, 0.08)
- `--color-success-container-state-12` - rgba(189, 242, 146, 0.12)
- `--color-success-container-state-16` - rgba(189, 242, 146, 0.16)

### Warning
- `--color-warning` - #9f8205 (Main warning color - for borders/backgrounds)
- `--color-warning-text` - #5b4a00 (Warning text color - for text)
- `--color-on-warning` - #ffffff (Content color on warning)
- `--color-warning-container` - #ffe17a (Warning container background)
- `--color-on-warning-container` - #231b00 (Content color on warning container)

**Warning State Layers:**
- `--color-warning-state-08` - rgba(113, 92, 0, 0.08)
- `--color-warning-state-12` - rgba(113, 92, 0, 0.12)
- `--color-warning-state-16` - rgba(113, 92, 0, 0.16)
- `--color-warning-container-state-08` - rgba(255, 225, 122, 0.08)
- `--color-warning-container-state-12` - rgba(255, 225, 122, 0.12)
- `--color-warning-container-state-16` - rgba(255, 225, 122, 0.16)

### Info
**Info colors alias to Tertiary** (using `var()` references):
- `--color-info` - var(--color-tertiary)
- `--color-info-text` - var(--color-tertiary-text)
- `--color-on-info` - var(--color-on-tertiary)
- `--color-info-container` - var(--color-tertiary-container)
- `--color-on-info-container` - var(--color-on-tertiary-container)

**Info State Layers** (alias to Tertiary):
- `--color-info-state-08` - var(--color-tertiary-state-08)
- `--color-info-state-12` - var(--color-tertiary-state-12)
- `--color-info-state-16` - var(--color-tertiary-state-16)
- `--color-info-container-state-08` - var(--color-tertiary-container-state-08)
- `--color-info-container-state-12` - var(--color-tertiary-container-state-12)
- `--color-info-container-state-16` - var(--color-tertiary-container-state-16)

## SMART Framework Colors

### Social-Emotional
- `--color-social-emotional` - #8c6600 (Main Social-Emotional color)
- `--color-social-emotional-text` - #674a00 (Social-Emotional text color - for text)
- `--color-on-social-emotional` - #ffffff (Content color on Social-Emotional)
- `--color-social-emotional-container` - #ffdea0 (Social-Emotional container background)
- `--color-on-social-emotional-container` - #5c4300 (Content color on Social-Emotional container)

**Social-Emotional State Layers:**
- `--color-social-emotional-state-08` - rgba(125, 87, 0, 0.08)
- `--color-social-emotional-state-12` - rgba(125, 87, 0, 0.12)
- `--color-social-emotional-state-16` - rgba(125, 87, 0, 0.16)
- `--color-social-emotional-container-state-08` - rgba(255, 222, 170, 0.08)
- `--color-social-emotional-container-state-12` - rgba(255, 222, 170, 0.12)
- `--color-social-emotional-container-state-16` - rgba(255, 222, 170, 0.16)

### Mastering Content
- `--color-mastering-content` - #8659a9 (Main Mastering Content color)
- `--color-mastering-content-text` - #673a8b (Mastering Content text color - for text)
- `--color-on-mastering-content` - #ffffff (Content color on Mastering Content)
- `--color-mastering-content-container` - #f2daff (Mastering Content container background)
- `--color-on-mastering-content-container` - #583a6f (Content color on Mastering Content container)

**Mastering Content State Layers:**
- `--color-mastering-content-state-08` - rgba(127, 63, 177, 0.08)
- `--color-mastering-content-state-12` - rgba(127, 63, 177, 0.12)
- `--color-mastering-content-state-16` - rgba(127, 63, 177, 0.16)
- `--color-mastering-content-container-state-08` - rgba(242, 218, 255, 0.08)
- `--color-mastering-content-container-state-12` - rgba(242, 218, 255, 0.12)
- `--color-mastering-content-container-state-16` - rgba(242, 218, 255, 0.16)

### Advocacy
- `--color-advocacy` - #167745 (Main Advocacy color)
- `--color-advocacy-text` - #00572a (Advocacy text color - for text)
- `--color-on-advocacy` - #ffffff (Content color on Advocacy)
- `--color-advocacy-container` - #b3f1bf (Advocacy container background)
- `--color-on-advocacy-container` - #16512c (Content color on Advocacy container)

**Advocacy State Layers:**
- `--color-advocacy-state-08` - rgba(22, 119, 69, 0.08)
- `--color-advocacy-state-12` - rgba(22, 119, 69, 0.12)
- `--color-advocacy-state-16` - rgba(22, 119, 69, 0.16)
- `--color-advocacy-container-state-08` - rgba(179, 241, 191, 0.08)
- `--color-advocacy-container-state-12` - rgba(179, 241, 191, 0.12)
- `--color-advocacy-container-state-16` - rgba(179, 241, 191, 0.16)

### Relationship
- `--color-relationship` - #c70b77 (Main Relationship color)
- `--color-relationship-text` - #940055 (Relationship text color - for text)
- `--color-on-relationship` - #ffffff (Content color on Relationship)
- `--color-relationship-container` - #ffd9e4 (Relationship container background)
- `--color-on-relationship-container` - #3f001b (Content color on Relationship container)

**Relationship State Layers:**
- `--color-relationship-state-08` - rgba(199, 11, 119, 0.08)
- `--color-relationship-state-12` - rgba(199, 11, 119, 0.12)
- `--color-relationship-state-16` - rgba(199, 11, 119, 0.16)
- `--color-relationship-container-state-08` - rgba(255, 217, 228, 0.08)
- `--color-relationship-container-state-12` - rgba(255, 217, 228, 0.12)
- `--color-relationship-container-state-16` - rgba(255, 217, 228, 0.16)

### Technology Tools
- `--color-technology-tools` - #005cbd (Main Technology Tools color)
- `--color-technology-tools-text` - #0b469d (Technology Tools text color - for text)
- `--color-on-technology-tools` - #ffffff (Content color on Technology Tools)
- `--color-technology-tools-container` - #d7e2ff (Technology Tools container background)
- `--color-on-technology-tools-container` - #001a40 (Content color on Technology Tools container)

**Technology Tools State Layers:**
- `--color-technology-tools-state-08` - rgba(0, 92, 189, 0.08)
- `--color-technology-tools-state-12` - rgba(0, 92, 189, 0.12)
- `--color-technology-tools-state-16` - rgba(0, 92, 189, 0.16)
- `--color-technology-tools-container-state-08` - rgba(215, 226, 255, 0.08)
- `--color-technology-tools-container-state-12` - rgba(215, 226, 255, 0.12)
- `--color-technology-tools-container-state-16` - rgba(215, 226, 255, 0.16)

## Neutral Colors

### Surface Colors
- `--color-surface` - #f9f9fc (Main surface color)
- `--color-on-surface` - #191c1e (Content color on surface)
- `--color-surface-variant` - #dde3ea (Surface variant color)
- `--color-on-surface-variant` - #3f484a (Content color on surface variant)

### Outline Colors
- `--color-outline` - #6f797a (Main outline color)
- `--color-outline-variant` - #bec8ca (Outline variant color - lighter)

### Surface Containers (Hierarchy from lowest to highest)
- `--color-surface-container-lowest` - #ffffff (White/lightest container)
- `--color-surface-container-low` - #f3f3f6 (Slightly darker container)
- `--color-surface-container` - #edeef0 (Base container)
- `--color-surface-container-high` - #e7e8eb (More emphasis container)
- `--color-surface-container-highest` - #e2e2e5 (Most emphasis container)

### Alternative Surfaces
- `--color-surface-dim` - #d9dadd (Dimmed surface)
- `--color-surface-bright` - #f9f9fc (Bright surface)
- `--color-scrim` - rgba(0, 0, 0, 0.32) (Scrim overlay color)
- `--color-inverse-surface` - #2e3133 (Inverse surface color)
- `--color-inverse-on-surface` - #f0f1f3 (Content color on inverse surface)

## Neutral State Layers

### Surface State Layers
- `--color-surface-state-08` - rgba(249, 249, 252, 0.08)
- `--color-surface-state-12` - rgba(249, 249, 252, 0.12)
- `--color-surface-state-16` - rgba(249, 249, 252, 0.16)

### Outline State Layers
- `--color-outline-state-08` - rgba(113, 120, 126, 0.08)
- `--color-outline-state-12` - rgba(113, 120, 126, 0.12)
- `--color-outline-state-16` - rgba(113, 120, 126, 0.16)

### Surface Variant State Layers
- `--color-surface-variant-state-08` - rgba(221, 227, 234, 0.08)
- `--color-surface-variant-state-12` - rgba(221, 227, 234, 0.12)
- `--color-surface-variant-state-16` - rgba(221, 227, 234, 0.16)

### Inverse Surface State Layers
- `--color-inverse-surface-state-08` - rgba(46, 49, 51, 0.08)
- `--color-inverse-surface-state-12` - rgba(46, 49, 51, 0.12)
- `--color-inverse-surface-state-16` - rgba(46, 49, 51, 0.16)

### Shadow State Layers
- `--color-shadow-state-08` - rgba(0, 0, 0, 0.08)
- `--color-shadow-state-12` - rgba(0, 0, 0, 0.12)
- `--color-shadow-state-16` - rgba(0, 0, 0, 0.16)

### Outline Variant State Layers
- `--color-outline-variant-state-08` - rgba(193, 199, 206, 0.08)
- `--color-outline-variant-state-12` - rgba(193, 199, 206, 0.12)
- `--color-outline-variant-state-16` - rgba(193, 199, 206, 0.16)

### Surface Container State Layers
- `--color-surface-container-highest-state-08` - rgba(226, 226, 229, 0.08)
- `--color-surface-container-highest-state-12` - rgba(226, 226, 229, 0.12)
- `--color-surface-container-highest-state-16` - rgba(226, 226, 229, 0.16)
- `--color-surface-container-high-state-08` - rgba(231, 232, 235, 0.08)
- `--color-surface-container-high-state-12` - rgba(231, 232, 235, 0.12)
- `--color-surface-container-high-state-16` - rgba(231, 232, 235, 0.16)
- `--color-surface-container-state-08` - rgba(237, 238, 240, 0.08)
- `--color-surface-container-state-12` - rgba(237, 238, 240, 0.12)
- `--color-surface-container-state-16` - rgba(237, 238, 240, 0.16)
- `--color-surface-container-low-state-08` - rgba(243, 243, 246, 0.08)
- `--color-surface-container-low-state-12` - rgba(243, 243, 246, 0.12)
- `--color-surface-container-low-state-16` - rgba(243, 243, 246, 0.16)
- `--color-surface-container-lowest-state-08` - rgba(255, 255, 255, 0.08)
- `--color-surface-container-lowest-state-12` - rgba(255, 255, 255, 0.12)
- `--color-surface-container-lowest-state-16` - rgba(255, 255, 255, 0.16)

### Surface Bright State Layers
- `--color-surface-bright-state-08` - rgba(249, 249, 252, 0.08)
- `--color-surface-bright-state-12` - rgba(249, 249, 252, 0.12)
- `--color-surface-bright-state-16` - rgba(249, 249, 252, 0.16)

### Surface Dim State Layers
- `--color-surface-dim-state-08` - rgba(217, 218, 221, 0.08)
- `--color-surface-dim-state-12` - rgba(217, 218, 221, 0.12)
- `--color-surface-dim-state-16` - rgba(217, 218, 221, 0.16)

### On Surface State Layers
- `--color-on-surface-state-08` - rgba(25, 28, 30, 0.08)
- `--color-on-surface-state-12` - rgba(25, 28, 30, 0.12)
- `--color-on-surface-state-16` - rgba(25, 28, 30, 0.16)

### On Surface Variant State Layers
- `--color-on-surface-variant-state-08` - rgba(65, 72, 77, 0.08)
- `--color-on-surface-variant-state-12` - rgba(65, 72, 77, 0.12)
- `--color-on-surface-variant-state-16` - rgba(65, 72, 77, 0.16)

## Table Color States

Table buttons and interactive elements use specific color states for different interaction states.

| State | Background Color | Stroke | Opacity |
| --- | --- | --- | --- |
| **Default** | `transparent` (no-fill) | `None` | 100% |
| **Hover** | `--color-on-surface-state-08` | `None` | 100% |
| **Pressed** | `--color-on-surface-state-16` | `None` | 100% |
| **Focus** | `--color-on-surface-state-12` | `--color-inverse-primary` (2px) | 100% |
| **Disabled** | `--color-on-surface-state-08` | `None` | 38% |

### Implementation Example

```css
.table-button {
    background-color: transparent;
    border: none;
    opacity: 1;
}

.table-button:hover:not(:disabled) {
    background-color: var(--color-on-surface-state-08);
}

.table-button:active:not(:disabled) {
    background-color: var(--color-on-surface-state-16);
}

.table-button:focus:not(:disabled) {
    background-color: var(--color-on-surface-state-12);
    outline: 2px solid var(--color-inverse-primary);
    outline-offset: 2px;
}

.table-button:disabled {
    background-color: var(--color-on-surface-state-08);
    opacity: 0.38;
    cursor: not-allowed;
}
```

## Color Principles

1. **Use Material Design 3 roles**: Always use proper M3 color roles
2. **Use state layers for interactivity**: Use `-state-08/12/16` tokens for hover/active states
3. **Match surface hierarchy**: Use appropriate surface container levels
4. **Maintain contrast**: Ensure proper contrast ratios for accessibility
5. **Use text variants for text**: Use `-text` variants (e.g., `--color-primary-text`) for text content
6. **Info aliases to Tertiary**: Info colors use `var()` references to Tertiary

## See Also

- [Overview](overview.md) - Styles overview and navigation
- [Layout](layout.md) - Spacing tokens and usage
- [Typography](typography.md) - Typography tokens

