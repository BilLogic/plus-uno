import React from 'react';
import LollipopChart from './LollipopChart';

export default {
    title: 'Data Visualizations/Comparison/LollipopChart',
    component: LollipopChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Lollipop Chart

A lollipop chart is a **cleaner alternative to bar charts**, using dots on stems instead of bars.

### Overview
A lollipop chart is a **cleaner alternative to bar charts**, using dots on stems instead of bars.

---

### How to Read
- **Dot position** = value for that category
- **Stem** = visual connection to axis
- Compare dot positions to compare values
- Easier to read with many categories

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Rankings with many items | ✅ Ideal |
| Clean value comparison | ✅ Ideal |
| Data with small differences | ✅ Good |
| Part-to-whole | ❌ Use Stacked Bar |
| Grouped comparisons | ❌ Use Bar Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Student Rankings** | Scores by student |
| **Content Popularity** | Lesson views by lesson |
| **Tutor Ratings** | Average ratings by tutor |
| **Subject Performance** | Average scores by subject |

---

### How to Use

**Best Practices:**
✅ Sort by value for rankings
✅ Use horizontally for long labels
✅ Highlight key items with color
✅ Add value labels at dots

**Avoid:**
❌ Grouped lollipops (confusing)
❌ Missing axis labels
❌ Inconsistent dot sizes
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of numerical values' },
        categories: { control: 'object', description: 'Category labels' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
        height: { control: 'number', description: 'Chart height in pixels' },
        horizontal: { control: 'boolean', description: 'Horizontal orientation' }
    }
};

const rankingData = {
    categories: ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace'],
    data: [95, 88, 82, 78, 72, 65, 58],
    yAxisLabel: 'Score'
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Rankings</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Clean alternative to bar charts for rankings.
            </p>
            <LollipopChart {...rankingData} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        categories: ['A', 'B', 'C', 'D', 'E'],
        data: [50, 40, 70, 30, 60],
        yAxisLabel: 'Value',
        height: 400,
        horizontal: true
    }
};
