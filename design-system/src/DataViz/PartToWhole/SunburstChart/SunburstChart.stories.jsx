import React from 'react';
import SunburstChart from './SunburstChart';

export default {
    title: 'Data Visualizations/PartToWhole/SunburstChart',
    component: SunburstChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Sunburst Chart

A sunburst chart displays **hierarchical data as nested rings**, radiating from centre outward.

---

### 📖 How to Read
- **Center** = root/top-level category
- **Outer rings** = child/nested levels
- **Arc size** = proportion relative to parent
- Click to drill down (if interactive)

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Hierarchical part-to-whole | ✅ Ideal |
| Multi-level drill-down | ✅ Ideal |
| Category breakdowns | ✅ Good |
| Flat data | ❌ Use Pie/Donut |
| Many levels (>4) | ❌ Use Treemap |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Curriculum Structure** | Subject → Unit → Lesson |
| **Competency Framework** | Domain → Skill → Indicator |
| **Time Breakdown** | Category → Subcategory → Activity |
| **Content Organization** | Library → Section → Resource |

---

### 🛠️ How to Use

**Best Practices:**
✅ Limit to 3-4 levels
✅ Use color to encode categories
✅ Enable drill-down interaction
✅ Show labels for major arcs

**Avoid:**
❌ Too many segments (illegible)
❌ Deep hierarchies (>4 levels)
❌ Flat data without hierarchy
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Hierarchical data { id, parent, name, value }' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const curriculumData = {
    data: [
        { id: '0', parent: '', name: 'Curriculum' },
        { id: '1', parent: '0', name: 'Math' },
        { id: '2', parent: '0', name: 'Science' },
        { id: '3', parent: '0', name: 'Language' },
        { id: '1.1', parent: '1', name: 'Algebra', value: 10 },
        { id: '1.2', parent: '1', name: 'Geometry', value: 8 },
        { id: '1.3', parent: '1', name: 'Calculus', value: 6 },
        { id: '2.1', parent: '2', name: 'Physics', value: 9 },
        { id: '2.2', parent: '2', name: 'Chemistry', value: 7 },
        { id: '2.3', parent: '2', name: 'Biology', value: 8 },
        { id: '3.1', parent: '3', name: 'Grammar', value: 5 },
        { id: '3.2', parent: '3', name: 'Literature', value: 7 },
        { id: '3.3', parent: '3', name: 'Writing', value: 6 }
    ]
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Curriculum Structure</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Click to drill down into subcategories.
            </p>
            <SunburstChart {...curriculumData} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        height: 400,
        data: [
            { id: 'root', parent: '', name: 'Root' },
            { id: 'a', parent: 'root', name: 'A' },
            { id: 'b', parent: 'root', name: 'B' },
            { id: 'a1', parent: 'a', name: 'A1', value: 10 },
            { id: 'a2', parent: 'a', name: 'A2', value: 15 },
            { id: 'b1', parent: 'b', name: 'B1', value: 20 },
            { id: 'b2', parent: 'b', name: 'B2', value: 10 }
        ]
    }
};
