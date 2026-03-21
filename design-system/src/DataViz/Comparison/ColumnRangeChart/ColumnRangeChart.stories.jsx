import React from 'react';
import ColumnRangeChart from './ColumnRangeChart';

export default {
    title: 'Data Visualizations/Comparison/ColumnRangeChart',
    component: ColumnRangeChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Column Range Chart

Shows **ranges between minimum and maximum values** for each category using bars.

---

### 📖 How to Read
- **Bar extent** = range from low to high value
- **Bar position** = category on axis
- Compare ranges visually across categories

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Temperature ranges | ✅ Ideal |
| Schedule duration | ✅ Ideal |
| Salary bands | ✅ Good |
| Single values | ❌ Use Bar Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Session Durations** | Min/max lesson times |
| **Score Ranges** | Low/high by subject |
| **Availability Windows** | Tutor schedules |
                `
            }
        }
    }
};

const scheduleData = {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    data: [
        { low: 9, high: 17 },
        { low: 10, high: 18 },
        { low: 9, high: 16 },
        { low: 11, high: 19 },
        { low: 9, high: 15 }
    ],
    yAxisLabel: 'Hour'
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Weekly Schedule Availability</h3>
            <ColumnRangeChart {...scheduleData} />
        </section>
    </div>
);

export const Interactive = {
    args: {
        categories: ['A', 'B', 'C', 'D'],
        data: [
            { low: 10, high: 40 },
            { low: 20, high: 50 },
            { low: 5, high: 35 },
            { low: 15, high: 55 }
        ],
        yAxisLabel: 'Value',
        height: 400,
        horizontal: false
    }
};
