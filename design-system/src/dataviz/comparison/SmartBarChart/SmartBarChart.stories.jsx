import React from 'react';
import SmartBarChart from './SmartBarChart';
import { BRAND, sequentialRamp } from '@/dataviz/palette';

/** A step of the blue ramp, 0 (lightest) to 3 (strongest). */
const grade = (step) => `var(${sequentialRamp('blue')[step]})`;

export default {
    title: 'Data visualizations/Comparison/Smart bar chart',
    component: SmartBarChart,
    tags: ['!dev', '!autodocs'],
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
        // Grades are ordinal: one hue, the strongest tone on the biggest share.
        { letter: 'A', height: '100', color: grade(3) },
        { letter: 'B', height: '75', color: grade(2) },
        { letter: 'C', height: '50', color: grade(1) },
        { letter: 'D', height: '25', color: grade(0) },
        { letter: 'E', height: '0', color: grade(0) }
    ]
};

const weekdayData = {
    height: 300,
    data: [
        // One series: every day takes the brand chart color.
        { letter: 'M', height: '40', color: BRAND },
        { letter: 'T', height: '80', color: BRAND },
        { letter: 'W', height: '60', color: BRAND },
        { letter: 'T', height: '90', color: BRAND },
        { letter: 'F', height: '20', color: BRAND }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Grade Distribution</h3>
            <p style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
                Shows score distribution using filled bars against background context.
            </p>
            <SmartBarChart {...defaultData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Weekly Activity</h3>
            <p style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
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
            { letter: '1', height: '60', color: BRAND },
            { letter: '2', height: '80', color: BRAND },
            { letter: '3', height: '45', color: BRAND },
            { letter: '4', height: '90', color: BRAND }
        ]
    }
};
