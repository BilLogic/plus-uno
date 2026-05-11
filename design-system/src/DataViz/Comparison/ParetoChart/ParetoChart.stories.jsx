import React from 'react';
import ParetoChart from './ParetoChart';

export default {
    title: 'Data Visualizations/Comparison/ParetoChart',
    component: ParetoChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Pareto Chart

Shows columns with a **cumulative percentage line** for 80-20 analysis.

### Overview
Shows columns with a **cumulative percentage line** for 80-20 analysis.

---

### How to Read
- **Bars** = individual category values
- **Line** = cumulative percentage
- Find where line crosses 80% for key factors

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| 80-20 analysis | ✅ Ideal |
| Root cause analysis | ✅ Ideal |
| Quality control | ✅ Good |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Support Issues** | Most common problems |
| **Student Struggles** | Top difficulty areas |
| **Usage Patterns** | Most used features |

---

### How to Use

**Best Practices:**
✅ Align the pareto chart setup with the primary question you need to answer
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
    }
};

const issuesData = {
    categories: ['Login Issues', 'Payment', 'Video', 'Schedule', 'Content', 'Other'],
    data: [45, 28, 15, 8, 5, 3],
    yAxisLabel: 'Tickets'
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Support Ticket Analysis</h3>
            <ParetoChart {...issuesData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        categories: ['A', 'B', 'C', 'D', 'E'],
        data: [50, 30, 12, 5, 3],
        yAxisLabel: 'Count',
        height: 400
    }
};
