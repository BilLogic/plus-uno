# PLUS Design System - Token Documentation

## Overview
This folder contains documentation about the PLUS design system token system. For actual token usage, reference `guidelines/token-reference.md`.

## Token Files Location

All SCSS token files are located in: `src/css/tokens/`

### Token Files
- `_colors.scss` - Material Design 3 color tokens (152 tokens)
- `_primitives.scss` - Primitive size tokens (29 tokens)
- `_spacing_semantics.scss` - Semantic spacing tokens (79 tokens)
- `_layout.scss` - Layout and breakpoint tokens (8 tokens)
- `_fonts.scss` - Typography tokens
- `_size.scss` - Legacy size tokens (being phased out)
- `_plus_spacing.scss` - Legacy spacing utilities (being phased out)
- `_mixins.scss` - SASS mixins

## Token System Architecture

### Two-Tier System

1. **Primitives** (Infrastructure)
   - Base values: `space-000` through `space-1000`, `radius-50` through `radius-1000`, `stroke-100` through `stroke-300`
   - Location: `src/css/tokens/_primitives.scss`
   - **DO NOT USE DIRECTLY** - These are infrastructure tokens

2. **Semantics** (Designer/Developer Usage)
   - Contextual tokens: `element-*`, `card-*`, `section-*`, `modal-*`, `surface-*`, `surface-container-*`
   - Location: `src/css/tokens/_spacing_semantics.scss`
   - **USE THESE** - These are what you should use in code

## Color System

### Material Design 3 Compliance
- All colors follow Material Design 3 roles
- Reference: https://m3.material.io/styles/color/roles
- Source: Figma design system variables

### Color Categories
- **Accent Colors**: Primary, Secondary, Tertiary, Danger, Success, Warning, Info
- **SMART Framework Colors**: Social-Emotional, Mastering Content, Advocacy, Relationship, Technology Tools
- **Neutral Colors**: Surface, Outline, Surface Containers

### State Layers
All color roles have state layers for interactive states:
- `--color-{role}-state-08` - 8% opacity
- `--color-{role}-state-12` - 12% opacity
- `--color-{role}-state-16` - 16% opacity

## Spacing System

### Semantic Layers
The spacing system is organized into 6 semantic layers:

1. **Elements** - Buttons, forms, badges, items
2. **Cards** - Self-contained containers
3. **Sections** - Containers for cards or forms
4. **Modals** - Pop-up windows
5. **Surfaces** - Full screen/organism
6. **Surface Containers** - Top-level frame

### Token Types per Layer
Each layer has:
- Padding tokens: `pad-x-sm/md/lg`, `pad-y-sm/md/lg`
- Gap tokens: `gap-xs/sm/md/lg`
- Radius tokens: `radius-sm/md/lg`
- Border tokens: `border-sm/md/lg` or `stroke-sm/md/lg/xl`

## Usage Guidelines

### Always Use Semantic Tokens
✅ **Correct:**
```css
.card {
    padding: var(--size-card-pad-x-md) var(--size-card-pad-y-md);
    gap: var(--size-card-gap-md);
}
```

❌ **Incorrect:**
```css
.card {
    padding: 20px 20px; /* Hardcoded */
    gap: 16px; /* Hardcoded */
}
```

❌ **Incorrect:**
```css
.card {
    padding: var(--size-space-400); /* Using primitive */
    gap: var(--size-space-300); /* Using primitive */
}
```

### Match Token to Component Type
- Cards → `card-` tokens
- Sections → `section-` tokens
- Elements → `element-` tokens
- Modals → `modal-` tokens
- Surfaces → `surface-` tokens
- Surface Containers → `surface-container-` tokens

## Reference Documents

- **Token Reference**: `../guidelines/token-reference.md` - Complete token reference
- **Terminology**: `../guidelines/terminology.md` - Component type definitions
- **Coding Standards**: `../guidelines/coding-standards.md` - Usage guidelines

## Token Generation

Tokens are generated from Figma design system JSON files using scripts in `scripts/`:
- `scripts/generate-all-tokens.js` - Main token generation
- `scripts/regenerate-colors.js` - Color token regeneration
- `scripts/fix-colors.js` - Color file fixes

## Maintenance

When updating tokens:
1. Update Figma design system
2. Export JSON files
3. Run token generation scripts
4. Verify SCSS compilation
5. Update documentation if needed

