import React from 'react';
import DependencyWheel from './DependencyWheel';

export default {
    title: 'Data Visualizations/Other/DependencyWheel',
    component: DependencyWheel,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Dependency Wheel

A dependency wheel shows **circular relationships** between entities, with connection width representing magnitude.

### Overview
A dependency wheel shows **circular relationships** between entities, with connection width representing magnitude.

---

### How to Read
- **Nodes** = entities around the circle
- **Chords** = connections between entities
- **Chord width** = strength of connection
- Follow chords to trace relationships

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Mutual dependencies | ✅ Ideal |
| Trade/flow relationships | ✅ Ideal |
| Interconnected systems | ✅ Good |
| Hierarchical data | ❌ Use Sunburst |
| Directional flows | ❌ Use Sankey |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Skill Dependencies** | How skills relate to each other |
| **Peer Learning** | Student collaboration patterns |
| **Content Links** | How topics reference each other |
| **Prerequisite Map** | Skill requirements visualization |

---

### How to Use

**Best Practices:**
✅ Limit to 10-15 nodes maximum
✅ Use color to group categories
✅ Show connection weights in tooltips
✅ Order nodes logically

**Avoid:**
❌ Too many nodes (becomes unreadable)
❌ Very weak connections (filter them out)
❌ Unrelated entities
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of [from, to, weight]' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const skillDependencies = {
    data: [
        ['Reading', 'Comprehension', 5],
        ['Reading', 'Vocabulary', 4],
        ['Writing', 'Grammar', 5],
        ['Writing', 'Vocabulary', 4],
        ['Math', 'Logic', 5],
        ['Logic', 'Problem Solving', 4],
        ['Comprehension', 'Critical Thinking', 3],
        ['Critical Thinking', 'Problem Solving', 4]
    ]
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Skill Dependencies</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows how skills depend on each other.
            </p>
            <DependencyWheel {...skillDependencies} />
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
            ['A', 'B', 5],
            ['A', 'C', 3],
            ['B', 'D', 4],
            ['C', 'D', 2],
            ['D', 'E', 3]
        ]
    }
};
