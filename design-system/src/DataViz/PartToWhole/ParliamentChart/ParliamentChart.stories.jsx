import React from 'react';
import ParliamentChart from './ParliamentChart';

export default {
    title: 'Data Visualizations/PartToWhole/ParliamentChart',
    component: ParliamentChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Parliament Chart (Item Chart)

Shows **proportions using distinct markers** (dots) in a semi-circle.
Commonly used for parliament seat distributions but useful for any grouped count.

### Overview
Shows **proportions using distinct markers** (dots) in a semi-circle.

---

### How to Read
- **Each dot** = one unit (e.g., one seat, one person)
- **Color** = group/party
- **Arrangement** = semi-circle layout

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Seat allocations | ✅ Ideal |
| Voting results | ✅ Ideal |
| Grouped unit counts | ✅ Good |
| Exact value comparison | ❌ Use Bar Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Class Composition** | Students by major |
| **Survey Respondents** | Users by type |
| **Resource Allocation** | Licenses by department |

---

### How to Use

**Best Practices:**
✅ Align the parliament chart setup with the primary question you need to answer
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

const parliamentData = {
    data: [
        { name: 'Liberals', value: 24, color: '#FFD700' },
        { name: 'Conservatives', value: 35, color: '#3366CC' },
        { name: 'Socialists', value: 18, color: '#DC3912' },
        { name: 'Greens', value: 12, color: '#109618' },
        { name: 'Independents', value: 6, color: '#990099' }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Council Seats</h3>
            <ParliamentChart {...parliamentData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        data: [
            { name: 'Group A', value: 10, color: '#AABBCC' },
            { name: 'Group B', value: 15, color: '#CCDDEE' },
            { name: 'Group C', value: 5, color: '#EEFF00' }
        ],
        height: 400
    }
};
