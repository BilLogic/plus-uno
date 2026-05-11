import React from 'react';
import PieChart from './PieChart';

export default {
    title: 'Data Visualizations/PartToWhole/PieChart',
    component: PieChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Pie Chart

A pie chart displays **parts of a whole** as slices of a circle. Best for showing simple proportions.

### Overview
A pie chart displays **parts of a whole** as slices of a circle.

---

### How to Read
- **Whole circle** = 100% of total
- **Each slice** = proportion of total
- **Slice angle** = percentage (360° = 100%)
- Compare slice sizes to understand proportions

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Simple part-to-whole | ✅ Ideal |
| 2-5 categories | ✅ Ideal |
| Showing single dominant share | ✅ Good |
| Comparing multiple charts | ❌ Use Bar Chart |
| Many categories (>5) | ❌ Use Treemap |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Subject Distribution** | Time spent per subject |
| **User Segments** | Student types breakdown |
| **Content Mix** | Resource types in library |
| **Engagement Sources** | How users found the platform |

---

### How to Use

**Best Practices:**
✅ Limit to 5 or fewer slices
✅ Order slices by size (largest first)
✅ Use contrasting colors
✅ Label slices with percentages

**Avoid:**
❌ Comparing multiple pie charts
❌ 3D effects (distorts perception)
❌ Many small slices
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of { name, y }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        showLegend: { control: 'boolean', description: 'Show legend' }
    }
};

const marketShareData = {
    data: [
        { name: 'Chrome', y: 65 },
        { name: 'Safari', y: 15 },
        { name: 'Firefox', y: 10 },
        { name: 'Edge', y: 7 },
        { name: 'Other', y: 3 }
    ]
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Browser Market Share</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Classic pie chart showing proportions.
            </p>
            <PieChart {...marketShareData} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        height: 400,
        showLegend: true,
        data: [
            { name: 'Category A', y: 40 },
            { name: 'Category B', y: 30 },
            { name: 'Category C', y: 20 },
            { name: 'Category D', y: 10 }
        ]
    }
};
