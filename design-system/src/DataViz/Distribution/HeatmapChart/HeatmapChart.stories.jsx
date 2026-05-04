import React from 'react';
import HeatmapChart from './HeatmapChart';

export default {
    title: 'Data Visualizations/Distribution/HeatmapChart',
    component: HeatmapChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Heatmap Chart

A heatmap displays data as a **matrix of colored cells**, where color intensity represents value magnitude.

### Overview
A heatmap displays data as a **matrix of colored cells**, where color intensity represents value magnitude.

---

### How to Read
- **Rows/Columns** = categories being compared
- **Cell color** = value intensity (darker = higher)
- **Color scale** = reference for interpreting values
- Look for **patterns** in color distribution

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| 2D pattern analysis | ✅ Ideal |
| Time-based activity | ✅ Ideal |
| Correlation matrices | ✅ Good |
| Precise values | ❌ Use Table |
| Trends over time | ❌ Use Line Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Activity Patterns** | Sessions by day × hour |
| **Skill Matrix** | Students × skills mastered |
| **Engagement** | Subjects × engagement level |
| **Tutor Availability** | Time slots × days |
| **Performance Grid** | Students × assignments |

---

### How to Use

**Best Practices:**
✅ Use sequential color scale (light→dark)
✅ Include color legend
✅ Consider color-blind friendly palettes
✅ Add cell values if space permits

**Avoid:**
❌ Rainbow color scales
❌ Too many categories
❌ Missing legends
                `
            }
        }
    },
    argTypes: {
        xCategories: { control: 'object', description: 'Categories for X axis' },
        yCategories: { control: 'object', description: 'Categories for Y axis' },
        data: { control: 'object', description: 'Array of [x, y, value] points' },
        height: { control: 'number', description: 'Chart height in pixels' },
        minColor: { control: 'color', description: 'Color for minimum values' },
        maxColor: { control: 'color', description: 'Color for maximum values' }
    }
};

const activityData = {
    xCategories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    yCategories: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'],
    data: [
        [0, 0, 10], [0, 1, 19], [0, 2, 8], [0, 3, 24], [0, 4, 67], [0, 5, 52], [0, 6, 38],
        [1, 0, 25], [1, 1, 35], [1, 2, 42], [1, 3, 52], [1, 4, 78], [1, 5, 65], [1, 6, 45],
        [2, 0, 32], [2, 1, 45], [2, 2, 55], [2, 3, 48], [2, 4, 62], [2, 5, 58], [2, 6, 42],
        [3, 0, 28], [3, 1, 38], [3, 2, 48], [3, 3, 55], [3, 4, 72], [3, 5, 68], [3, 6, 52],
        [4, 0, 15], [4, 1, 22], [4, 2, 35], [4, 3, 45], [4, 4, 55], [4, 5, 48], [4, 6, 32]
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Weekly Activity Heatmap</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows user activity patterns by day and hour.
            </p>
            <HeatmapChart {...activityData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        xCategories: ['A', 'B', 'C', 'D'],
        yCategories: ['Row 1', 'Row 2', 'Row 3'],
        height: 300,
        minColor: '#c3e8ff',
        maxColor: '#0066cc',
        data: [
            [0, 0, 10], [0, 1, 20], [0, 2, 30],
            [1, 0, 40], [1, 1, 50], [1, 2, 60],
            [2, 0, 70], [2, 1, 80], [2, 2, 90],
            [3, 0, 25], [3, 1, 45], [3, 2, 65]
        ]
    }
};
