# PLUS Design System - Token Reference

## Overview
This document provides a complete reference for all design tokens available in the PLUS design system. Always use these tokens instead of hardcoded values.

**Reference this document when:**
- Selecting colors for UI elements
- Choosing spacing values (padding, margins, gaps)
- Setting border radius values
- Selecting typography styles
- Setting layout breakpoints

## Color Tokens

### Material Design 3 Color System
PLUS follows Material Design 3 color guidance: https://m3.material.io/styles/color/roles

### Accent Colors

#### Primary
- `--color-primary` - Main primary color
- `--color-on-primary` - Content color on primary
- `--color-primary-container` - Primary container background
- `--color-on-primary-container` - Content color on primary container
- `--color-inverse-primary` - Inverse primary color
- `--color-primary-state-08` - Primary state layer (8% opacity)
- `--color-primary-state-12` - Primary state layer (12% opacity)
- `--color-primary-state-16` - Primary state layer (16% opacity)
- `--color-primary-container-state-08` - Primary container state layer (8% opacity)
- `--color-primary-container-state-12` - Primary container state layer (12% opacity)
- `--color-primary-container-state-16` - Primary container state layer (16% opacity)

#### Secondary
- `--color-secondary` - Main secondary color
- `--color-on-secondary` - Content color on secondary
- `--color-secondary-container` - Secondary container background
- `--color-on-secondary-container` - Content color on secondary container
- `--color-secondary-state-08/12/16` - Secondary state layers
- `--color-secondary-container-state-08/12/16` - Secondary container state layers

#### Tertiary
- `--color-tertiary` - Main tertiary color
- `--color-on-tertiary` - Content color on tertiary
- `--color-tertiary-container` - Tertiary container background
- `--color-on-tertiary-container` - Content color on tertiary container
- `--color-tertiary-state-08/12/16` - Tertiary state layers
- `--color-tertiary-container-state-08/12/16` - Tertiary container state layers

#### Danger
- `--color-danger` - Main danger color
- `--color-on-danger` - Content color on danger
- `--color-danger-container` - Danger container background
- `--color-on-danger-container` - Content color on danger container
- `--color-danger-state-08/12/16` - Danger state layers
- `--color-danger-container-state-08/12/16` - Danger container state layers

#### Success
- `--color-success` - Main success color
- `--color-on-success` - Content color on success
- `--color-success-container` - Success container background
- `--color-on-success-container` - Content color on success container
- `--color-success-state-08/12/16` - Success state layers
- `--color-success-container-state-08/12/16` - Success container state layers

#### Warning
- `--color-warning` - Main warning color
- `--color-on-warning` - Content color on warning
- `--color-warning-container` - Warning container background
- `--color-on-warning-container` - Content color on warning container
- `--color-warning-state-08/12/16` - Warning state layers
- `--color-warning-container-state-08/12/16` - Warning container state layers

#### Info
- `--color-info` - Main info color (aliases to Tertiary)
- `--color-on-info` - Content color on info
- `--color-info-container` - Info container background
- `--color-on-info-container` - Content color on info container
- `--color-info-state-08/12/16` - Info state layers
- `--color-info-container-state-08/12/16` - Info container state layers

### SMART Framework Colors

#### Social-Emotional
- `--color-social-emotional` - Main Social-Emotional color
- `--color-on-social-emotional` - Content color on Social-Emotional
- `--color-social-emotional-container` - Social-Emotional container background
- `--color-on-social-emotional-container` - Content color on Social-Emotional container
- `--color-social-emotional-state-08/12/16` - Social-Emotional state layers
- `--color-social-emotional-container-state-08/12/16` - Social-Emotional container state layers

#### Mastering Content
- `--color-mastering-content` - Main Mastering Content color
- `--color-on-mastering-content` - Content color on Mastering Content
- `--color-mastering-content-container` - Mastering Content container background
- `--color-on-mastering-content-container` - Content color on Mastering Content container
- `--color-mastering-content-state-08/12/16` - Mastering Content state layers
- `--color-mastering-content-container-state-08/12/16` - Mastering Content container state layers

#### Advocacy
- `--color-advocacy` - Main Advocacy color
- `--color-on-advocacy` - Content color on Advocacy
- `--color-advocacy-container` - Advocacy container background
- `--color-on-advocacy-container` - Content color on Advocacy container
- `--color-advocacy-state-08/12/16` - Advocacy state layers
- `--color-advocacy-container-state-08/12/16` - Advocacy container state layers

#### Relationship
- `--color-relationship` - Main Relationship color
- `--color-on-relationship` - Content color on Relationship
- `--color-relationship-container` - Relationship container background
- `--color-on-relationship-container` - Content color on Relationship container
- `--color-relationship-state-08/12/16` - Relationship state layers
- `--color-relationship-container-state-08/12/16` - Relationship container state layers

