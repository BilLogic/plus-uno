import React from 'react';
import ArcDiagram from './ArcDiagram';

export default {
    title: 'Data Visualizations/Other/ArcDiagram',
    component: ArcDiagram,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Arc Diagram

Shows **nodes and links along a single axis** to visualize connections.

### Overview
Shows **nodes and links along a single axis** to visualize connections.

---

### How to Read
- **Nodes** = placed on a line
- **Arcs** = connections between nodes
- **Arc thickness** = strength/weight of connection

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Linear connections | ✅ Ideal |
| Story character interactions | ✅ Ideal |
| Step-based flows | ✅ Good |
| Complex networks | ❌ Use Network Graph |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Lesson Flow** | Valid transitions between lessons |
| **Student Interactions** | Connections between classmates |
| **Topic Relations** | Linked concepts |

---

### How to Use

**Best Practices:**
✅ Align the arc diagram setup with the primary question you need to answer
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

const connectionData = {
    data: [
        ['Math', 'Physics', 10],
        ['Math', 'Programming', 15],
        ['Physics', 'Chemistry', 8],
        ['Programming', 'Math', 5],
        ['English', 'History', 12]
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Subject Connections</h3>
            <ArcDiagram {...connectionData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        data: [
            ['A', 'B', 1],
            ['A', 'C', 2],
            ['B', 'C', 1],
            ['C', 'D', 3]
        ],
        height: 400
    }
};
