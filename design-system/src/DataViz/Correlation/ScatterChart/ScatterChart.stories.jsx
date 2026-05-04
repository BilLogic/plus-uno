import React from 'react';
import ScatterChart from './ScatterChart';

export default {
    title: 'Data Visualizations/Correlation/ScatterChart',
    component: ScatterChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Scatter Chart

A scatter chart plots data points on X-Y axes to reveal **relationships and correlations** between two variables.

### Overview
A scatter chart plots data points on X-Y axes to reveal **relationships and correlations** between two variables.

---

### How to Read
- Each **dot** represents one data point
- **X position** = first variable value
- **Y position** = second variable value
- Look for **patterns**: clusters, trends, outliers

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Finding correlations | ✅ Ideal |
| Identifying clusters | ✅ Ideal |
| Spotting outliers | ✅ Good |
| Categorical data | ❌ Use Bar Chart |
| 3 variables | ❌ Use Bubble Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Study vs Performance** | Hours studied vs test score |
| **Engagement Analysis** | Session time vs completion rate |
| **Tutor Effect** | Sessions with tutor vs grade improvement |
| **Attendance Impact** | Classes attended vs final grade |

---

### How to Use

**Best Practices:**
✅ Use clear axis labels with units
✅ Add trend line for correlations
✅ Use transparency for overlapping points
✅ Include gridlines for readability

**Avoid:**
❌ Categorical data (use bar charts)
❌ More than 3-4 series
❌ Varying point sizes (use Bubble Chart)
                `
            }
        }
    },
    argTypes: {
        xAxisLabel: { control: 'text', description: 'Label for the X axis' },
        yAxisLabel: { control: 'text', description: 'Label for the Y axis' },
        data: { control: 'object', description: 'Array of series { name, data: [[x,y],...] }' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const studyData = {
    xAxisLabel: 'Study Time (min)',
    yAxisLabel: 'Test Score',
    data: [
        { name: 'Class A', data: [[30, 60], [45, 75], [60, 85], [90, 95], [20, 55]] },
        { name: 'Class B', data: [[35, 65], [50, 70], [70, 80], [10, 40], [100, 90]] }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Study Time vs Test Score</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows correlation between study hours and performance.
            </p>
            <ScatterChart {...studyData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        xAxisLabel: 'X Axis',
        yAxisLabel: 'Y Axis',
        height: 400,
        data: [
            { name: 'Dataset 1', data: [[10, 20], [30, 40], [50, 60], [70, 80]] },
            { name: 'Dataset 2', data: [[15, 35], [25, 55], [45, 45], [65, 75]] }
        ]
    }
};
