import React from 'react';
import TreegraphChart from './TreegraphChart';

export default {
    title: 'Data Visualizations/Other/TreegraphChart',
    component: TreegraphChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Treegraph Chart

Shows **hierarchical structures** like family trees or decision trees.

---

### 📖 How to Read
- **Nodes** = individual items
- **Connections** = parent-child relationships
- **Layout** = hierarchical tree structure

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Decision trees | ✅ Ideal |
| Family trees | ✅ Ideal |
| Process flows | ✅ Good |
| Org charts | ✅ Good (or use OrgChart) |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Prerequisite Chains** | Course dependencies |
| **Logic Flows** | Learning path decisions |
| **Categorization** | Topic hierarchy |
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
