import React from 'react';
import { BRAND, CATEGORICAL, CHROME, mostToLeast } from '@/dataviz/palette';
import DonutChart from './DonutChart';

export default {
    title: 'Data visualizations/Part-to-whole/Donut chart',
    component: DonutChart,
    tags: ['!dev', '!autodocs'],
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
✅ Sort segments from most to least, each a categorical color in order
✅ For progress, fill with \`chartPalette.BRAND\` on a \`chartPalette.CHROME.track\` remainder

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
        { value: 75, color: BRAND, label: 'Done' },
        { value: 25, color: CHROME.track, label: 'Remaining' }
    ]
};

const distributionData = {
    value: 'Total',
    label: 'Distribution',
    centerTextSize: 'h2',
    segments: [
        // Most to least, then each type a categorical series in order.
        ...mostToLeast([
            { value: 30, label: 'Type A' },
            { value: 20, label: 'Type B' },
            { value: 10, label: 'Type C' },
            { value: 40, label: 'Type D' }
        ], (s) => s.value).map((s, i) => ({ ...s, color: CATEGORICAL[i] }))
    ]
};

const smallData = {
    size: 150,
    value: '1/4',
    label: 'Step',
    centerTextSize: 'h3',
    segments: [
        { value: 25, color: BRAND, label: 'Current' },
        { value: 75, color: CHROME.track, label: 'Future' }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Completion Progress</h3>
            <p style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
                Simple two-segment donut showing progress.
            </p>
            <DonutChart {...completionData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Multi-Segment Distribution</h3>
            <p style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
                Shows distribution across multiple categories.
            </p>
            <DonutChart {...distributionData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Small Size</h3>
            <p style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
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
            { value: 50, color: CATEGORICAL[0], label: 'Segment A' },
            { value: 30, color: CATEGORICAL[1], label: 'Segment B' },
            { value: 20, color: CATEGORICAL[2], label: 'Segment C' }
        ]
    }
};
