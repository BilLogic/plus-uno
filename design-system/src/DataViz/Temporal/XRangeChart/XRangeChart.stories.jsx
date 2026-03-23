import React from 'react';
import XRangeChart from './XRangeChart';

export default {
    title: 'Data Visualizations/Temporal/XRangeChart',
    component: XRangeChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## X-Range Chart

Shows **ranges on an X-axis** (usually time). A simpler alternative to Gantt charts.

---

### 📖 How to Read
- **Bars** = duration of task/event
- **X-axis** = time
- **Y-axis** = category/resource

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Simple project schedules | ✅ Ideal |
| Resource booking | ✅ Ideal |
| Shift schedules | ✅ Ideal |
| Complex dependencies | ❌ Use Gantt Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Tutor Availability** | Time slots blocked out |
| **Exam Schedule** | Test durations |
| **Lesson Plan** | Topic duration estimates |
                `
            }
        }
    }
};

const now = new Date().getTime();
const day = 24 * 36e5;

const scheduleData = {
    categories: ['Tutor A', 'Tutor B', 'Tutor C'],
    data: [
        { start: now, end: now + day, y: 0, name: 'Math Session' },
        { start: now + day * 2, end: now + day * 3, y: 0, name: 'Physics Session' },
        { start: now, end: now + day * 2, y: 1, name: 'Chemistry Lab' },
        { start: now + day, end: now + day * 4, y: 2, name: 'English Class' }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Tutor Schedule</h3>
            <XRangeChart {...scheduleData} />
        </section>
    </div>
);

export const Interactive = {
    args: {
        categories: ['Resource 1', 'Resource 2'],
        data: [
            { start: now, end: now + day, y: 0, name: 'Task 1' },
            { start: now + day, end: now + day * 2, y: 1, name: 'Task 2' }
        ],
        height: 400
    }
};
