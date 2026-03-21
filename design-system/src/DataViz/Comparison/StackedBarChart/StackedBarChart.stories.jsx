import React from 'react';
import StackedBarChart from './StackedBarChart';

export default {
    title: 'Data Visualizations/Comparison/StackedBarChart',
    component: StackedBarChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Stacked Bar Chart

A stacked bar chart shows **part-to-whole relationships within comparative categories**, stacking segments to show composition.

---

### 📖 How to Read
- **Each bar** = total value for that category
- **Segments** = components that make up the total
- **Segment height** = proportion of that component
- Compare both totals (bar height) and composition (segments)

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Part-to-whole by category | ✅ Ideal |
| Comparing totals + composition | ✅ Ideal |
| Budget breakdowns over time | ✅ Good |
| Single-variable comparison | ❌ Use Bar Chart |
| Showing 100% breakdown | ❌ Use 100% Stacked |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Learning Time** | Hours by subject, stacked by activity type |
| **Session Breakdown** | Total sessions, stacked by mode (1-on-1, group) |
| **Score Composition** | Total score, stacked by section |
| **Resource Usage** | Time by day, stacked by resource type |

---

### 🛠️ How to Use

**Best Practices:**
✅ Use consistent segment colors across bars
✅ Order segments logically (most important at bottom)
✅ Include legend for segments
✅ Use 100% stacked for pure composition

**Avoid:**
❌ Too many segments (>5)
❌ Comparing non-adjacent segments
❌ Missing legends
                `
            }
        }
    },
    argTypes: {
        height: { control: 'number', description: 'Chart height in pixels' },
        dates: { control: 'object', description: 'Category labels' },
        data: { control: 'object', description: 'Array of { segments: [...] }' }
    }
};

const weeklyData = {
    height: 300,
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    data: [
        {
            segments: [
                { value: '10', color: 'var(--color-success-container)', height: '20', textColor: 'var(--color-on-success-container)' },
                { value: '40', color: 'var(--color-warning-container)', height: '80', textColor: 'var(--color-on-warning-container)' }
            ]
        },
        {
            segments: [
                { value: '20', color: 'var(--color-success-container)', height: '40', textColor: 'var(--color-on-success-container)' },
                { value: '30', color: 'var(--color-warning-container)', height: '60', textColor: 'var(--color-on-warning-container)' }
            ]
        },
        {
            segments: [
                { value: '15', color: 'var(--color-success-container)', height: '30', textColor: 'var(--color-on-success-container)' },
                { value: '35', color: 'var(--color-warning-container)', height: '70', textColor: 'var(--color-on-warning-container)' }
            ]
        },
        {
            segments: [
                { value: '25', color: 'var(--color-success-container)', height: '50', textColor: 'var(--color-on-success-container)' },
                { value: '25', color: 'var(--color-warning-container)', height: '50', textColor: 'var(--color-on-warning-container)' }
            ]
        },
        {
            segments: [
                { value: '5', color: 'var(--color-success-container)', height: '10', textColor: 'var(--color-on-success-container)' },
                { value: '45', color: 'var(--color-warning-container)', height: '90', textColor: 'var(--color-on-warning-container)' }
            ]
        }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Weekly Breakdown</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows part-to-whole relationships within comparison contexts.
            </p>
            <StackedBarChart {...weeklyData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        height: 300,
        dates: ['Jan', 'Feb', 'Mar'],
        data: [
            {
                segments: [
                    { value: '30', color: 'var(--color-primary-container)', height: '60', textColor: 'var(--color-on-primary-container)' },
                    { value: '20', color: 'var(--color-secondary-container)', height: '40', textColor: 'var(--color-on-secondary-container)' }
                ]
            },
            {
                segments: [
                    { value: '25', color: 'var(--color-primary-container)', height: '50', textColor: 'var(--color-on-primary-container)' },
                    { value: '25', color: 'var(--color-secondary-container)', height: '50', textColor: 'var(--color-on-secondary-container)' }
                ]
            },
            {
                segments: [
                    { value: '40', color: 'var(--color-primary-container)', height: '80', textColor: 'var(--color-on-primary-container)' },
                    { value: '10', color: 'var(--color-secondary-container)', height: '20', textColor: 'var(--color-on-secondary-container)' }
                ]
            }
        ]
    }
};
