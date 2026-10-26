import React from 'react';
import LineChart from './LineChart';

export default {
    title: 'Data visualizations/Temporal/Line chart',
    component: LineChart,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `## Line Chart

A line chart displays data as connected points, ideal for showing **trends over continuous time**.

### Overview
A line chart displays data as connected points, ideal for showing **trends over continuous time**.

---

### How to Read
- **Points** = data values at each time
- **Line** = trend connection between points
- **Slope up** = increasing trend
- **Slope down** = decreasing trend
- **Multiple lines** = comparison of trends

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Time-series trends | ✅ Ideal |
| Comparing multiple trends | ✅ Ideal |
| Continuous change | ✅ Good |
| Discrete categories | ❌ Use Bar Chart |
| Emphasizing volume | ❌ Use Area Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Progress Over Time** | Test scores over semester |
| **Engagement Trends** | Daily active users |
| **Performance Tracking** | Weekly session completion |
| **Comparison** | Multiple students' progress |
| **Forecasting** | Projected enrollment |

---

### How to Use

**Best Practices:**
✅ Use consistent time intervals
✅ Limit to 4-5 lines maximum
✅ Let the theme color the lines: one line takes the brand chart color, several take the categorical colors in order
✅ Label lines directly or add a dash style: line order cannot be controlled, so color alone is not enough
✅ Include legend for multiple series

**Avoid:**
❌ Unordered categorical data
❌ Data with large gaps
❌ "Spaghetti charts" (too many lines)
                `
            }
        }
    },
    argTypes: {
        xAxisLabel: { control: 'text', description: 'Label for the X axis' },
        yAxisLabel: { control: 'text', description: 'Label for the Y axis' },
        categories: { control: 'object', description: 'Array of X-axis labels' },
        series: { control: 'object', description: 'Array of series { name, data }' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const usersData = {
    xAxisLabel: 'Month',
    yAxisLabel: 'Active Users',
    data: [
        { name: '2023', data: [100, 120, 140, 130, 150, 170] },
        { name: '2024', data: [130, 150, 160, 180, 200, 220] }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Monthly Active Users</h3>
            <p style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
                Tracks user growth over time with year-over-year comparison.
            </p>
            <LineChart {...usersData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        xAxisLabel: 'Period',
        yAxisLabel: 'Value',
        height: 300,
        data: [
            { name: 'Series A', data: [10, 25, 15, 40, 35, 50] },
            { name: 'Series B', data: [20, 15, 30, 25, 45, 40] }
        ]
    }
};
