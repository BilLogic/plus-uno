import React from 'react';
import DumbbellChart from './DumbbellChart';

export default {
    title: 'Data Visualizations/Comparison/DumbbellChart',
    component: DumbbellChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Dumbbell Chart

A dumbbell chart shows the **change or gap between two values** for each category.

---

### 📖 How to Read
- **Two dots** = start and end values
- **Bar connecting** = range/change between them
- Longer bars = bigger changes/gaps
- Color can indicate direction (up/down)

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Before/after comparison | ✅ Ideal |
| Range visualization | ✅ Ideal |
| Gap analysis | ✅ Ideal |
| Single values | ❌ Use Lollipop |
| Time series | ❌ Use Line Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Score Changes** | Pre-test vs Post-test scores |
| **Progress Tracking** | Start vs Current level |
| **Salary Bands** | Min vs Max pay by role |
| **Goal Tracking** | Target vs Actual performance |

---

### 🛠️ How to Use

**Best Practices:**
✅ Sort by gap size for impact
✅ Use horizontal for long labels
✅ Color-code improvements vs declines
✅ Add value labels at both ends

**Avoid:**
❌ Too many categories (>15)
❌ Negative value ranges
❌ Missing context labels
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of {low, high} objects' },
        categories: { control: 'object', description: 'Category labels' },
        lowLabel: { control: 'text', description: 'Label for low value' },
        highLabel: { control: 'text', description: 'Label for high value' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
        height: { control: 'number', description: 'Chart height in pixels' },
        horizontal: { control: 'boolean', description: 'Horizontal orientation' }
    }
};

const scoreChangeData = {
    categories: ['Alice', 'Bob', 'Carol', 'David', 'Eve'],
    data: [
        { low: 65, high: 92 },
        { low: 58, high: 78 },
        { low: 72, high: 85 },
        { low: 45, high: 82 },
        { low: 80, high: 88 }
    ],
    lowLabel: 'Pre-test',
    highLabel: 'Post-test',
    yAxisLabel: 'Score'
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Score Changes</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Compare pre-test vs post-test scores to visualize improvement.
            </p>
            <DumbbellChart {...scoreChangeData} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        categories: ['Item A', 'Item B', 'Item C', 'Item D'],
        data: [
            { low: 20, high: 45 },
            { low: 30, high: 60 },
            { low: 15, high: 35 },
            { low: 40, high: 75 }
        ],
        lowLabel: 'Start',
        highLabel: 'End',
        yAxisLabel: 'Value',
        height: 400,
        horizontal: true
    }
};
