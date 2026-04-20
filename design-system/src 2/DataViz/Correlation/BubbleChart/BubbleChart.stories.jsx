import React from 'react';
import BubbleChart from './BubbleChart';

export default {
    title: 'Data Visualizations/Correlation/BubbleChart',
    component: BubbleChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Bubble Chart

A bubble chart extends the scatter plot by using **bubble size as a third dimension**, allowing visualization of relationships between three variables.

---

### 📖 How to Read
- **X-axis position**: First variable value
- **Y-axis position**: Second variable value  
- **Bubble size**: Third variable magnitude
- Larger bubbles indicate higher values for the size variable

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Showing 3 variables at once | ✅ Ideal |
| Market/portfolio analysis | ✅ Ideal |
| Comparing groups with size metric | ✅ Good |
| Only 2 variables | ❌ Use Scatter Chart |
| Precise size comparisons | ❌ Use Bar Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Variables (X, Y, Size) |
|----------|------------------------|
| **Student Analysis** | Study hours, Test score, Assignments completed |
| **Class Performance** | Attendance %, Grade avg, Class size |
| **Tutor Workload** | Sessions/week, Avg rating, Student count |
| **Resource Allocation** | Cost, Impact, Usage volume |

---

### 🛠️ How to Use

**Best Practices:**
✅ Use clear axis labels with units
✅ Provide a size legend
✅ Use transparency for overlapping bubbles
✅ Limit to 2-3 series for clarity

**Avoid:**
❌ Too many bubbles (becomes cluttered)
❌ Very small size differences (hard to perceive)
❌ Missing size legend
                `
            }
        }
    },
    argTypes: {
        xAxisLabel: { control: 'text', description: 'Label for X axis' },
        yAxisLabel: { control: 'text', description: 'Label for Y axis' },
        zAxisLabel: { control: 'text', description: 'Label for bubble size' },
        data: { control: 'object', description: 'Series array { name, data: [[x,y,z],...] }' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const marketData = {
    xAxisLabel: 'Market Cap ($B)',
    yAxisLabel: 'Revenue ($B)',
    zAxisLabel: 'Employees (K)',
    data: [
        { name: 'Tech', data: [[150, 50, 100], [200, 80, 150], [100, 30, 50], [300, 120, 200]] },
        { name: 'Finance', data: [[80, 40, 80], [120, 60, 100], [60, 25, 40]] }
    ]
};

const educationData = {
    xAxisLabel: 'Study Hours',
    yAxisLabel: 'Test Score',
    zAxisLabel: 'Assignments Completed',
    data: [
        { name: 'Class A', data: [[10, 75, 8], [15, 82, 10], [20, 90, 12], [8, 68, 6]] },
        { name: 'Class B', data: [[12, 78, 9], [18, 88, 11], [5, 60, 4]] }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Market Analysis</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Bubble size represents number of employees.
            </p>
            <BubbleChart {...marketData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Performance</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Bubble size represents assignments completed.
            </p>
            <BubbleChart {...educationData} />
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
        zAxisLabel: 'Size',
        height: 400,
        data: [
            { name: 'Series A', data: [[10, 20, 30], [20, 40, 50], [30, 30, 40]] },
            { name: 'Series B', data: [[15, 35, 25], [25, 25, 35], [35, 45, 45]] }
        ]
    }
};
