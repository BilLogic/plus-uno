import React from 'react';
import NetworkGraph from './NetworkGraph';

export default {
    title: 'Data Visualizations/Other/NetworkGraph',
    component: NetworkGraph,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Network Graph

A network graph shows **relationships and connections** between entities as nodes and links.

### Overview
A network graph shows **relationships and connections** between entities as nodes and links.

---

### How to Read
- **Nodes** = entities (people, concepts, items)
- **Links/edges** = relationships between entities
- **Clusters** = groups of closely connected nodes
- **Central nodes** = highly connected entities

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Showing relationships | ✅ Ideal |
| Social networks | ✅ Ideal |
| Concept maps | ✅ Good |
| Hierarchical data | ❌ Use Sunburst/Treemap |
| Sequential flows | ❌ Use Sankey |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Concept Maps** | How learning topics connect |
| **Student Networks** | Peer tutoring relationships |
| **Skill Dependencies** | Prerequisites between skills |
| **Tutor-Student Matching** | Assignment relationships |
| **Content Relationships** | How lessons relate to each other |

---

### How to Use

**Best Practices:**
✅ Use meaningful node labels
✅ Color-code node types
✅ Allow interactive exploration
✅ Show edge weights when relevant

**Avoid:**
❌ Too many nodes (>50 becomes cluttered)
❌ Missing labels
❌ Overlapping node positions
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of [from, to] connections' },
        nodes: { control: 'object', description: 'Optional node definitions' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const conceptMapData = {
    data: [
        ['Math', 'Algebra'],
        ['Math', 'Geometry'],
        ['Math', 'Statistics'],
        ['Algebra', 'Equations'],
        ['Algebra', 'Functions'],
        ['Geometry', 'Shapes'],
        ['Geometry', 'Proofs'],
        ['Statistics', 'Probability'],
        ['Statistics', 'Data Analysis']
    ]
};

const socialNetworkData = {
    data: [
        ['Alice', 'Bob'],
        ['Alice', 'Carol'],
        ['Bob', 'David'],
        ['Carol', 'David'],
        ['Carol', 'Eve'],
        ['David', 'Eve'],
        ['Eve', 'Frank']
    ]
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Concept Map</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows relationships between math concepts.
            </p>
            <NetworkGraph {...conceptMapData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Social Network</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows connections between people.
            </p>
            <NetworkGraph {...socialNetworkData} height={400} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        height: 500,
        data: [
            ['A', 'B'],
            ['A', 'C'],
            ['B', 'D'],
            ['C', 'D'],
            ['D', 'E']
        ],
        nodes: []
    }
};
