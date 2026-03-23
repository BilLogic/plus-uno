import React from 'react';
import PyramidChart from './PyramidChart';

export default {
    title: 'Data Visualizations/PartToWhole/PyramidChart',
    component: PyramidChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Pyramid Chart

Shows **hierarchical quantities** from largest at bottom to smallest at top.

---

### 📖 How to Read
- **Width** = relative size/quantity
- **Position** = hierarchical level
- Bottom = largest, Top = smallest

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Sales funnel stages | ✅ Ideal |
| Population pyramids | ✅ Ideal |
| Maslow's hierarchy | ✅ Good |
| Equal portions | ❌ Use Pie Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Student Funnel** | Prospects → Enrolled |
| **Learning Stages** | Awareness → Mastery |
| **Support Escalation** | Self-help → Expert |
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