#### Technology Tools
- `--color-technology-tools` - Main Technology Tools color
- `--color-on-technology-tools` - Content color on Technology Tools
- `--color-technology-tools-container` - Technology Tools container background
- `--color-on-technology-tools-container` - Content color on Technology Tools container
- `--color-technology-tools-state-08/12/16` - Technology Tools state layers
- `--color-technology-tools-container-state-08/12/16` - Technology Tools container state layers

### Neutral Colors

#### Surface Colors
- `--color-surface` - Main surface color
- `--color-on-surface` - Content color on surface
- `--color-surface-variant` - Surface variant color
- `--color-on-surface-variant` - Content color on surface variant

#### Outline Colors
- `--color-outline` - Main outline color
- `--color-outline-variant` - Outline variant color (lighter)

#### Surface Containers (Hierarchy from lowest to highest)
- `--color-surface-container-lowest` - White/lightest container
- `--color-surface-container-low` - Slightly darker container
- `--color-surface-container` - Base container
- `--color-surface-container-high` - More emphasis container
- `--color-surface-container-highest` - Most emphasis container

#### Alternative Surfaces
- `--color-surface-dim` - Dimmed surface
- `--color-surface-bright` - Bright surface
- `--color-scrim` - Scrim overlay color
- `--color-inverse-surface` - Inverse surface color
- `--color-inverse-on-surface` - Content color on inverse surface

## Spacing Tokens

### Semantic Spacing System
**CRITICAL: Always use semantic tokens, never primitives or hardcoded values.**

The spacing system uses a two-tier approach:
- **Primitives**: Base values (infrastructure, not for direct use)
- **Semantics**: Contextual tokens (what designers and developers use)

### Elements Layer Tokens
Use for: buttons, forms, badges, items

#### Padding
- `--size-element-pad-x-sm` - 8px
- `--size-element-pad-x-md` - 10px
- `--size-element-pad-x-lg` - 16px
- `--size-element-pad-y-sm` - 4px
- `--size-element-pad-y-md` - 6px
- `--size-element-pad-y-lg` - 8px

#### Gap
- `--size-element-gap-xs` - 4px (Reserved for label-to-input spacing only)
- `--size-element-gap-sm` - 8px (Body text spacing)
- `--size-element-gap-md` - 10px (Title text spacing)
- `--size-element-gap-lg` - 12px (Headline text spacing)

#### Radius
- `--size-element-radius-sm` - 4px
- `--size-element-radius-md` - 4px
- `--size-element-radius-lg` - 4px
- `--size-element-radius-pill` - 999px (Fully rounded pill shape)

#### Border/Stroke
- `--size-element-stroke-sm` - 1px
- `--size-element-stroke-md` - 1.5px
- `--size-element-stroke-lg` - 2px
- `--size-element-stroke-xl` - 2.5px
- `--size-element-border` - 1px

### Cards Layer Tokens
Use for: self-contained containers displaying information

#### Padding
- `--size-card-pad-x-sm` - 16px
- `--size-card-pad-x-md` - 20px
- `--size-card-pad-x-lg` - 24px
- `--size-card-pad-y-sm` - 16px
- `--size-card-pad-y-md` - 20px
- `--size-card-pad-y-lg` - 24px

#### Gap
- `--size-card-gap-sm` - 8px
- `--size-card-gap-md` - 16px
- `--size-card-gap-lg` - 32px

#### Radius
- `--size-card-radius-sm` - 12px
- `--size-card-radius-md` - 16px

#### Border
- `--size-card-border-sm` - 1px
- `--size-card-border-md` - 1.5px
- `--size-card-border-lg` - 2px

### Sections Layer Tokens
Use for: containers for cards or forms, grouping related content

#### Padding
- `--size-section-pad-x-sm` - 16px
- `--size-section-pad-x-md` - 24px
- `--size-section-pad-x-lg` - 36px
- `--size-section-pad-y-sm` - 16px
- `--size-section-pad-y-md` - 24px
- `--size-section-pad-y-lg` - 36px

#### Gap
- `--size-section-gap-sm` - 8px
- `--size-section-gap-md` - 16px
- `--size-section-gap-lg` - 24px

#### Radius
- `--size-section-radius-sm` - 8px
- `--size-section-radius-md` - 8px
- `--size-section-radius-lg` - 16px

#### Border
- `--size-section-border` - 1.5px

### Modals Layer Tokens
Use for: pop-up windows, dialogs, date pickers, alerts, breadcrumbs

#### Padding
- `--size-modal-pad-x-sm` - 10px
- `--size-modal-pad-x-md` - 16px
- `--size-modal-pad-x-lg` - 40px
- `--size-modal-pad-y-sm` - 8px
- `--size-modal-pad-y-md` - 12px
- `--size-modal-pad-y-lg` - 24px

#### Gap
- `--size-modal-gap-sm` - 8px
- `--size-modal-gap-md` - 12px
- `--size-modal-gap-lg` - 32px

#### Radius
- `--size-modal-radius-sm` - 4px
- `--size-modal-radius-md` - 6px
- `--size-modal-radius-lg` - 12px

