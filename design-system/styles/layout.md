# Layout

## Layout Token Migration Principles

The PLUS design system uses a **two-tier spacing system**: Primitives (infrastructure) and Semantics (what you use).

### Primitives vs. Semantic Tokens

**Primitives** (Infrastructure - DO NOT USE DIRECTLY):
- Base values like `space-000` through `space-1000`, `radius-50` through `radius-1000`, `stroke-100` through `stroke-300`
- Location: `develop/tokens/_primitives.scss`
- **These are infrastructure tokens used to build semantic tokens**
- **NEVER use primitives directly in your code**

**Semantic Tokens** (What You Use):
- Contextual tokens: `element-*`, `card-*`, `section-*`, `modal-*`, `surface-*`, `surface-container-*`
- Location: `develop/tokens/_spacing_semantics.scss`
- **These are what designers and developers should use**
- Provide context and meaning for token usage

### Usage Principles

1. **Always use semantic tokens**: ✅ `card-pad-x-md` ❌ `20px` or `space-400`
2. **Match token to context**: Cards → `card-` tokens, Sections → `section-` tokens
3. **Respect hierarchy**: Use smaller gaps for dense UI, larger gaps for content-rich layouts

### Mixing Tokens

- **Valid**: Using `sm` for padding and `md` for gap in the same component is valid
- **Rare/Not Ideal**: Mixing different semantic sizes for the same token type (e.g., `pad-x-sm` + `pad-y-md`) is rare and not ideal

### Determining Token Type

To determine which spacing token type to use, look at the component's **immediate parent container** (e.g., cards, sections, modals). The spacing rules should cascade down from the parent, creating a consistent rhythm.

### Element Typography Hierarchy

Element spacing tokens are tied to typographic hierarchy:

- **Headline Text (H3)**: Use `element-gap-lg` and `element-x/y-lg`
- **Title Text (H6)**: Use `element-gap-md` and `element-x/y-md`
- **Body Text (B3)**: Use `element-gap-sm` and `element-x/y-sm`

However, mixing tokens is still allowed if absolutely necessary (see Mixing Tokens above).

### Special Token: element-gap-xs

**`element-gap-xs` is reserved for label-to-input spacing only.** This token (4px) should only be used for the space between a form label and its input field (e.g., a text field or dropdown menu).

## Elements Layer Tokens

Use for: buttons, forms, badges, items

### Padding
- `--size-element-pad-x-sm` - 8px
- `--size-element-pad-x-md` - 10px
- `--size-element-pad-x-lg` - 16px
- `--size-element-pad-y-sm` - 4px
- `--size-element-pad-y-md` - 6px
- `--size-element-pad-y-lg` - 8px

### Gap
- `--size-element-gap-xs` - 4px (**Reserved for label-to-input spacing only**)
- `--size-element-gap-sm` - 8px (Body text spacing)
- `--size-element-gap-md` - 10px (Title text spacing)
- `--size-element-gap-lg` - 12px (Headline text spacing)

### Radius
- `--size-element-radius-sm` - 4px
- `--size-element-radius-md` - 4px
- `--size-element-radius-lg` - 4px
- `--size-element-radius-pill` - 999px (Fully rounded pill shape)

### Border/Stroke
- `--size-element-stroke-sm` - 1px
- `--size-element-stroke-md` - 1.5px
- `--size-element-stroke-lg` - 2px
- `--size-element-stroke-xl` - 2.5px
- `--size-element-border` - 1px

## Cards Layer Tokens

Use for: self-contained containers displaying information

### Padding
- `--size-card-pad-x-sm` - 16px
- `--size-card-pad-x-md` - 20px
- `--size-card-pad-x-lg` - 24px
- `--size-card-pad-y-sm` - 16px
- `--size-card-pad-y-md` - 20px
- `--size-card-pad-y-lg` - 24px

### Gap
- `--size-card-gap-sm` - 8px
- `--size-card-gap-md` - 16px
- `--size-card-gap-lg` - 32px

### Radius
- `--size-card-radius-sm` - 12px
- `--size-card-radius-md` - 16px

### Border
- `--size-card-border-sm` - 1px
- `--size-card-border-md` - 1.5px
- `--size-card-border-lg` - 2px

## Sections Layer Tokens

Use for: containers for cards or forms, grouping related content

