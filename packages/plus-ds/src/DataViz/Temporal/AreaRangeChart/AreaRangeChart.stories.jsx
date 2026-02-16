import React from 'react';
import AreaRangeChart from './AreaRangeChart';

export default {
    title: 'Data Visualizations/Temporal/AreaRangeChart',
    component: AreaRangeChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Area Range Chart

Shows a **range of values over time** with a filled area between min and max.

---

### 📖 How to Read
- **Filled area** = range between low and high
- **Width of band** = variability at that point
- Wider band = more variation

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Confidence intervals | ✅ Ideal |
| Min/max over time | ✅ Ideal |
| Temperature ranges | ✅ Good |
| Single values | ❌ Use Line Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Score Bands** | Expected score range |
| **Activity Windows** | Peak usage times |
| **Performance Range** | Min/max ratings |
                `
            }
        }
    }
};

// Sample data: [x, low, high]
const temperatureData = {
    data: [
        [0, 14, 22], [1, 13, 23], [2, 15, 25], [3, 16, 24],
        [4, 18, 28], [5, 20, 30], [6, 22, 32], [7, 21, 31],
        [8, 19, 29], [9, 17, 27], [10, 15, 24], [11, 14, 22]
    ],
    xAxisLabel: 'Month',
    yAxisLabel: 'Temperature (°C)'
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Monthly Temperature Range</h3>
            <AreaRangeChart {...temperatureData} />
        </section>
    </div>
);

export const Interactive = {
    args: {
        data: [
            [0, 10, 20], [1, 12, 22], [2, 15, 25], [3, 18, 28], [4, 16, 24]
        ],
        xAxisLabel: 'Time',
        yAxisLabel: 'Value',
        height: 400
    }
};
