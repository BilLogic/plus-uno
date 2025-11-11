# PLUS Design System - Terminology and UI Component Types

## Overview
This document defines the terminology and UI component types used in the PLUS design system. Reference this document when designing specific types of UI components to ensure you use the correct tokens and patterns.

## UI Component Hierarchy

The PLUS design system organizes UI components into 6 semantic layers, from smallest to largest:

1. **Elements** - Fundamental building blocks
2. **Cards** - Self-contained containers
3. **Sections** - Containers for cards or forms
4. **Modals** - Pop-up windows
5. **Surfaces** - Full screen/organism
6. **Surface Containers** - Top-level frame

## 1. Elements

### Definition
Fundamental building blocks of an application or website. Each element is a distinct part of the interface that groups related content and functionality.

### Characteristics
- Smallest semantic unit
- Groups related content and functionality
- Distinct, interactive parts of the interface
- Building blocks for larger components

### Examples
- Buttons
- Form inputs (text fields, checkboxes, radio buttons)
- Badges
- Status indicators
- Icons
- List items
- Tabs
- Tooltips

### Token Usage
**Always use `element-` tokens for Elements:**
- Padding: `--size-element-pad-x-sm/md/lg`, `--size-element-pad-y-sm/md/lg`
- Gap: `--size-element-gap-xs/sm/md/lg` (xs reserved for label-input spacing)
- Radius: `--size-element-radius-sm/md/lg`
- Border/Stroke: `--size-element-stroke-sm/md/lg/xl`, `--size-element-border`

### Typography Spacing
- **Headline Text**: Use `element-gap-lg` and `element-x/y-lg`
- **Title Text**: Use `element-gap-md` and `element-x/y-md`
- **Body Text**: Use `element-gap-sm` and `element-x/y-sm`
- **Label-Input Gap**: Use `element-gap-xs` (4px) - **Reserved for label-to-input spacing only**

### Code Example
```css
.button {
    padding: var(--size-element-pad-x-md) var(--size-element-pad-y-md);
    border-radius: var(--size-element-radius-sm);
    gap: var(--size-element-gap-sm);
}

.form-label {
    margin-bottom: var(--size-element-gap-xs); /* Only for label-input spacing */
}
```

## 2. Cards

### Definition
Self-contained containers that display a related set of information and actions. Often includes an image, text, and buttons. Helps users quickly scan, compare, and interact with content.

### Characteristics
- Self-contained block
- Displays related information
- Often includes image, text, buttons
- Doesn't hold modals
- Helps users scan and compare content

### Examples
- Product cards
- Profile cards
- Dashboard cards
- Content cards
- Metric cards
- SMART cards (with competency area styling)

### Token Usage
**Always use `card-` tokens for Cards:**
- Padding: `--size-card-pad-x-sm/md/lg`, `--size-card-pad-y-sm/md/lg`
- Gap: `--size-card-gap-sm/md/lg`
- Radius: `--size-card-radius-sm/md`
- Border: `--size-card-border-sm/md/lg`

### Surface Color
- Use `--color-surface-container` or appropriate surface container level
- Content color: `--color-on-surface`

### Code Example
```css
.card {
    padding: var(--size-card-pad-x-md) var(--size-card-pad-y-md);
    gap: var(--size-card-gap-md);
    border-radius: var(--size-card-radius-sm);
    background-color: var(--color-surface-container);
    color: var(--color-on-surface);
    border: var(--size-card-border-sm) solid var(--color-outline-variant);
}
```

## 3. Sections

### Definition
Containers for cards or forms. A part of a page that groups related content together, such as cards or a form.

### Characteristics
- Groups related content
- Contains cards or forms
- Part of a larger page
- Organizes content into logical sections

### Examples
- Dashboard sections
- Form sections
- Content sections
- Feature sections
- Sidebar sections

### Token Usage
**Always use `section-` tokens for Sections:**
- Padding: `--size-section-pad-x-sm/md/lg`, `--size-section-pad-y-sm/md/lg`
- Gap: `--size-section-gap-sm/md/lg`
- Radius: `--size-section-radius-sm/md/lg`
- Border: `--size-section-border`

