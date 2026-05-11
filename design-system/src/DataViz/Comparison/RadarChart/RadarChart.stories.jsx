import React from 'react';
import RadarChart from './RadarChart';

export default {
    title: 'Data Visualizations/Comparison/RadarChart',
    component: RadarChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Radar Chart

A radar chart (spider/web chart) displays multivariate data on axes radiating from a center point, ideal for **comparing profiles across multiple dimensions**.

### Overview
A radar chart (spider/web chart) displays multivariate data on axes radiating from a center point, ideal for **comparing profiles across multiple dimensions**.

---

### How to Read
- Each **axis** represents a different variable/dimension
- **Distance from center** indicates value magnitude
- **Shape** of the polygon reveals the overall profile
- **Overlapping shapes** allow direct comparison between entities

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Comparing multivariate profiles | ✅ Ideal |
| Skill/competency assessments | ✅ Ideal |
| Product feature comparison | ✅ Good |
| Time-series data | ❌ Use Line Chart |
| Many variables (>8) | ❌ Use parallel coordinates |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **SMART Competencies** | Visualize student's 5-factor SMART profile |
| **Skill Assessment** | Compare skills across learning areas |
| **Tutor Evaluation** | Rate tutors on multiple criteria |
| **Class Comparison** | Compare class averages across subjects |
| **Progress Tracking** | Before/after skill development |

---

### How to Use

**Best Practices:**
✅ Limit to 3-8 axes for readability
✅ Use filled area to emphasize coverage
✅ Ensure consistent scale across all axes
✅ Use transparency for overlapping series

**Avoid:**
❌ Too many overlapping series (max 3)
❌ Inconsistent scales between axes
❌ Using for time-series data
                `
            }
        }
    },
    argTypes: {
        filled: { control: 'boolean', description: 'Fill the area under the line' },
        height: { control: 'number', description: 'Chart height in pixels' },
        yAxisMax: { control: 'number', description: 'Maximum value for y-axis' },
        categories: { control: 'object', description: 'Array of axis labels' },
        series: { control: 'object', description: 'Array of data series' }
    }
};

const budgetData = {
    categories: ['Sales', 'Marketing', 'Development', 'Customer Support', 'IT', 'Admin'],
    series: [
        { name: 'Allocated Budget', data: [43000, 19000, 60000, 35000, 17000, 10000] },
        { name: 'Actual Spending', data: [50000, 39000, 42000, 31000, 26000, 14000] }
    ],
    height: 400
};

const skillsData = {
    categories: ['Communication', 'Teamwork', 'Problem Solving', 'Technical Skills', 'Creativity'],
    yAxisMax: 5,
    series: [
        { name: 'Employee A', data: [4, 5, 3, 5, 4] },
        { name: 'Team Average', data: [3.5, 4, 3.5, 4, 3] }
    ],
    filled: true
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Line Radar (Default)</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Standard radar with line connections. Good for comparing metrics.
            </p>
            <RadarChart {...budgetData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Filled Area Radar</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Emphasizes the "volume" or overall capability coverage.
            </p>
            <RadarChart {...skillsData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        categories: ['Metric A', 'Metric B', 'Metric C', 'Metric D', 'Metric E'],
        series: [
            { name: 'Dataset 1', data: [80, 60, 90, 70, 85] },
            { name: 'Dataset 2', data: [60, 80, 50, 90, 70] }
        ],
        filled: false,
        height: 400,
        yAxisMax: 100
    }
};