#### Border
- `--size-modal-border-sm` - 1px
- `--size-modal-border-md` - 1.5px
- `--size-modal-border-lg` - 2px

### Surfaces Layer Tokens
Use for: full screen/organism the user sees at one time

#### Padding
- `--size-surface-pad-x` - 32px
- `--size-surface-pad-y` - 24px

#### Gap
- `--size-surface-gap-sm` - 16px
- `--size-surface-gap-md` - 24px
- `--size-surface-gap-lg` - 32px

#### Radius
- `--size-surface-radius` - 16px

#### Border
- `--size-surface-border` - 2px

### Surface Containers Layer Tokens
Use for: top-level frame (sidebar, top bar) - only one per screen

#### Padding
- `--size-surface-container-pad-x-sm` - 16px
- `--size-surface-container-pad-x-md` - 24px
- `--size-surface-container-pad-y-sm` - 12px
- `--size-surface-container-pad-y-md` - 24px

#### Gap
- `--size-surface-container-gap-sm` - 16px
- `--size-surface-container-gap-md` - 32px

#### Border
- `--size-surface-container-border` - 2.5px

### Table Tokens
Use for: table cells and spacing

- `--size-table-cell-x` - 10px
- `--size-table-cell-y` - 8px
- `--size-table-cell-gap` - 10px
- `--size-table-radius-sm` - 6px
- `--size-table-radius-md` - 8px

## Typography Tokens

### Font Families
- `--font-family-header` - "Lato"
- `--font-family-body` - "Merriweather Sans","Open Sans","sans-serif"

### Font Weights
- `--font-weight-normal` - 300
- `--font-weight-semibold-1` - 400
- `--font-weight-semibold-2` - 600
- `--font-weight-bold` - 700

### Font Sizes
- Use typography utility classes: `.h1`, `.h2`, `.h3`, `.body1-txt`, `.body2-txt`, `.body3-txt`
- Use CSS variables: `var(--font-size-h1)`, `var(--font-size-body1)`, etc.

## Layout Tokens

### Breakpoints
- `--breakpoint-md-min` - 768px
- `--breakpoint-md-max` - 991.98px
- `--breakpoint-lg-min` - 992px
- `--breakpoint-lg-max` - 1199.98px
- `--breakpoint-xl-min` - 1200px
- `--breakpoint-xl-max` - 1399.98px
- `--breakpoint-xxl-min` - 1400px
- `--breakpoint-xxl-max` - 1800px

## Usage Guidelines

### Selecting Tokens
1. **Determine component type**: Is it an Element, Card, Section, Modal, Surface, or Surface Container?
2. **Reference terminology guide**: See `guidelines/terminology.md` for component type definitions
3. **Select appropriate tokens**: Use tokens that match the component type
4. **Respect hierarchy**: Use smaller tokens for dense UI, larger for content-rich layouts

### Spacing Principles
1. **Always use semantic tokens**: ✅ `card-pad-x-md` ❌ `20px` or `space-400`
2. **Match token to context**: Cards → `card-` tokens, Sections → `section-` tokens
3. **Respect hierarchy**: Smaller gaps for dense UI, larger gaps for content-rich layouts
4. **Mixing tokens is valid**: Using `sm` for padding and `md` for gap is valid
5. **Avoid mixing semantic sizes**: ❌ `pad-x-sm` + `pad-y-md` (rare/not ideal)
6. **Determine from parent**: Look at immediate parent container and cascade down

### Color Principles
1. **Use Material Design 3 roles**: Always use proper M3 color roles
2. **Use state layers for interactivity**: Use `-state-08/12/16` tokens for hover/active states
3. **Match surface hierarchy**: Use appropriate surface container levels
4. **Maintain contrast**: Ensure proper contrast ratios for accessibility

## Quick Reference

### Common Patterns

#### Button
```css
.button {
    padding: var(--size-element-pad-x-md) var(--size-element-pad-y-md);
    border-radius: var(--size-element-radius-sm);
    background-color: var(--color-primary);
    color: var(--color-on-primary);
}

.button:hover {
    background-color: var(--color-primary-state-12);
}
```

#### Card
```css
.card {
    padding: var(--size-card-pad-x-md) var(--size-card-pad-y-md);
    gap: var(--size-card-gap-md);
    border-radius: var(--size-card-radius-sm);
    background-color: var(--color-surface-container);
    color: var(--color-on-surface);
}
```

#### Section
```css
.section {
    padding: var(--size-section-pad-x-md) var(--size-section-pad-y-md);
    gap: var(--size-section-gap-md);
}
```

#### Form Label-Input
```css
.form-label {
    margin-bottom: var(--size-element-gap-xs); /* Reserved for label-input only */
}
```

## See Also

- **Terminology Guide**: `guidelines/terminology.md` - Component type definitions
- **Coding Standards**: `guidelines/coding-standards.md` - Project rules and standards
- **Design Tokens Source**: `design-system/tokens/` - SCSS token files