### Padding
- `--size-section-pad-x-sm` - 16px
- `--size-section-pad-x-md` - 24px
- `--size-section-pad-x-lg` - 36px
- `--size-section-pad-y-sm` - 16px
- `--size-section-pad-y-md` - 24px
- `--size-section-pad-y-lg` - 36px

### Gap
- `--size-section-gap-sm` - 8px
- `--size-section-gap-md` - 16px
- `--size-section-gap-lg` - 24px

### Radius
- `--size-section-radius-sm` - 8px
- `--size-section-radius-md` - 8px
- `--size-section-radius-lg` - 16px

### Border
- `--size-section-border` - 1.5px

## Modals Layer Tokens

Use for: pop-up windows, dialogs, date pickers, alerts, breadcrumbs

### Padding
- `--size-modal-pad-x-sm` - 10px
- `--size-modal-pad-x-md` - 16px
- `--size-modal-pad-x-lg` - 40px
- `--size-modal-pad-y-sm` - 8px
- `--size-modal-pad-y-md` - 12px
- `--size-modal-pad-y-lg` - 24px

### Gap
- `--size-modal-gap-sm` - 8px
- `--size-modal-gap-md` - 12px
- `--size-modal-gap-lg` - 32px

### Radius
- `--size-modal-radius-sm` - 4px
- `--size-modal-radius-md` - 6px
- `--size-modal-radius-lg` - 12px

### Border
- `--size-modal-border-sm` - 1px
- `--size-modal-border-md` - 1.5px
- `--size-modal-border-lg` - 2px

## Surfaces Layer Tokens

Use for: full screen/organism the user sees at one time

### Padding
- `--size-surface-pad-x` - 32px
- `--size-surface-pad-y` - 24px

### Gap
- `--size-surface-gap-sm` - 16px
- `--size-surface-gap-md` - 24px
- `--size-surface-gap-lg` - 32px

### Radius
- `--size-surface-radius` - 16px

### Border
- `--size-surface-border` - 2px

## Surface Containers Layer Tokens

Use for: top-level frame (sidebar, top bar) - only one per screen

### Padding
- `--size-surface-container-pad-x-sm` - 16px
- `--size-surface-container-pad-x-md` - 24px
- `--size-surface-container-pad-y-sm` - 12px
- `--size-surface-container-pad-y-md` - 24px

### Gap
- `--size-surface-container-gap-sm` - 16px
- `--size-surface-container-gap-md` - 32px

### Border
- `--size-surface-container-border` - 2.5px

## Table Tokens

Use for: table cells and spacing

### Cell Tokens
- `--size-table-cell-x` - 10px (Cell width padding - horizontal padding)
- `--size-table-cell-y` - 8px (Cell height padding - vertical padding)
- `--size-table-cell-gap` - 10px (Gap between cells)

### Row Tokens
- `--size-table-radius-sm` - 6px (Row border radius - small)
- `--size-table-radius-md` - 8px (Row border radius - medium)

### Special Circumstances

**Cell gap not applied**: When texts should be close together, cell gap should not be applied. Only use `cell-x` and `cell-y` tokens for padding, but omit `cell-gap` to keep text close.

**Example with gap:**
```css
.table-cell {
    padding: var(--size-table-cell-y) var(--size-table-cell-x);
    gap: var(--size-table-cell-gap); /* Applied when spacing is needed */
}
```

**Example without gap (texts close):**
```css
.table-cell-close {
    padding: var(--size-table-cell-y) var(--size-table-cell-x);
    /* gap not applied - texts should be close */
}
```

## Layout Principles

1. **Always use semantic tokens**: ✅ `card-pad-x-md` ❌ `20px` or `space-400`
2. **Match token to context**: Cards → `card-` tokens, Sections → `section-` tokens
3. **Respect hierarchy**: Smaller gaps for dense UI, larger gaps for content-rich layouts
4. **Mixing tokens is valid**: Using `sm` for padding and `md` for gap is valid
5. **Avoid mixing semantic sizes**: ❌ `pad-x-sm` + `pad-y-md` (rare/not ideal)
6. **Determine from parent**: Look at immediate parent container and cascade down
7. **Element typography hierarchy**: H3→lg, H6→md, B3→sm for element spacing
8. **element-gap-xs reserved**: Only for label-to-input spacing

## See Also

- [Typography](typography.md) - Element typography hierarchy
- [Overview](overview.md) - Styles overview and navigation
- [Components Overview](../components/overview.md) - Component terminology and types

