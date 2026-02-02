---
name: prototyping
description: Creates quick visual prototypes for exploration and testing. Use when the user asks to "prototype", "mock up", "demo", "try this out", or wants a quick visual without production polish. Works with lo-fi sketches, wireframes, or verbal descriptions.
---

# Prototyping

Rapid visual exploration before production.

## Input Types

| Fidelity | Examples | MCP? |
|----------|----------|------|
| Lo-fi | Hand sketches, screenshots, verbal descriptions | No |
| Mid-fi | Wireframes, rough Figma frames | No |

For hi-fi Figma designs, use the [building](../building/SKILL.md) skill instead.

## Protocol

1. Confirm what you're prototyping
2. Use existing components from `packages/plus-ds/src/`
3. Create in `playground/prototyping/[designer-name]/`
4. Focus on visual fidelity, not production-ready code
5. Document assumptions

## Directory Structure

```
playground/prototyping/
├── bill/
│   ├── login-page/
│   │   └── index.html
│   └── signup-page/
│       └── index.html
└── [designer-name]/
    └── [prototype-name]/
        └── index.html
```

## Template

Use this HTML template for prototypes:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Prototype Name]</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather+Sans:wght@300;400;700&display=swap" rel="stylesheet">
  
  <!-- Bootstrap 5.3 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <!-- Font Awesome -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
  
  <!-- PLUS Styles -->
  <link href="/dist/css/main.css" rel="stylesheet">
</head>
<body>
  <!-- Prototype content here -->
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

## Coding Guidelines

- Use PLUS token CSS variables (not hardcoded values)
- Prefer existing components over custom HTML
- It's OK to use placeholder images (`https://placehold.co/600x400`)
- Comment assumptions in the code

## Card Styling Rules (CRITICAL)

When creating prototypes with chart cards or data cards within Sections, **ALWAYS** follow these rules:

### Background Color Rule
Cards within Sections **MUST** use `surface-container-lowest` (white), NOT `surface-container-low` (gray).

**Correct:**
```scss
background-color: var(--color-surface-container-lowest, #ffffff);
```

**Incorrect:**
```scss
background-color: var(--color-surface-container-low, #f7f9fc);  // WRONG!
```

### Standard Card SCSS Pattern

```scss
.your-page__chart-card {
    // PLUS Pattern: Cards use surface-container-lowest (white) per design system rules
    // Reference: packages/plus-ds/src/specs/Admin/Tutor Admin/Cards/TutorDataCard/TutorDataCard.scss
    background-color: var(--color-surface-container-lowest, #ffffff);
    border-radius: var(--card-radius-sm, 12px);
    padding: var(--card-pad-y-lg, 24px) var(--card-pad-x-lg, 24px);
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: var(--size-element-gap-md, 16px);
    min-height: 376px;
}
```

### Key Properties
- `background-color`: `var(--color-surface-container-lowest, #ffffff)` - White background
- `border-radius`: `var(--card-radius-sm, 12px)` - Consistent rounded corners
- `padding`: `var(--card-pad-y-lg, 24px) var(--card-pad-x-lg, 24px)` - Use card tokens
- `box-shadow`: `0px 1px 2px rgba(0, 0, 0, 0.05)` - Subtle elevation
- `min-height`: `376px` - Standard card height for charts

### Reference Files
- `packages/plus-ds/src/specs/Admin/Tutor Admin/Cards/TutorDataCard/TutorDataCard.scss`
- `packages/plus-ds/src/specs/Admin/Student Admin/Sections/StudentOverviewSection/StudentOverviewSection.scss`
- `packages/plus-ds/src/specs/Admin/Session Admin/Sections/SessionOverviewSection/SessionOverviewSection.scss`
- `packages/plus-ds/src/specs/Admin/Tutor Admin/Pages/TutorStatusWarningsPage/TutorStatusWarningsPage.scss`

## Table Styling Rules (CRITICAL)

When creating prototypes with tables, **ALWAYS** follow these rules:

### Global Styles Apply Automatically
- Global styles in `packages/plus-ds/src/styles/main.scss` already set all Bootstrap `.table` elements to:
  - Transparent backgrounds (`background-color: transparent !important`)
  - No borders (`border-bottom-width: 0 !important`)

### What to Add in Custom SCSS
**ONLY** add these properties:
- Padding for cells: `var(--size-element-pad-sm, 12px) var(--size-element-pad-md, 16px)`
- Hover state for clickable rows: `background-color: var(--color-on-surface-state-08)`
- Font weight and color for headers
- Vertical alignment for cells

### What NOT to Add
**NEVER** add:
- `background-color` to `thead`, `tbody`, `tr`, `th`, or `td`
- `border` or `border-bottom` to table elements
- Table wrapper backgrounds (use `transparent`)

### Standard Table SCSS Pattern

**IMPORTANT**: Even though global styles handle transparency, Bootstrap's default table styles can sometimes override them. Use explicit `!important` overrides to ensure transparency, following the StudentsTable pattern:

