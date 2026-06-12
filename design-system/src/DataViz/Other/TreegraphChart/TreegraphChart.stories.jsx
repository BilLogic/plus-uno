import React from 'react';
import TreegraphChart from './TreegraphChart';

export default {
    title: 'Data Visualizations/Other/TreegraphChart',
    component: TreegraphChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Treegraph Chart

Shows **hierarchical structures** like family trees or decision trees.

### Overview
Shows **hierarchical structures** like family trees or decision trees.

---

### How to Read
- **Nodes** = individual items
- **Connections** = parent-child relationships
- **Layout** = hierarchical tree structure

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Decision trees | ✅ Ideal |
| Family trees | ✅ Ideal |
| Process flows | ✅ Good |
| Org charts | ✅ Good (or use OrgChart) |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Prerequisite Chains** | Course dependencies |
| **Logic Flows** | Learning path decisions |
| **Categorization** | Topic hierarchy |

---

### How to Use

**Best Practices:**
✅ Align the treegraph chart setup with the primary question you need to answer
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

const familyTreeData = {
    data: [
        { id: 'GP1', name: 'Grandparent 1' },
        { id: 'GP2', name: 'Grandparent 2' },
        { id: 'P1', parent: 'GP1', name: 'Parent 1' },
        { id: 'P2', parent: 'GP1', name: 'Parent 2' },
        { id: 'C1', parent: 'P1', name: 'Child 1' },
        { id: 'C2', parent: 'P1', name: 'Child 2' },
        { id: 'C3', parent: 'P2', name: 'Cousin 1' }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Course Prerequisites</h3>
            <TreegraphChart {...familyTreeData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        data: [
            { id: 'A', name: 'Root' },
            { id: 'B', parent: 'A', name: 'Branch 1' },
            { id: 'C', parent: 'A', name: 'Branch 2' },
            { id: 'D', parent: 'B', name: 'Leaf 1' }
        ],
        height: 500
    }
};
