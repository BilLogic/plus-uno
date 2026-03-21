import React from 'react';
import VariwidthChart from './VariwidthChart';

export default {
    title: 'Data Visualizations/Distribution/VariwidthChart',
    component: VariwidthChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Variwidth Chart (Variwide)

A column chart where **column width varies** based on a second value.

---

### 📖 How to Read
- **Height (Y)** = Primary value (e.g., Score)
- **Width (Z)** = Secondary value/Weight (e.g., Number of students)
- **Area** = Total impact (Score * Students)

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Weighted comparisons | ✅ Ideal |
| Market share x Growth | ✅ Ideal |
| Cost x Volume | ✅ Ideal |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Subject Performance** | Avg Score (Height) x Enrollment Count (Width) |
| **Tutor Ratings** | Rating (Height) x Number of Reviews (Width) |
| **Feature Usage** | User Count (Height) x Time Spent (Width) |
                `
            }
        }
    }
};

const performanceData = {
    data: [
        { name: 'Math', y: 85, z: 120 },   // High score, many students
        { name: 'Science', y: 78, z: 90 }, // Mid score, mid students
        { name: 'Art', y: 92, z: 30 },     // Very high score, few students
        { name: 'History', y: 70, z: 80 }  // Lower score, mid students
    ],
    xAxisLabel: 'Subject',
    yAxisLabel: 'Average Score'
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Subject Performance (Height) vs Enrollment (Width)</h3>
            <VariwidthChart {...performanceData} />
        </section>
    </div>
);

export const Interactive = {
    args: {
        data: [
            { name: 'A', y: 50, z: 10 },
            { name: 'B', y: 30, z: 20 },
            { name: 'C', y: 40, z: 5 }
        ],
        height: 400
    }
};