```scss
.your-page__table-wrapper {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
}

.your-page__table {
    width: 100%;
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    background-color: transparent;
    
    thead {
        background-color: transparent !important;
        
        tr {
            background-color: transparent !important;
        }
        
        th {
            padding: var(--size-element-pad-sm, 12px) var(--size-element-pad-md, 16px);
            font-weight: 700;
            color: var(--color-on-surface, #1c1b1f);
            background-color: transparent !important;
            border: none;
            vertical-align: middle;
        }
    }

    tbody {
        tr {
            transition: background-color 0.2s ease;
            // Override Bootstrap table striping – rows should be transparent by default
            background-color: transparent !important;
            border: none;
            
            &.your-page__row--clickable {
                cursor: pointer;
                &:hover {
                    background-color: var(--color-on-surface-state-08);
                }
            }

            td {
                padding: var(--size-element-pad-sm, 12px) var(--size-element-pad-md, 16px);
                color: var(--color-on-surface, #1c1b1f);
                vertical-align: middle;
                background-color: transparent !important;
                border: none;
            }
        }
    }
}
```

**Why `!important`?**: Bootstrap's default table styles have high specificity. Using `!important` ensures our transparent backgrounds override Bootstrap's defaults, matching the pattern used in `StudentsTable.scss`.

**Reference**: See `packages/plus-ds/src/specs/Admin/Student Admin/Tables/StudentsTable/StudentsTable.scss` for the working pattern.

## Breakpoint Testing Rules (CRITICAL)

When creating prototypes with full page layouts, **ALWAYS** include responsive breakpoint testing to match the Admin spec pages.

### Required Setup

**1. Import ResponsiveFrame**

```jsx
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
```

**2. Add Breakpoint ArgType**

```jsx
argTypes: {
    breakpoint: {
        control: { type: 'select' },
        options: ['md', 'lg', 'xl'],
        description: 'Responsive breakpoint',
        table: { category: 'Responsive' },
    },
    // ... other argTypes
},
```

**3. Add ResponsiveFrame Decorator**

```jsx
decorators: [
    (Story, context) => (
        <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
            <Story />
        </ResponsiveFrame>
    ),
],
```

**4. Set Default Breakpoint in Stories**

```jsx
export const Default = {
    args: {
        breakpoint: 'xl',
        // ... other args
    },
};
```

### Breakpoint Sizes

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| `md` | 768px | Tablet / Small laptop |
| `lg` | 1024px | Standard laptop |
| `xl` | 1440px | Desktop (default) |

### What ResponsiveFrame Provides
- Interactive toolbar with breakpoint toggle buttons
- Centered frame that simulates viewport width
- Smooth transitions between breakpoints
- Visual boundary showing the simulated viewport

### Reference Files
- Component: `packages/plus-ds/src/specs/Universal/ResponsiveFrame.jsx`
- Example: `packages/plus-ds/src/specs/Admin/Tutor Admin/Pages/TutorPerformancePage/TutorPerformancePage.stories.jsx`

## Chart Data Validation Rules (CRITICAL)

When creating prototypes with charts, **ALWAYS** ensure chart data values align with y-axis scales:

### Automatic Scaling

The `StackedBarChart` component now **automatically calculates** the y-axis maximum from your data. This means:

- ✅ **Bar values will always fit** - The y-axis max is calculated from your data
- ✅ **No manual calculation needed** - Just provide realistic data values
- ✅ **Works globally** - All prototypes using `TutorChartsElement` Bar variant benefit

### Rules for Chart Data

1. **Bar Chart Values**: Provide realistic values. The y-axis will auto-scale to fit.
   - Individual segment values should be reasonable
   - Total of all segments in a bar should be reasonable
   - The chart will automatically set y-axis max to accommodate your data

2. **Stacked Bar Charts**: Sum of all segments in a bar should be realistic.
   - Example: If you have 3 segments, don't make them [100, 100, 100] (total 300)
   - Better: [20, 15, 10] (total 45) - chart will set y-axis max to 50

3. **Line Charts**: Values should be within percentage scale (0-100) for percentage charts.
   - Use `validateLineChartData()` helper if needed

### Helper Functions

Use the chart data helpers in `playground/prototyping/Ashley/_utils/chartDataHelpers.js`:

```javascript
import { calculateYAxisMax, validateChartData, generateRealisticChartData } from '../_utils/chartDataHelpers';

// Calculate appropriate max (if you need to know it)
const yAxisMax = calculateYAxisMax(chartData);
console.log('Y-axis will be set to:', yAxisMax);

// Validate before using (optional, but helpful)
const validation = validateChartData(chartData, yAxisMax);
if (!validation.valid) {
    console.error('Chart data issues:', validation.errors);
}

// Generate realistic test data
const testData = generateRealisticChartData(40, 4, 3); // max: 40, 4 bars, 3 segments
```

### Example: Realistic Bar Chart Data

```javascript
// ✅ GOOD: Realistic values - chart will auto-scale y-axis to fit
const goodData = [
    { label: 'Week 1', values: [18, 12, 5] }, // Total: 35, y-axis will be set to 40
    { label: 'Week 2', values: [20, 10, 5] }, // Total: 35
    { label: 'Week 3', values: [22, 8, 5] },  // Total: 35
];

// ❌ BAD: Unrealistic values (though chart will still scale, these don't make sense)
const badData = [
    { label: 'Week 1', values: [1000, 500, 200] }, // Too large, unrealistic
];
```

### What Changed

- **Before**: Y-axis was hardcoded to max 30, causing bars to exceed the scale
- **After**: Y-axis automatically calculates from data, ensuring all bars fit perfectly
- **Benefit**: No more manual calculation needed - just provide realistic data values

## References

- [Context Levels](../foundations/context-levels.md)
- [Tokens](../foundations/tokens.md)
