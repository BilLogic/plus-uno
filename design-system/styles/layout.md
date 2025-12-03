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

## Corner Radius Application Principles

Corner radius (border-radius) selection should be **contextually related to the padding and gap sizes** used within the same component. The radius size should match the padding/gap size tier to maintain visual consistency and hierarchy.

### Core Principle

**Radius size should match padding/gap size tier**: Small padding → small radius, medium padding → medium radius, large padding → large radius.

### Contextual Selection Guidelines

When selecting corner radius for a component, consider:
1. **Padding size**: The radius should align with the padding size tier (sm/md/lg)
2. **Gap size**: The radius should align with the gap size tier when gap is the primary spacing mechanism
3. **Component context**: The radius should match the visual weight and importance of the component
4. **Hierarchy**: Larger components with more padding typically use larger radius values

### Layer-Specific Guidelines

#### Elements Layer
- **All element radius sizes are 4px** (except pill shape which is 999px)
- Use `element-radius-sm/md/lg` based on element padding size:
  - `element-pad-sm` → `element-radius-sm` (4px)
  - `element-pad-md` → `element-radius-md` (4px)
  - `element-pad-lg` → `element-radius-lg` (4px)
- **Pill shape**: Use `element-radius-pill` (999px) for fully rounded elements like badges, chips, and toggle switches

#### Cards Layer
- **Small radius (12px)**: Use `card-radius-sm` with `card-pad-sm` (16px padding)
  - Best for: Compact cards, dense interfaces, smaller content areas
- **Medium radius (16px)**: Use `card-radius-md` with `card-pad-md` (20px padding) or `card-pad-lg` (24px padding)
  - Best for: Standard cards, content-rich layouts, prominent card displays
- **Default**: Cards typically use `card-radius-sm` (12px) as the default

#### Sections Layer
- **Small/Medium radius (8px)**: Use `section-radius-sm` or `section-radius-md` (both 8px) with `section-pad-sm` (16px) or `section-pad-md` (24px)
  - Best for: Standard sections, containers for cards or forms
- **Large radius (16px)**: Use `section-radius-lg` with `section-pad-lg` (36px padding)
  - Best for: Spacious sections, prominent content areas, hero sections

#### Modals Layer
- **Small radius (4px)**: Use `modal-radius-sm` with `modal-pad-sm` (10px/8px padding)
  - Best for: Compact modals, alerts, small dialogs
- **Medium radius (6px)**: Use `modal-radius-md` with `modal-pad-md` (16px/12px padding)
  - Best for: Standard modals, default dialog windows (most common)
- **Large radius (12px)**: Use `modal-radius-lg` with `modal-pad-lg` (40px/24px padding)
  - Best for: Spacious modals, important dialogs, content-rich modals

#### Surfaces Layer
- **Single radius (16px)**: Use `surface-radius` (16px) - only one size available
  - Best for: Full screen/organism layouts, page-level containers
  - Surfaces typically use consistent radius regardless of padding size

#### Surface Containers Layer
- **No radius tokens**: Surface containers are the outermost layer (sidebars, top bars) and **do not require corner radius**
  - This is intentional design - surface containers extend to screen edges
  - They are typically full-width or full-height elements that don't need rounded corners

#### Tables Layer
- **Small radius (6px)**: Use `table-radius-sm` for dense tables, compact data displays
- **Medium radius (8px)**: Use `table-radius-md` for standard tables, typical data displays
- **Selection**: Choose based on table density and visual weight, not directly tied to padding

### Best Practices

1. **Match the tier**: Always match radius size tier to padding/gap size tier
2. **Consistency**: Use the same radius size for similar components in the same context
3. **Visual hierarchy**: Larger radius for more prominent components, smaller radius for compact components
4. **Context matters**: Consider the component's role and importance when selecting radius size
5. **Surface containers exception**: Remember that surface containers don't use radius

### Anti-Patterns

