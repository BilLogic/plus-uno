# Storybook Organization Guidelines

This document defines the standard organization structure for Storybook stories across all atoms, molecules, and components in the PLUS Design System.

## Overview

All Storybook stories should follow a consistent organizational structure using subcategories to group related variants. This ensures:
- **Consistency**: All components follow the same pattern
- **Scalability**: Easy to add new variants without cluttering
- **Discoverability**: Related variants grouped together
- **Quick Access**: Overview stories always at top for quick reference
- **Flexibility**: Components can include only relevant subcategories

## Standard Structure

### Component Organization Pattern

```
ComponentName/
├── Overview/                    # Quick reference stories (always at top)
│   ├── AllVariants            # ALL combinations organized by style (style × size × fill × etc.)
│   └── Interactive             # Interactive playground with controls
│
├── Visual Style Variants/      # Visual style variants (one representative example per style)
│   ├── Primary                 # Shows ONE example (default size, filled) for style comparison
│   ├── Secondary               # Shows ONE example (default size, filled) for style comparison
│   ├── Tertiary
│   ├── Success
│   ├── Danger
│   ├── Warning
│   └── Info
│
├── States/                     # State variants (if applicable)
│   ├── Enabled
│   ├── Disabled
│   ├── Selected
│   └── Checked
│
├── Content Variants/           # Content-based variants (with icons, counters, etc.)
│   ├── WithIcons
│   ├── WithCounters
│   ├── WithSelectedItem
│   └── ...
│
└── Examples/                    # Real-world usage examples
    ├── BasicUsage
    └── AdvancedUsage
```

## File Structure

### Main Story File
- **Location**: `design-system/components/{atoms|molecules}/{ComponentName}/{ComponentName}.stories.js`
- **Contains**: Overview stories and top-level variant stories
- **Title**: `'Atoms/ComponentName'` or `'Molecules/ComponentName'`

### Subcategory Story Files
Create separate story files for subcategories when there are multiple related stories:

- **Visual Style Variants**: `{ComponentName}.StyleVariants.stories.js` (or `{ComponentName}.VisualStyleVariants.stories.js` for Icon)
  - Title: `'{Atoms|Molecules}/ComponentName/Visual Style Variants'`
  - Contains: One story per style variant (Primary, Secondary, etc.)
  - Use when: Component has multiple color/style variants (primary, secondary, success, etc.)
  - **Shows**: ONE representative example per style (default size, filled variant) for quick style comparison
  - **Note**: All size/fill combinations are shown in the main `AllVariants` story, not in individual style stories

- **States**: `{ComponentName}.States.stories.js` (if many state variants)
  - Title: `'{Atoms|Molecules}/ComponentName/States'`
  - Contains: State variant stories (Enabled, Disabled, Selected, etc.)

- **Content Variants**: `{ComponentName}.ContentVariants.stories.js` (if many content-based variants)
  - Title: `'{Atoms|Molecules}/ComponentName/Content Variants'`
  - Contains: Content-based variant stories (WithIcons, WithCounters, WithTitle, etc.)

## Story Naming Conventions

### Overview Stories (Always in Main File)
- `AllVariants` - Shows ALL combinations organized by visual style (each style shows all sizes × fills × layouts × etc.)
- `Interactive` - Interactive playground with Storybook controls

### Visual Style Variant Stories
- Use simple names: `Primary`, `Secondary`, `Tertiary`, `Success`, `Danger`, `Warning`, `Info`, `Error`
- Place in `StyleVariants.stories.js` file (or `VisualStyleVariants.stories.js` for Icon)
- Use when: Component has multiple color/style variants
- **Shows**: ONE representative example (default size, filled variant) for quick style comparison
- **Purpose**: Allow users to quickly compare different styles side-by-side
- **Note**: All size/fill/state combinations are consolidated in the main `AllVariants` story

### State Stories
- Use state names: `Enabled`, `Disabled`, `Selected`, `Checked`, `Unchecked`
- Place in `States.stories.js` file

### Content Variant Stories
- Use descriptive names: `WithIcons`, `WithCounters`, `WithSelectedItem`, `Dismissable`, `WithTitle`
- Place in `ContentVariants.stories.js` file
- Use when: Component has variants based on content/features (icons, counters, titles, etc.)

## Component-Specific Adaptations

### Simple Components (Divider, Typography)
- Only include relevant subcategories
- Skip empty categories
- May not need Visual Style Variants if no color variants
- **Divider**: Use Visual Style Variants to show light/dark styles with all stroke sizes

### Complex Components (Button, Dropdown)
- Include all applicable subcategories (Visual Style Variants, Size Variants, Content Variants, States)
- Use "AllCombinations" sparingly (only in Overview if needed)
- Group related content variants together
- **Button**: Visual Style Variants show all fills (filled, outline, tonal, text) within each style (Primary, Secondary, etc.)

### Status-Based Components (StatusIndicator, StatusTag)
- Replace "Visual Style Variants" with "Status Types" subcategory
- Stories: `Assigned`, `Started`, `NotStarted`, `Complete`
- Title: `'{Atoms|Molecules}/ComponentName/Status Types'`

### SMART Components (CompetencyPill)
- Replace "Visual Style Variants" with "Competency Areas" subcategory
- Stories: `SocialEmotional`, `MasteringContent`, `Advocacy`, `Relationships`, `TechnologyTools`
- Title: `'{Atoms|Molecules}/ComponentName/Competency Areas'`

