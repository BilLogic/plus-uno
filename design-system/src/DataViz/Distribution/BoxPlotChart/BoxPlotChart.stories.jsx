import React from 'react';
import BoxPlotChart from './BoxPlotChart';

export default {
    title: 'Data Visualizations/Distribution/BoxPlotChart',
    component: BoxPlotChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Box Plot Chart

A box plot shows **statistical distribution** with minimum, Q1, median, Q3, and maximum values.

### Overview
A box plot shows **statistical distribution** with minimum, Q1, median, Q3, and maximum values.

---

### How to Read
- **Box** spans from Q1 (25th percentile) to Q3 (75th percentile)
- **Line inside box** = median (50th percentile)
- **Whiskers** extend to min and max values
- **Box width** = interquartile range (IQR), represents middle 50% of data

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Comparing distributions | ✅ Ideal |
| Statistical analysis | ✅ Ideal |
| Identifying outliers | ✅ Good |
| Showing exact values | ❌ Use Bar Chart |
| Time trends | ❌ Use Line Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Test Score Distribution** | Compare score spreads across classes |
| **Session Duration** | Analyze tutoring session length patterns |
| **Response Times** | Compare platform performance metrics |
| **Assignment Grades** | Distribution by assignment type |
| **Tutor Ratings** | Rating distribution by subject |

---

### How to Use

**Best Practices:**
✅ Label axes clearly with units
✅ Show outliers as individual points
✅ Use consistent scales when comparing
✅ Include sample size in labels if relevant

**Avoid:**
❌ Small sample sizes (<10 per group)
❌ Non-numeric data
❌ Comparing too many groups (>10)
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of [min, Q1, median, Q3, max]' },
        categories: { control: 'object', description: 'Category labels' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const testScoresData = {
    categories: ['Class A', 'Class B', 'Class C', 'Class D'],
    data: [
        [55, 65, 78, 88, 95],  // Class A: min, Q1, median, Q3, max
        [60, 70, 82, 90, 98],  // Class B
        [50, 60, 72, 85, 92],  // Class C
        [45, 58, 70, 80, 88]   // Class D
    ],
    yAxisLabel: 'Test Score'
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Test Score Distribution by Class</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows min, Q1, median, Q3, and max for each class.
            </p>
            <BoxPlotChart {...testScoresData} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        categories: ['Group 1', 'Group 2', 'Group 3'],
        data: [
            [10, 25, 50, 75, 90],
            [20, 35, 55, 70, 85],
            [15, 30, 45, 65, 80]
        ],
        yAxisLabel: 'Value',
        height: 400
    }
};
