import React from 'react';
import SmartBarChart from './SmartBarChart';

export default {
    title: 'Data Visualizations/Comparison/SmartBarChart',
    component: SmartBarChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Smart Bar Chart

A smart bar chart helps compare and communicate key patterns in the underlying data.

### Overview
A smart bar chart helps compare and communicate key patterns in the underlying data.

---

### How to Read
- Start with the primary axis and labels to understand the scale
- Compare shapes, lengths, or positions to identify differences
- Use legend and annotations to interpret series or categories
- Look for outliers, clusters, or trend changes

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Communicating key comparisons | ✅ Ideal |
| Highlighting notable patterns | ✅ Ideal |
| Showing supporting context | ✅ Good |
| Displaying exact raw tables | ❌ Use data table |
| Dense exploratory analysis | ❌ Use interactive analysis view |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Learner Progress** | Compare progress metrics across cohorts |
| **Content Performance** | Highlight top and low performing modules |
| **Engagement Signals** | Surface usage patterns by period |
| **Program Outcomes** | Track outcomes across programs or terms |

---

### How to Use

**Best Practices:**
✅ Align the smart bar chart setup with the primary question you need to answer
✅ Keep labels, units, and legends explicit so interpretation is immediate
✅ Limit visual complexity to emphasize the most important pattern
✅ Use consistent color meaning across categories or series

**Avoid:**
❌ Mixing unrelated metrics without clarifying scale or context
❌ Overcrowding the chart with too many categories or series
❌ Using decorative styling that competes with the data
                `
            }
        }
    },
    argTypes: {
        height: { control: 'number' },
        data: { control: 'object' }
    }
};

const defaultData = {
    height: 200,
    data: [
        { letter: 'A', height: '100', color: 'var(--color-success-container, #ceeaaf)' },
        { letter: 'B', height: '75', color: 'var(--color-primary-container, #c3e8ff)' },
        { letter: 'C', height: '50', color: 'var(--color-warning-container, #fcdf8e)' },
        { letter: 'D', height: '25', color: 'var(--color-danger-container, #ffdad6)' },
        { letter: 'E', height: '0', color: 'var(--color-neutral-container, #dde3ea)' }
    ]
};

const weekdayData = {
    height: 300,
    data: [
        { letter: 'M', height: '40', color: 'var(--color-tertiary-container, #e8deff)' },
        { letter: 'T', height: '80', color: 'var(--color-secondary-container, #cfe4ff)' },
        { letter: 'W', height: '60', color: 'var(--color-info-container, #dde3ea)' },
        { letter: 'T', height: '90', color: 'var(--color-primary-container, #c3e8ff)' },
        { letter: 'F', height: '20', color: 'var(--color-success-container, #ceeaaf)' }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Grade Distribution</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows score distribution using filled bars against background context.
            </p>
            <SmartBarChart {...defaultData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Weekly Activity</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Visualizes activity levels across weekdays.
            </p>
            <SmartBarChart {...weekdayData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        height: 250,
        data: [
            { letter: '1', height: '60', color: 'var(--color-primary-container)' },
            { letter: '2', height: '80', color: 'var(--color-primary-container)' },
            { letter: '3', height: '45', color: 'var(--color-primary-container)' },
            { letter: '4', height: '90', color: 'var(--color-primary-container)' }
        ]
    }
};
