import React from 'react';
import ArcDiagram from './ArcDiagram';

export default {
    title: 'Data Visualizations/Other/ArcDiagram',
    component: ArcDiagram,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Arc Diagram

Shows **nodes and links along a single axis** to visualize connections.

---

### 📖 How to Read
- **Nodes** = placed on a line
- **Arcs** = connections between nodes
- **Arc thickness** = strength/weight of connection

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Linear connections | ✅ Ideal |
| Story character interactions | ✅ Ideal |
| Step-based flows | ✅ Good |
| Complex networks | ❌ Use Network Graph |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Lesson Flow** | Valid transitions between lessons |
| **Student Interactions** | Connections between classmates |
| **Topic Relations** | Linked concepts |
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
