import React from 'react';
import PackedBubbleChart from './PackedBubbleChart';

export default {
    title: 'Data Visualizations/Correlation/PackedBubbleChart',
    component: PackedBubbleChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Packed Bubble Chart

Shows **grouped bubbles** where size represents quantity and color represents category.

### Overview
Shows **grouped bubbles** where size represents quantity and color represents category.

---

### How to Read
- **Bubble size** = value magnitude
- **Bubble color** = category group
- **Clustering** = related items grouped together

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Grouped comparisons | ✅ Ideal |
| Category clusters | ✅ Ideal |
| Market share by segment | ✅ Good |
| Precise comparisons | ❌ Use Bar Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Subject Enrollment** | Students by subject area |
| **Tutor Expertise** | Tutors by specialty |
| **Content Library** | Lessons by category |

---

### How to Use

**Best Practices:**
✅ Align the packed bubble chart setup with the primary question you need to answer
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

const enrollmentData = {
    data: [
        {
            name: 'Math',
            data: [
                { name: 'Algebra', value: 250 },
                { name: 'Geometry', value: 180 },
                { name: 'Calculus', value: 120 }
            ]
        },
        {
            name: 'Science',
            data: [
                { name: 'Physics', value: 200 },
                { name: 'Chemistry', value: 175 },
                { name: 'Biology', value: 220 }
            ]
        },
        {
            name: 'Languages',
            data: [
                { name: 'English', value: 300 },
                { name: 'Spanish', value: 150 },
                { name: 'French', value: 80 }
            ]
        }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Enrollment by Subject</h3>
            <PackedBubbleChart {...enrollmentData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        data: [
            {
                name: 'Group A',
                data: [
                    { name: 'Item 1', value: 100 },
                    { name: 'Item 2', value: 80 }
                ]
            },
            {
                name: 'Group B',
                data: [
                    { name: 'Item 3', value: 120 },
                    { name: 'Item 4', value: 60 }
                ]
            }
        ],
        height: 500,
        splitSeries: true
    }
};
