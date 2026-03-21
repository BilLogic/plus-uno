import React from 'react';
import SankeyDiagram from './SankeyDiagram';

export default {
    title: 'Data Visualizations/Other/SankeyDiagram',
    component: SankeyDiagram,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Sankey Diagram

A Sankey diagram visualizes **flow and transfer** between entities, with link width representing volume.

---

### 📖 How to Read
- **Nodes** = stages or entities
- **Links** = flow between nodes
- **Link width** = proportional to flow volume
- Follow the flow from left to right (or source to destination)

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Showing flows/transfers | ✅ Ideal |
| Energy/material flows | ✅ Ideal |
| User journey paths | ✅ Good |
| Simple comparisons | ❌ Use Bar Chart |
| Hierarchical data | ❌ Use Treemap |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Learning Pathways** | How students progress through modules |
| **Student Flow** | Enrollment → Engagement → Completion |
| **Resource Distribution** | Budget allocation across programs |
| **Referral Sources** | How students find the platform |
| **User Journeys** | Navigation paths through the app |

---

### 🛠️ How to Use

**Best Practices:**
✅ Order nodes logically (source → destination)
✅ Use distinct colors for major flows
✅ Include flow values in tooltips
✅ Limit to 5-7 stages for clarity

**Avoid:**
❌ Circular flows (sankey is directional)
❌ Too many nodes (becomes spaghetti)
❌ Unrelated categories in same diagram
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of [from, to, weight]' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const energyData = {
    data: [
        ['Solar', 'Electricity', 50],
        ['Wind', 'Electricity', 30],
        ['Coal', 'Electricity', 20],
        ['Electricity', 'Industry', 40],
        ['Electricity', 'Residential', 35],
        ['Electricity', 'Commercial', 25]
    ]
};

const userFlowData = {
    data: [
        ['Homepage', 'Products', 300],
        ['Homepage', 'About', 100],
        ['Homepage', 'Contact', 50],
        ['Products', 'Cart', 150],
        ['Products', 'Homepage', 50],
        ['Cart', 'Checkout', 100],
        ['Cart', 'Products', 30],
        ['Checkout', 'Purchase', 80]
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Energy Flow</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows flow from energy sources to sectors.
            </p>
            <SankeyDiagram {...energyData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>User Journey Flow</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Tracks user navigation patterns on a website.
            </p>
            <SankeyDiagram {...userFlowData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        height: 400,
        data: [
            ['A', 'X', 50],
            ['A', 'Y', 30],
            ['B', 'X', 40],
            ['B', 'Z', 20],
            ['X', 'Output', 60],
            ['Y', 'Output', 30],
            ['Z', 'Output', 20]
        ]
    }
};
