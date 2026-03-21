import React from 'react';
import WaterfallChart from './WaterfallChart';

export default {
    title: 'Data Visualizations/Temporal/WaterfallChart',
    component: WaterfallChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Waterfall Chart

A waterfall chart shows how a value changes through **sequential additions and subtractions**, displaying a running total.

---

### 📖 How to Read
- **First bar** = starting value
- **Green bars** = positive additions
- **Red bars** = deductions/losses
- **Final bar** = ending total (sum)
- Each bar floats from previous endpoint

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Financial statements (P&L) | ✅ Ideal |
| Progress/cumulative changes | ✅ Ideal |
| Variance analysis | ✅ Good |
| Unordered comparisons | ❌ Use Bar Chart |
| Part-to-whole | ❌ Use Stacked Bar |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Budget Tracking** | Starting budget → changes → remaining |
| **Score Progression** | Base score + bonus - penalties = final |
| **Enrollment Changes** | Start → additions → dropouts → current |
| **Progress Tracking** | Initial → completed → added → total |

---

### 🛠️ How to Use

**Best Practices:**
✅ Use green for additions, red for subtractions
✅ Include summary bars (totals)
✅ Label each step clearly
✅ Show intermediate totals if needed

**Avoid:**
❌ Non-sequential data
❌ Too many intermediate steps (>10)
❌ Missing color legend
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of values or { y, isSum } objects' },
        categories: { control: 'object', description: 'Category labels' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const profitData = {
    categories: ['Start', 'Product', 'Services', 'Costs', 'Marketing', 'Final'],
    data: [
        { y: 1000, color: 'var(--color-primary)' },
        500,
        200,
        -150,
        -100,
        { isSum: true, color: 'var(--color-primary)' }
    ],
    yAxisLabel: 'Revenue ($)'
};

/**
 * Overview: Displays all chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Profit & Loss</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows how revenue changes through different factors.
            </p>
            <WaterfallChart {...profitData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        categories: ['Initial', 'Add 1', 'Add 2', 'Subtract', 'Total'],
        data: [100, 50, 30, -40, { isSum: true }],
        yAxisLabel: 'Value',
        height: 400
    }
};