### Surface Color
- Use appropriate surface container level based on hierarchy
- Content color: `--color-on-surface`

### Code Example
```css
.section {
    padding: var(--size-section-pad-x-md) var(--size-section-pad-y-md);
    gap: var(--size-section-gap-md);
    border-radius: var(--size-section-radius-md);
}
```

## 4. Modals

### Definition
Pop-up windows that appear over the UI to capture the user's attention and require an action before continuing.

### Characteristics
- Overlays the main UI
- Requires user interaction
- Blocks interaction with background
- Temporary, focused interaction
- Can contain forms, alerts, confirmations

### Examples
- Dialog modals
- Alert modals
- Date picker modals
- Confirmation dialogs
- Form modals
- Breadcrumb navigation
- Dropdown menus (when they overlay content)

### Token Usage
**Always use `modal-` tokens for Modals:**
- Padding: `--size-modal-pad-x-sm/md/lg`, `--size-modal-pad-y-sm/md/lg`
- Gap: `--size-modal-gap-sm/md/lg`
- Radius: `--size-modal-radius-sm/md/lg`
- Border: `--size-modal-border-sm/md/lg`

### Surface Color
- Use `--color-surface-container-highest` or `--color-surface-container-high`
- Use `--color-scrim` for backdrop overlay
- Content color: `--color-on-surface`

### Code Example
```css
.modal {
    padding: var(--size-modal-pad-x-md) var(--size-modal-pad-y-md);
    gap: var(--size-modal-gap-md);
    border-radius: var(--size-modal-radius-lg);
    background-color: var(--color-surface-container-highest);
    color: var(--color-on-surface);
}

.modal-backdrop {
    background-color: var(--color-scrim);
}
```

## 5. Surfaces

### Definition
Full screen/organism that a user sees at one time. A surface is the complete viewport or organism that includes multiple sections and cards.

### Characteristics
- Full screen or major organism
- Includes multiple sections and cards
- Primary content area
- What user sees at one time
- Can be a page or major view

### Examples
- Main content areas
- Page layouts
- Dashboard views
- Full-screen forms
- Content areas within a layout

### Token Usage
**Always use `surface-` tokens for Surfaces:**
- Padding: `--size-surface-pad-x`, `--size-surface-pad-y`
- Gap: `--size-surface-gap-sm/md/lg`
- Radius: `--size-surface-radius`
- Border: `--size-surface-border`

### Surface Color
- Use `--color-surface` or `--color-surface-bright`
- Content color: `--color-on-surface`

### Code Example
```css
.surface {
    padding: var(--size-surface-pad-x) var(--size-surface-pad-y);
    gap: var(--size-surface-gap-md);
    border-radius: var(--size-surface-radius);
    background-color: var(--color-surface);
    color: var(--color-on-surface);
}
```

## 6. Surface Containers

### Definition
Top-level frame that holds the entire interface. Limited to sidebar and top bar. A container is a grouping element that holds multiple sections like cards, text, or inputs. Includes navigation, sections, modals, etc.

### Characteristics
- Top-level frame
- Only one per screen
- Holds navigation, sections, modals
- Sidebar or top bar
- Organizes entire interface structure

### Examples
- Sidebar navigation
- Top navigation bar
- App shell
- Main layout container
- Navigation drawers

### Token Usage
**Always use `surface-container-` tokens for Surface Containers:**
- Padding: `--size-surface-container-pad-x-sm/md`, `--size-surface-container-pad-y-sm/md`
- Gap: `--size-surface-container-gap-sm/md`
- Border: `--size-surface-container-border`

### Surface Color
- Use appropriate surface container level (`--color-surface-container`, `--color-surface-container-high`, etc.)
- Content color: `--color-on-surface`

### Code Example
```css
.surface-container {
    padding: var(--size-surface-container-pad-x-md) var(--size-surface-container-pad-y-md);
    gap: var(--size-surface-container-gap-md);
    border: var(--size-surface-container-border) solid var(--color-outline);
    background-color: var(--color-surface-container-high);
    color: var(--color-on-surface);
}
```

## Surface Color Hierarchy

Surface colors help organize and layer content in the UI. Use the hierarchy from lowest to highest:

