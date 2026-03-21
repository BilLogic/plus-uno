import React from 'react';
import StreamgraphChart from './StreamgraphChart';

export default {
    title: 'Data Visualizations/Temporal/StreamgraphChart',
    component: StreamgraphChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Streamgraph Chart

Shows **composition changes over time** with flowing organic shapes.

---

### 📖 How to Read
- **Width** = relative value at that time
- **Flow** = trend direction
- **Colors** = different categories

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Trend evolution | ✅ Ideal |
| Topic popularity | ✅ Good |
| Proportions over time | ✅ Good |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Subject Popularity** | Enrollment trends |
| **Feature Usage** | Daily usage by feature |
| **Content Engagement** | Lesson views over time |
                `
            }
        }
    }
};

const usageData = {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
        { name: 'Math', data: [100, 120, 150, 180, 200, 220] },
        { name: 'Science', data: [80, 95, 110, 130, 145, 160] },
        { name: 'English', data: [60, 70, 85, 100, 115, 125] },
        { name: 'History', data: [40, 50, 60, 75, 85, 95] }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Subject Enrollment Trends</h3>
            <StreamgraphChart {...usageData} />
        </section>
    </div>
);

export const Interactive = {
    args: {
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
            { name: 'Series A', data: [10, 20, 30, 25] },
            { name: 'Series B', data: [15, 25, 20, 30] }
        ],
        height: 400
    }
};
