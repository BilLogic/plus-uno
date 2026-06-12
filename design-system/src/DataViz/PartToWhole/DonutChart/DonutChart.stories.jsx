import React from 'react';
import DonutChart from './DonutChart';

export default {
    title: 'Data Visualizations/PartToWhole/DonutChart',
    component: DonutChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Donut Chart

A donut chart shows **part-to-whole relationships** with a center cutout, ideal for displaying completion rates and KPIs.

### Overview
A donut chart shows **part-to-whole relationships** with a center cutout, ideal for displaying completion rates and KPIs.

---

### How to Read
- Each **segment** = a proportion of the whole
- **Segment size** = percentage of total
- **Center value** = key metric or total
- All segments should sum to 100%

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Progress indicators | ✅ Ideal |
| KPI displays | ✅ Ideal |
| 2-5 category proportions | ✅ Good |
| Comparing multiple items | ❌ Use Bar Chart |
| Precise comparisons | ❌ Use Bar Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Course Completion** | % of modules completed |
| **Goal Progress** | Sessions done vs target |
| **Skill Mastery** | Skills mastered vs total |
| **Engagement Rate** | Active vs inactive students |
| **Time Allocation** | Time spent per subject |

---

### How to Use

**Best Practices:**
✅ Limit to 5 or fewer segments
✅ Use center for key values
✅ Ensure segments sum to 100%
✅ Use contrasting colors

**Avoid:**
❌ Comparing multiple donuts
❌ Many small segments
❌ Precise value comparisons
                `
            }
        }
    },
    argTypes: {
        size: { control: { type: 'number', min: 100, max: 500, step: 10 }, description: 'Diameter in pixels' },
        value: { control: 'text', description: 'Center value text' },
        label: { control: 'text', description: 'Center label below value' },
        centerTextSize: { control: { type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5'] } },
        segments: { control: 'object', description: 'Array of { value, color, label }' }
    }
};

const completionData = {
    value: '75%',
    label: 'Completed',
    segments: [
        { value: 75, color: 'var(--color-success)', label: 'Done' },
        { value: 25, color: 'var(--color-surface-container-high)', label: 'Remaining' }
    ]
};

const distributionData = {
    value: 'Total',
    label: 'Distribution',
    centerTextSize: 'h2',
    segments: [
        { value: 30, color: 'var(--color-success)', label: 'Type A' },
        { value: 20, color: 'var(--color-primary)', label: 'Type B' },
        { value: 10, color: 'var(--color-warning)', label: 'Type C' },
        { value: 40, color: 'var(--color-danger)', label: 'Type D' }
    ]
};

const smallData = {
    size: 150,
    value: '1/4',
    label: 'Step',
    centerTextSize: 'h3',
    segments: [
        { value: 25, color: 'var(--color-primary)', label: 'Current' },
        { value: 75, color: 'var(--color-surface-container-high)', label: 'Future' }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Completion Progress</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Simple two-segment donut showing progress.
            </p>
            <DonutChart {...completionData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Multi-Segment Distribution</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows distribution across multiple categories.
            </p>
            <DonutChart {...distributionData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Small Size</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Compact variant for dashboards or cards.
            </p>
            <DonutChart {...smallData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        size: 250,
        value: '50%',
        label: 'Label',
        centerTextSize: 'h2',
        segments: [
            { value: 50, color: 'var(--color-primary)', label: 'Segment A' },
            { value: 30, color: 'var(--color-secondary)', label: 'Segment B' },
            { value: 20, color: 'var(--color-tertiary)', label: 'Segment C' }
        ]
    }
};