1. **Element** - Distinct parts that group related content (buttons, forms, badges, items)
2. **Card** - Self-contained containers displaying information (often with image, text, buttons)
3. **Section** - Containers for cards or forms, grouping related content
4. **Modal** - Pop-up windows requiring user attention (dialogs, date pickers, alerts)
5. **Surface** - Full screen/organism the user sees (includes multiple sections and cards)
6. **Surface Container** - Top-level frame (sidebar, top bar) - only one per screen

### Surface Container Levels
- `--color-surface-container-lowest` - White/lightest (base)
- `--color-surface-container-low` - Slightly darker
- `--color-surface-container` - Base container
- `--color-surface-container-high` - More emphasis
- `--color-surface-container-highest` - Most emphasis (modals, overlays)

## Determining Component Type

To determine which component type to use:

1. **Look at the immediate parent container**: What is the component nested within?
2. **Consider the component's purpose**: What is it trying to achieve?
3. **Reference the hierarchy**: Where does it fit in the 6-layer system?
4. **Check the examples**: Does it match any of the examples listed above?

### Decision Tree

```
Is it the top-level frame (sidebar, top bar)?
  YES → Surface Container
  
Is it a full screen or major organism?
  YES → Surface
  
Is it a pop-up window requiring action?
  YES → Modal
  
Is it grouping cards or forms together?
  YES → Section
  
Is it a self-contained container with info?
  YES → Card
  
Otherwise → Element
```

## Token Selection Guide

### When Designing Elements
1. Reference: `guidelines/token-reference.md` - Elements Layer Tokens
2. Use: `element-` prefixed tokens
3. Consider: Typography hierarchy for gap selection
4. Special: `element-gap-xs` only for label-input spacing

### When Designing Cards
1. Reference: `guidelines/token-reference.md` - Cards Layer Tokens
2. Use: `card-` prefixed tokens
3. Consider: Content density (sm/md/lg)
4. Surface: Use `surface-container` level

### When Designing Sections
1. Reference: `guidelines/token-reference.md` - Sections Layer Tokens
2. Use: `section-` prefixed tokens
3. Consider: Number of cards/forms being grouped
4. Surface: Use appropriate surface container level

### When Designing Modals
1. Reference: `guidelines/token-reference.md` - Modals Layer Tokens
2. Use: `modal-` prefixed tokens
3. Consider: Content complexity (sm/md/lg)
4. Surface: Use `surface-container-highest` for emphasis
5. Backdrop: Use `--color-scrim` for overlay

### When Designing Surfaces
1. Reference: `guidelines/token-reference.md` - Surfaces Layer Tokens
2. Use: `surface-` prefixed tokens
3. Consider: Content richness
4. Surface: Use `surface` or `surface-bright`

### When Designing Surface Containers
1. Reference: `guidelines/token-reference.md` - Surface Containers Layer Tokens
2. Use: `surface-container-` prefixed tokens
3. Consider: Navigation complexity
4. Surface: Use `surface-container-high` or `surface-container-highest`

## Common Patterns

### Button (Element)
```css
.button {
    padding: var(--size-element-pad-x-md) var(--size-element-pad-y-md);
    border-radius: var(--size-element-radius-sm);
    background-color: var(--color-primary);
    color: var(--color-on-primary);
}
```

### Card
```css
.card {
    padding: var(--size-card-pad-x-md) var(--size-card-pad-y-md);
    gap: var(--size-card-gap-md);
    border-radius: var(--size-card-radius-sm);
    background-color: var(--color-surface-container);
}
```

### Section
```css
.section {
    padding: var(--size-section-pad-x-md) var(--size-section-pad-y-md);
    gap: var(--size-section-gap-md);
}
```

### Modal
```css
.modal {
    padding: var(--size-modal-pad-x-md) var(--size-modal-pad-y-md);
    gap: var(--size-modal-gap-md);
    border-radius: var(--size-modal-radius-lg);
    background-color: var(--color-surface-container-highest);
}
```

## See Also

- **Token Reference**: `guidelines/token-reference.md` - Complete token reference
- **Coding Standards**: `guidelines/coding-standards.md` - Project rules and standards