❌ **Don't mix tiers**: Using `card-pad-sm` with `card-radius-md` breaks visual consistency
❌ **Don't ignore context**: Using the same radius for all components regardless of padding size
❌ **Don't use surface container radius**: Surface containers don't need radius tokens
✅ **Do match tiers**: Use `card-pad-sm` with `card-radius-sm` for consistency
✅ **Do consider hierarchy**: Use larger radius for more prominent components

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
  - Use with: `element-pad-sm` (8px/4px padding)
  - Best for: Small buttons, compact form inputs, dense interfaces
- `--size-element-radius-md` - 4px
  - Use with: `element-pad-md` (10px/6px padding)
  - Best for: Standard buttons, default form inputs, typical element sizes
- `--size-element-radius-lg` - 4px
  - Use with: `element-pad-lg` (16px/8px padding)
  - Best for: Large buttons, prominent form inputs, spacious interfaces
- `--size-element-radius-pill` - 999px (Fully rounded pill shape)
  - Use for: Badges, chips, toggle switches, fully rounded elements
  - Note: Pill shape is independent of padding size

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
  - Use with: `card-pad-sm` (16px padding)
  - Best for: Compact cards, dense interfaces, smaller content areas
  - Default: Most cards use this as the standard radius
- `--size-card-radius-md` - 16px
  - Use with: `card-pad-md` (20px padding) or `card-pad-lg` (24px padding)
  - Best for: Standard cards, content-rich layouts, prominent card displays
  - Note: Use when card has medium or large padding for visual consistency

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
  - Use with: `section-pad-sm` (16px padding)
  - Best for: Compact sections, dense layouts, smaller containers
- `--size-section-radius-md` - 8px
  - Use with: `section-pad-md` (24px padding)
  - Best for: Standard sections, containers for cards or forms, typical layouts
- `--size-section-radius-lg` - 16px
  - Use with: `section-pad-lg` (36px padding)
  - Best for: Spacious sections, prominent content areas, hero sections

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
  - Use with: `modal-pad-sm` (10px/8px padding)
  - Best for: Compact modals, alerts, small dialogs, dense interfaces
- `--size-modal-radius-md` - 6px
  - Use with: `modal-pad-md` (16px/12px padding)
  - Best for: Standard modals, default dialog windows (most common)
  - Default: Most modals use this as the standard radius
- `--size-modal-radius-lg` - 12px
  - Use with: `modal-pad-lg` (40px/24px padding)
  - Best for: Spacious modals, important dialogs, content-rich modals

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
  - Use for: Full screen/organism layouts, page-level containers
  - Note: Single size available - use consistently for all surface-level components
  - Relationship: Surfaces use consistent radius regardless of padding size

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

### Radius
- **No radius tokens**: Surface containers are the outermost layer and **do not require corner radius**
  - This is intentional design - surface containers extend to screen edges
  - They are typically full-width or full-height elements (sidebars, top bars) that don't need rounded corners
  - Surface containers are the structural frame of the interface, not content containers

## Table Tokens

Use for: table cells and spacing

### Cell Tokens
- `--size-table-cell-x` - 10px (Cell width padding - horizontal padding)
- `--size-table-cell-y` - 8px (Cell height padding - vertical padding)
- `--size-table-cell-gap` - 10px (Gap between cells)

### Row Tokens
- `--size-table-radius-sm` - 6px (Row border radius - small)
  - Use for: Dense tables, compact data displays, smaller table rows
  - Selection: Based on table density and visual weight, not directly tied to padding
- `--size-table-radius-md` - 8px (Row border radius - medium)
  - Use for: Standard tables, typical data displays, normal table rows
  - Selection: Based on table density and visual weight, not directly tied to padding

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
9. **Match radius to padding/gap tier**: Small padding → small radius, medium padding → medium radius, large padding → large radius
10. **Surface containers exception**: Surface containers don't use radius (outermost layer)

## See Also

- [Typography](typography.md) - Element typography hierarchy
- [Overview](overview.md) - Styles overview and navigation
- [Components Overview](../components/overview.md) - Component terminology and types

