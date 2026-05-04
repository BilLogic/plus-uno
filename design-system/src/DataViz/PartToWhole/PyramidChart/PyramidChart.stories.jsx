import React from 'react';
import PyramidChart from './PyramidChart';

export default {
    title: 'Data Visualizations/PartToWhole/PyramidChart',
    component: PyramidChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Pyramid Chart

Shows **hierarchical quantities** from largest at bottom to smallest at top.

### Overview
Shows **hierarchical quantities** from largest at bottom to smallest at top.

---

### How to Read
- **Width** = relative size/quantity
- **Position** = hierarchical level
- Bottom = largest, Top = smallest

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Sales funnel stages | ✅ Ideal |
| Population pyramids | ✅ Ideal |
| Maslow's hierarchy | ✅ Good |
| Equal portions | ❌ Use Pie Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Student Funnel** | Prospects → Enrolled |
| **Learning Stages** | Awareness → Mastery |
| **Support Escalation** | Self-help → Expert |

---

### How to Use

**Best Practices:**
✅ Align the pyramid chart setup with the primary question you need to answer
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

const funnelData = {
    data: [
        { name: 'Website Visits', value: 15654 },
        { name: 'Trial Signups', value: 4064 },
        { name: 'Active Users', value: 1987 },
        { name: 'Paid Subscribers', value: 976 },
        { name: 'Premium Plans', value: 346 }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Acquisition Funnel</h3>
            <PyramidChart {...funnelData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        data: [
            { name: 'Stage 1', value: 1000 },
            { name: 'Stage 2', value: 600 },
            { name: 'Stage 3', value: 300 },
            { name: 'Stage 4', value: 100 }
        ],
        height: 400
    }
};
