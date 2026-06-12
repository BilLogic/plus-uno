import React from 'react';
import ComboChart from './ComboChart';

export default {
    title: 'Data Visualizations/Temporal/ComboChart',
    component: ComboChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Combo Chart

A combo chart helps compare and communicate key patterns in the underlying data.

### Overview
A combo chart helps compare and communicate key patterns in the underlying data.

---

### How to Read
- Start with the primary axis and labels to understand the scale
- Compare shapes, lengths, or positions to identify differences
- Use legend and annotations to interpret series or categories
- Look for outliers, clusters, or trend changes

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Communicating key comparisons | ✅ Ideal |
| Highlighting notable patterns | ✅ Ideal |
| Showing supporting context | ✅ Good |
| Displaying exact raw tables | ❌ Use data table |
| Dense exploratory analysis | ❌ Use interactive analysis view |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Learner Progress** | Compare progress metrics across cohorts |
| **Content Performance** | Highlight top and low performing modules |
| **Engagement Signals** | Surface usage patterns by period |
| **Program Outcomes** | Track outcomes across programs or terms |

---

### How to Use

**Best Practices:**
✅ Align the combo chart setup with the primary question you need to answer
✅ Keep labels, units, and legends explicit so interpretation is immediate
✅ Limit visual complexity to emphasize the most important pattern
✅ Use consistent color meaning across categories or series

**Avoid:**
❌ Mixing unrelated metrics without clarifying scale or context
❌ Overcrowding the chart with too many categories or series
❌ Using decorative styling that competes with the data
                `
            }
        }
    },
    argTypes: {
        primaryAxisLabel: { control: 'text' },
        secondaryAxisLabel: { control: 'text' },
        categories: { control: 'object' },
        barData: { control: 'object' },
        lineData: { control: 'object' },
        height: { control: 'number' }
    }
};

const salesData = {
    primaryAxisLabel: 'Sales',
    secondaryAxisLabel: 'Profit Margin (%)',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    barData: [{ name: 'Sales', data: [100, 200, 150, 300, 250] }],
    lineData: [{ name: 'Margin', data: [10, 15, 12, 18, 14], yAxis: 1 }]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Sales vs Profit Margin</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Combines column (volume) with line (rate) using dual Y-axes.
            </p>
            <ComboChart {...salesData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        primaryAxisLabel: 'Primary Metric',
        secondaryAxisLabel: 'Secondary Metric',
        categories: ['Period 1', 'Period 2', 'Period 3', 'Period 4'],
        barData: [{ name: 'Volume', data: [50, 80, 60, 100] }],
        lineData: [{ name: 'Rate', data: [5, 8, 6, 10], yAxis: 1 }],
        height: 400
    }
};