### Typography Components
- Group by scale: `Display`, `Headlines`, `Titles`, `Body`
- Or create "Typography Scales" story showing all at once

## Consolidation Guidelines

### When to Consolidate Multiple Similar Stories

**Consolidate when:**
- Multiple stories differ only by a single parameter (e.g., item count, button count)
- Examples: Breadcrumb (SingleItem, TwoItems...SixItems) → "ItemCounts" story
- Examples: ButtonGroup (Horizontal2Buttons, Horizontal3Buttons...) → "Layouts" story

**Keep separate when:**
- Stories show significantly different visual patterns
- Stories demonstrate different use cases
- Stories are commonly referenced individually

### Consolidation Examples

**Before (Granular):**
```javascript
export const SingleItem = { ... };
export const TwoItems = { ... };
export const ThreeItems = { ... };
// ... up to SixItems
```

**After (Consolidated):**
```javascript
export const ItemCounts = {
  render: () => {
    // Show all item counts (1-6) in one story
  }
};
```

## Implementation Checklist

When creating or updating Storybook stories:

1. **Create Overview subcategory** (in main file):
   - [ ] Add `AllVariants` story showing ALL combinations organized by visual style
   - [ ] Add `Interactive` story with controls

2. **Create Visual Style Variants subcategory** (if applicable):
   - [ ] Create `{ComponentName}.StyleVariants.stories.js` (or `VisualStyleVariants.stories.js` for Icon)
   - [ ] Add one story per style variant (Primary, Secondary, etc.)
   - [ ] Use title: `'{Atoms|Molecules}/ComponentName/Visual Style Variants'`
   - [ ] Use when: Component has multiple color/style variants
   - [ ] **Show**: ONE representative example per style (default size, filled variant) for quick comparison
   - [ ] **Purpose**: Allow users to quickly compare different styles side-by-side

4. **Create other subcategories** (as needed):
   - [ ] States subcategory (if many state variants)
   - [ ] Content Variants subcategory (if many content-based variants)

5. **Consolidate granular stories**:
   - [ ] Replace multiple similar stories with consolidated versions
   - [ ] Use descriptive names for consolidated stories

6. **Component-specific adaptations**:
   - [ ] Apply status-based naming for StatusIndicator/StatusTag
   - [ ] Apply competency-based naming for CompetencyPill
   - [ ] Group typography by scale

## Examples

### Button Component Structure
```
Molecules/Button/
├── Overview/
│   ├── AllVariants     # Shows all combinations: each style shows all fills × all sizes
│   └── Interactive
├── Visual Style Variants/
│   ├── Primary          # Shows ONE example (default size, filled) for style comparison
│   ├── Secondary        # Shows ONE example (default size, filled) for style comparison
│   └── ...
├── States/
│   ├── Enabled
│   └── Disabled
└── Content Variants/
    └── WithIcons
```

### Badge Component Structure
```
Molecules/Badge/
├── Overview/
│   ├── AllVariants     # Shows all combinations: each style shows all sizes (h1-h6, b1-b3)
│   └── Interactive
└── Visual Style Variants/
    ├── Primary          # Shows ONE example (b2 size) for style comparison
    ├── Secondary        # Shows ONE example (b2 size) for style comparison
    └── ...
```

### StatusIndicator Component Structure
```
Atoms/StatusIndicator/
├── Overview/
│   ├── AllStatuses
│   └── Interactive
└── Status Types/
    ├── Assigned
    ├── Started
    ├── NotStarted
    └── Complete
```

## Best Practices

1. **Always start with Overview**: Put `AllVariants` and `Interactive` at the top of the main file
2. **Use subcategories for groups**: When you have 3+ related stories, create a subcategory
3. **Keep main file focused**: Main file should have Overview (`AllVariants` + `Interactive`), not everything
4. **Consolidate all combinations**: `AllVariants` shows ALL combinations organized by visual style (each style shows all sizes × fills × layouts × etc.)
5. **Visual Style Variants show one example**: Each style story shows ONE representative example (default size, filled) for quick comparison
6. **Be consistent**: Follow the same pattern across all components
7. **Use appropriate subcategory names**:
   - **Visual Style Variants**: For color/style variations (primary, secondary, success, etc.) - shows ONE example per style for comparison
   - **Content Variants**: For content-based variations (with icons, counters, titles, etc.)
   - **States**: For state variations (enabled, disabled, selected, etc.)
8. **Document exceptions**: If a component needs a different structure, document why

## Maintenance

This guideline should be updated when:
- New variant types are discovered
- Organizational patterns need refinement
- Component-specific needs require new subcategory types

Last Updated: December 2024

## Naming Conventions Summary

- **AllVariants**: Shows ALL combinations organized by visual style (each style shows all sizes × fills × layouts × etc.)
- **Visual Style Variants**: Use for color/style variations (primary, secondary, success, danger, warning, info, error) - shows ONE example per style for quick comparison
- **Content Variants**: Use for content-based variations (with icons, counters, titles, dismissable, etc.)
- **States**: Use for state variations (enabled, disabled, selected, checked, etc.)

## Key Principles

1. **Visual Style Variants = Quick Comparison**: Shows one representative example per style to allow users to quickly compare styles side-by-side
2. **All Variants = Comprehensive Reference**: Shows ALL possible combinations organized by visual style for complete reference
3. **No Separate Size Variants**: Size variants are consolidated into `AllVariants` to avoid redundancy
4. **Organization by Style**: `AllVariants` organizes all combinations by visual style first, then shows all other dimensions (sizes, fills, layouts, etc.) within each style

