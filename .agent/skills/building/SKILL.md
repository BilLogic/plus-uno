---
name: building
description: Builds new PLUS components or prototypes from designs. Use when the user asks to "build", "create", "implement", "prototype", "mock up", or provides a Figma link/sketch. strictly adheres to the design system.
---

# Building

Create production-ready components or high-fidelity prototypes.

## When to Use

- **Builds:** User provides a hi-fi Figma link for a new design.
- **Prototypes:** User provides a sketch, screenshot, loose description, or asks to "prototype" something.
- **New Patterns:** Creating a pattern that doesn't exist in the codebase.

## Core Principle: No "Cheating"

**All** output, whether a "prototype" or a "production build," must be **high-fidelity** and **strictly adhere to the design system**.

1. **React always** — All prototypes and builds must use React (no plain HTML). Output `.jsx`, `.scss`, and `.stories.jsx` files.
2. **Design tokens only** — No hardcoded colors, spacing, or typography. Use `var(--color-*)`, `var(--size-*)`.
3. **PLUS components first** — Use components from `packages/plus-ds/src/components/` and `packages/plus-ds/src/specs/`. Only fall back to React-Bootstrap when no PLUS equivalent exists. Do **not** use raw React-Bootstrap or HTML when a PLUS component is available.
4. **Real Implementation** — No placeholders. If replicating a page, use the actual components that page uses (e.g., use `AdminDateRangeFilter` for admin filters, not a generic dropdown).

## Workflows

**All builds** output to `playground/prototyping/{user}/{project}/` to create interactive prototypes for designer testing. Valid code is required, but the goal is interaction, not shipping library code.

### 1. Build from Figma (Hi-Fi)
**Input:** High-fidelity Figma design.
**Output:** `playground/prototyping/{user}/{project}/`

**Protocol:**
1. Run Figma MCP (`get_code`, `get_image`).
2. Map to PLUS context level/components.
3. Implement with **React** (use PLUS components first, React-Bootstrap for layout/fallback).
4. Create `.jsx`, `.scss`, and `.stories.jsx` files.
5. Verify in Storybook/Local Dev.

### 2. Build from Sketch/Idea (Lo-Fi)
**Input:** Sketches, screenshots, wireframes, verbal descriptions.
**Output:** `playground/prototyping/{user}/{project}/`

**Modes:**

| Mode | When to use | What to say/provide |
|------|-------------|---------------------|
| **0→hi-fi** | Single screen. | "I have a sketch..." or "Imagine a dashboard..." |
| **Flow** | Multiple screens. | "Click through login -> dashboard" |
| **Remix** | Modify existing. | "Take this prototype and change X" |

**Protocol:**
1. Identify Mode (0→hi-fi, Flow, Remix).
2. Clarify requirements.
3. Implement with **React** (use PLUS components first, React-Bootstrap for layout/fallback).
4. Create `.jsx`, `.scss`, and `.stories.jsx` files.
5. Output to `playground/prototyping/`.

## Prototyping Mode Checks

**0→hi-fi checks:**
- Which PLUS context? (Admin, Login, etc.)
- Matching an existing page/spec? (Reuse those specific components!)
- Primary action/content blocks?

**Flow checks:**
- Exact sequence?
- Real routing or placeholder nav?
- User state simulation?

**Remix checks:**
- Target folder/URL?
- Precise change?
- New folder or overwrite?

## Technical Guidelines (CRITICAL)

### Card Styling Rules
When creating chart/data cards within Sections, **ALWAYS** follow these rules:

**Background Color Rule:**
Cards within Sections **MUST** use `surface-container-lowest` (white), NOT `surface-container-low` (gray).

**Standard Card SCSS Pattern:**
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

**Key Properties:**
- `background-color`: `var(--color-surface-container-lowest, #ffffff)` - White background
- `border-radius`: `var(--card-radius-sm, 12px)` - Consistent rounded corners
- `padding`: `var(--card-pad-y-lg, 24px) var(--card-pad-x-lg, 24px)` - Use card tokens
- `box-shadow`: `0px 1px 2px rgba(0, 0, 0, 0.05)` - Subtle elevation
- `min-height`: `376px` - Standard card height for charts

**Reference Files:**
- `packages/plus-ds/src/specs/Admin/Tutor Admin/Cards/TutorDataCard/TutorDataCard.scss`
- `packages/plus-ds/src/specs/Admin/Student Admin/Sections/StudentOverviewSection/StudentOverviewSection.scss`
- `packages/plus-ds/src/specs/Admin/Session Admin/Sections/SessionOverviewSection/SessionOverviewSection.scss`

### Table Styling Rules
When creating tables, **ALWAYS** follow these rules:

**Global Styles Apply Automatically:**
- Global styles in `packages/plus-ds/src/styles/main.scss` already set all Bootstrap `.table` elements to:
  - Transparent backgrounds (`background-color: transparent !important`)
  - No borders (`border-bottom-width: 0 !important`)

**What to Add in Custom SCSS:**
- Padding for cells: `var(--size-element-pad-sm, 12px) var(--size-element-pad-md, 16px)`
- Hover state for clickable rows: `background-color: var(--color-on-surface-state-08)`
- Font weight and color for headers
- Vertical alignment for cells

**What NOT to Add:**
- `background-color` to `thead`, `tbody`, `tr`, `th`, or `td`
- `border` or `border-bottom` to table elements
- Table wrapper backgrounds (use `transparent`)

**Standard Table SCSS Pattern:**
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

**Why `!important`?** Bootstrap's default table styles have high specificity. Using `!important` ensures our transparent backgrounds override Bootstrap's defaults.

**Reference:** `packages/plus-ds/src/specs/Admin/Student Admin/Tables/StudentsTable/StudentsTable.scss`

### Breakpoint Testing Rules
For full page layouts, **ALWAYS** include responsive breakpoint testing:

**Required Setup:**

1. **Import ResponsiveFrame:**
```jsx
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
```

2. **Add Breakpoint ArgType:**
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

3. **Add ResponsiveFrame Decorator:**
```jsx
decorators: [
    (Story, context) => (
        <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
            <Story />
        </ResponsiveFrame>
    ),
],
```

4. **Set Default Breakpoint:**
```jsx
export const Default = {
    args: {
        breakpoint: 'xl',
        // ... other args
    },
};
```

**Breakpoint Sizes:**

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| `md` | 768px | Tablet / Small laptop |
| `lg` | 1024px | Standard laptop |
| `xl` | 1440px | Desktop (default) |

**Reference Files:**
- Component: `packages/plus-ds/src/specs/Universal/ResponsiveFrame.jsx`
- Example: `packages/plus-ds/src/specs/Admin/Tutor Admin/Pages/TutorPerformancePage/TutorPerformancePage.stories.jsx`

### Chart Data Validation Rules
When creating charts, **ALWAYS** ensure chart data values are realistic:

**Automatic Scaling:**
The `StackedBarChart` component automatically calculates the y-axis maximum from your data:
- ✅ Bar values will always fit
- ✅ No manual calculation needed
- ✅ Just provide realistic data values

**Rules for Chart Data:**
1. **Bar Chart Values:** Provide realistic values. The y-axis will auto-scale to fit.
2. **Stacked Bar Charts:** Sum of all segments should be realistic (e.g., [20, 15, 10] instead of [100, 100, 100])
3. **Line Charts:** Values should be within percentage scale (0-100) for percentage charts

**Helper Functions:**
Use chart data helpers in `playground/prototyping/Ashley/_utils/chartDataHelpers.js`:

```javascript
import { calculateYAxisMax, validateChartData, generateRealisticChartData } from '../_utils/chartDataHelpers';

// Calculate appropriate max
const yAxisMax = calculateYAxisMax(chartData);

// Validate before using
const validation = validateChartData(chartData, yAxisMax);
if (!validation.valid) {
    console.error('Chart data issues:', validation.errors);
}

// Generate realistic test data
const testData = generateRealisticChartData(40, 4, 3); // max: 40, 4 bars, 3 segments
```

**Example:**
```javascript
// ✅ GOOD: Realistic values
const goodData = [
    { label: 'Week 1', values: [18, 12, 5] }, // Total: 35, y-axis will auto-scale to 40
    { label: 'Week 2', values: [20, 10, 5] },
];

// ❌ BAD: Unrealistic values
const badData = [
    { label: 'Week 1', values: [1000, 500, 200] }, // Too large
];
```

## Confirmation Template

Before coding, confirm the plan:

```
I will [build/prototype] a **[Component/Page]** using:

Mode: [Production Build / 0→hi-fi / Flow / Remix]
Input: [Figma Link / Sketch / Description]
Output Location: [path]

Components:
- `[Component]` from `packages/plus-ds/...`

Tokens:
- `--[token-name]`

Strict Adherence Check:
- [ ] React Only
- [ ] Tokens Only
- [ ] PLUS Components First
- [ ] No hardcoded styles
```

## References

- [Context Levels](../../develop/foundations/context-levels.md)
- [Terminology](../../develop/foundations/terminology.md)
- [Tech Stack](../../develop/foundations/tech-stack.md)
- [Tokens](../../packages/plus-ds/guidelines/design-tokens/colors.md) (and others in `packages/plus-ds/guidelines/design-tokens/`)