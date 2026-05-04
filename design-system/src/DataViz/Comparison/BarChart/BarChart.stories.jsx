import React from 'react';
import BarChart from './BarChart';

export default {
    title: 'Data Visualizations/Comparison/BarChart',
    component: BarChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Bar Chart

A bar chart (or column chart) is one of the most common and effective data visualization types for **comparing categorical data**.

### Overview
A bar chart (or column chart) is one of the most common and effective data visualization types for **comparing categorical data**.

---

### How to Read
- **Height/Length** of each bar represents the value for that category
- **Grouped bars** allow comparison of multiple series within each category
- Compare bars visually by their relative lengths
- Look for the tallest/longest bars to identify highest values

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Comparing values across categories | ✅ Ideal |
| Showing rankings or ordered data | ✅ Ideal |
| Time-series with discrete periods | ✅ Good |
| Part-to-whole relationships | ❌ Use Pie/Donut |
| Continuous trends | ❌ Use Line Chart |

**Orientation Guide:**
- **Vertical (Column)**: Time-series, short labels, <7 categories
- **Horizontal (Bar)**: Long labels, many categories, rankings

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Student Enrollment** | Students enrolled per subject/grade |
| **Performance Comparison** | Average scores by class/teacher |
| **Resource Utilization** | Tutoring hours by subject area |
| **SMART Competencies** | Skill ratings across competency areas |
| **Session Analytics** | Sessions completed by day of week |

---

### How to Use

**Best Practices:**
✅ Start Y-axis at zero
✅ Sort bars by value when showing rankings
✅ Use consistent colors for same series
✅ Limit grouped bars to 2-3 series

**Avoid:**
❌ More than 12 categories
❌ Truncating Y-axis
❌ 3D effects
❌ Mixing stacked and grouped
                `
            }
        }
    },
    argTypes: {
        horizontal: { control: 'boolean', description: 'Display bars horizontally instead of vertically' },
        yAxisLabel: { control: 'text', description: 'Label for the value axis' },
        categories: { control: 'object', description: 'Array of category labels' },
        series: { control: 'object', description: 'Array of data series { name, data }' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

// Sample data for variants
const verticalData = {
    yAxisLabel: 'Enrolled Students',
    categories: ['Math', 'Science', 'History', 'Art'],
    series: [
        { name: '2023', data: [50, 40, 35, 60] },
        { name: '2024', data: [65, 55, 45, 70] }
    ]
};

const horizontalData = {
    horizontal: true,
    yAxisLabel: 'Completion Rate (%)',
    categories: ['Module 1', 'Module 2', 'Module 3'],
    series: [{ name: 'Avg', data: [85, 90, 75] }]
};

const groupedData = {
    yAxisLabel: 'Revenue',
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
        { name: 'Product A', data: [100, 150, 120, 180] },
        { name: 'Product B', data: [80, 110, 100, 140] },
        { name: 'Product C', data: [50, 80, 70, 90] }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Vertical (Column Chart)</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Default orientation. Best for time-series or short category labels.
            </p>
            <BarChart {...verticalData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Horizontal (Bar Chart)</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Use when category labels are long or you have many categories.
            </p>
            <BarChart {...horizontalData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Grouped (Multi-Series)</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Compare multiple data series side-by-side within each category.
            </p>
            <BarChart {...groupedData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        horizontal: false,
        yAxisLabel: 'Value',
        categories: ['Category A', 'Category B', 'Category C', 'Category D'],
        series: [
            { name: 'Series 1', data: [45, 72, 58, 91] },
            { name: 'Series 2', data: [32, 55, 48, 65] }
        ],
        height: 300
    }
};
