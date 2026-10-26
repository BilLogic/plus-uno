import React from 'react';
import { CATEGORICAL } from '@/dataviz/palette';
import StackedBarChart from './StackedBarChart';

export default {
    title: 'Data visualizations/Comparison/Stacked bar chart',
    component: StackedBarChart,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `## Stacked Bar Chart

A stacked bar chart shows **part-to-whole relationships within comparative categories**, stacking segments to show composition.

### Overview
A stacked bar chart shows **part-to-whole relationships within comparative categories**, stacking segments to show composition.

---

### How to Read
- **Each bar** = total value for that category
- **Segments** = components that make up the total
- **Segment height** = proportion of that component
- Compare both totals (bar height) and composition (segments)

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Part-to-whole by category | ✅ Ideal |
| Comparing totals + composition | ✅ Ideal |
| Budget breakdowns over time | ✅ Good |
| Single-variable comparison | ❌ Use Bar Chart |
| Showing 100% breakdown | ❌ Use 100% Stacked |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Learning Time** | Hours by subject, stacked by activity type |
| **Session Breakdown** | Total sessions, stacked by mode (1-on-1, group) |
| **Score Composition** | Total score, stacked by section |
| **Resource Usage** | Time by day, stacked by resource type |

---

### How to Use

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
                { value: '10', color: CATEGORICAL[0], height: '20' },
                { value: '40', color: CATEGORICAL[1], height: '80' }
            ]
        },
        {
            segments: [
                { value: '20', color: CATEGORICAL[0], height: '40' },
                { value: '30', color: CATEGORICAL[1], height: '60' }
            ]
        },
        {
            segments: [
                { value: '15', color: CATEGORICAL[0], height: '30' },
                { value: '35', color: CATEGORICAL[1], height: '70' }
            ]
        },
        {
            segments: [
                { value: '25', color: CATEGORICAL[0], height: '50' },
                { value: '25', color: CATEGORICAL[1], height: '50' }
            ]
        },
        {
            segments: [
                { value: '5', color: CATEGORICAL[0], height: '10' },
                { value: '45', color: CATEGORICAL[1], height: '90' }
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
            <p style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
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
                    { value: '30', color: CATEGORICAL[0], height: '60' },
                    { value: '20', color: CATEGORICAL[1], height: '40' }
                ]
            },
            {
                segments: [
                    { value: '25', color: CATEGORICAL[0], height: '50' },
                    { value: '25', color: CATEGORICAL[1], height: '50' }
                ]
            },
            {
                segments: [
                    { value: '40', color: CATEGORICAL[0], height: '80' },
                    { value: '10', color: CATEGORICAL[1], height: '20' }
                ]
            }
        ]
    }
};
