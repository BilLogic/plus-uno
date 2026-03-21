import React from 'react';
import AreaChart from './AreaChart';

export default {
    title: 'Data Visualizations/Temporal/AreaChart',
    component: AreaChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Area Chart

An area chart fills the space below a line, emphasizing **volume and magnitude over time**.

---

### 📖 How to Read
- **Line** shows the trend over time
- **Filled area** emphasizes cumulative magnitude
- **Stacked areas** show how parts contribute to total
- Height at any point = total value at that time

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Emphasizing volume/magnitude | ✅ Ideal |
| Stacked part-to-whole over time | ✅ Ideal |
| Simple trend lines | ❌ Use Line Chart |
| Precise value reading | ❌ Use Bar Chart |
| Many overlapping series | ❌ Use Line Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Cumulative Learning** | Total hours studied over semester |
| **Enrollment Growth** | Student count over time (stacked by grade) |
| **Session Volume** | Daily sessions by type (stacked) |
| **Progress Tracking** | Cumulative assignments completed |

---

### 🛠️ How to Use

**Best Practices:**
✅ Use transparency for overlapping areas
✅ Order stacked areas logically (largest at bottom)
✅ Include X-axis time labels
✅ Use consistent time intervals

**Avoid:**
❌ Too many overlapping unstacked areas
❌ Vastly different scales in same chart
❌ Missing axis labels
                `
            }
        }
    },
    argTypes: {
        xAxisLabel: { control: 'text', description: 'Label for X axis' },
        yAxisLabel: { control: 'text', description: 'Label for Y axis' },
        categories: { control: 'object', description: 'X-axis category labels' },
        series: { control: 'object', description: 'Array of series { name, data }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        stacked: { control: 'boolean', description: 'Stack areas on top of each other' }
    }
};

const revenueData = {
    xAxisLabel: 'Quarter',
    yAxisLabel: 'Revenue',
    data: [
        { name: 'Product A', data: [500, 700, 800, 1000] },
        { name: 'Product B', data: [300, 400, 500, 600] }
    ]
};

const stackedData = {
    xAxisLabel: 'Quarter',
    yAxisLabel: 'Revenue',
    stacking: 'normal',
    data: [
        { name: 'Product A', data: [500, 700, 800, 1000] },
        { name: 'Product B', data: [300, 400, 500, 600] }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Standard Area</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows magnitude of values over time.
            </p>
            <AreaChart {...revenueData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Stacked Area</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows how parts contribute to a total over time.
            </p>
            <AreaChart {...stackedData} />
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
        stacking: null,
        height: 300,
        data: [
            { name: 'Series 1', data: [100, 150, 120, 180, 200] },
            { name: 'Series 2', data: [80, 100, 90, 120, 140] }
        ]
    }
};
