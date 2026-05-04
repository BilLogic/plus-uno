import React from 'react';
import HistogramChart from './HistogramChart';

export default {
    title: 'Data Visualizations/Distribution/HistogramChart',
    component: HistogramChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Histogram Chart

A histogram displays **frequency distribution** by grouping continuous data into bins.

### Overview
A histogram displays **frequency distribution** by grouping continuous data into bins.

---

### How to Read
- **X-axis** = value ranges (bins)
- **Y-axis** = count/frequency in each bin
- **Bar height** = number of data points in that range
- Shape reveals the distribution pattern

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Frequency distribution | ✅ Ideal |
| Understanding data spread | ✅ Ideal |
| Identifying patterns | ✅ Good |
| Categorical data | ❌ Use Bar Chart |
| Comparing groups | ❌ Use Box Plot |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Score Distribution** | How test scores are distributed |
| **Session Length** | Distribution of session durations |
| **Response Times** | Pattern of system response times |
| **Age Distribution** | Student age ranges |

---

### How to Use

**Best Practices:**
✅ Choose appropriate bin size
✅ Label axes clearly
✅ Consider overlaying distribution curve
✅ Use consistent bin widths

**Avoid:**
❌ Too few bins (loses detail)
❌ Too many bins (noise)
❌ Categorical data (use bar chart)
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of numerical values' },
        xAxisLabel: { control: 'text', description: 'X-axis label' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
        height: { control: 'number', description: 'Chart height in pixels' },
        binWidth: { control: 'number', description: 'Width of each bin' }
    }
};

// Generate sample test scores
const testScores = [
    65, 72, 78, 81, 83, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
    75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
    68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98
];

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Test Score Distribution</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows frequency distribution of student test scores.
            </p>
            <HistogramChart
                data={testScores}
                xAxisLabel="Score Range"
                yAxisLabel="Score"
            />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        data: [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10],
        xAxisLabel: 'Value Range',
        yAxisLabel: 'Value',
        height: 400
    }
};
