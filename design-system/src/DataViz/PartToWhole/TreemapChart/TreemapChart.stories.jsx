import React from 'react';
import TreemapChart from './TreemapChart';

export default {
    title: 'Data Visualizations/PartToWhole/TreemapChart',
    component: TreemapChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Treemap Chart

A treemap displays **hierarchical data as nested rectangles**, where rectangle size represents value.

### Overview
A treemap displays **hierarchical data as nested rectangles**, where rectangle size represents value.

---

### How to Read
- **Rectangle size** = proportional to the value
- **Nesting** = parent-child hierarchy
- **Color** = can encode category or additional metric
- Larger rectangles dominate; compare areas visually

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Hierarchical part-to-whole | ✅ Ideal |
| Storage/disk usage | ✅ Ideal |
| Budget allocation | ✅ Good |
| Time-series | ❌ Use Line/Area |
| Few categories | ❌ Use Pie/Donut |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Curriculum Breakdown** | Time spent per subject → topic → lesson |
| **Resource Allocation** | Budget by department → program → activity |
| **Content Library** | Materials by category → subcategory |
| **Student Distribution** | Students by grade → class → group |

---

### How to Use

**Best Practices:**
✅ Use for hierarchical data with clear parent-child relationships
✅ Color-code by category for visual grouping
✅ Include labels for major rectangles
✅ Allow drill-down for exploration

**Avoid:**
❌ Flat data without hierarchy
❌ Too many small rectangles (illegible)
❌ Comparing exact values (use bar charts)
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of { name, value } objects' },
        height: { control: 'number', description: 'Chart height in pixels' },
        colorByPoint: { control: 'boolean', description: 'Unique color per rectangle' }
    }
};

const budgetData = {
    data: [
        { name: 'Salaries', value: 50000 },
        { name: 'Marketing', value: 20000 },
        { name: 'Operations', value: 15000 },
        { name: 'R&D', value: 10000 },
        { name: 'Admin', value: 5000 }
    ]
};

const storageData = {
    data: [
        { name: 'Documents', value: 45 },
        { name: 'Photos', value: 30 },
        { name: 'Videos', value: 15 },
        { name: 'Apps', value: 7 },
        { name: 'Other', value: 3 }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Budget Allocation</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Rectangle size represents budget amount.
            </p>
            <TreemapChart {...budgetData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Storage Usage</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows how storage is distributed across file types.
            </p>
            <TreemapChart {...storageData} height={300} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        height: 400,
        colorByPoint: true,
        data: [
            { name: 'Category A', value: 100 },
            { name: 'Category B', value: 80 },
            { name: 'Category C', value: 60 },
            { name: 'Category D', value: 40 },
            { name: 'Category E', value: 20 }
        ]
    }
};
