import React from 'react';
import ParetoChart from './ParetoChart';

export default {
    title: 'Data Visualizations/Comparison/ParetoChart',
    component: ParetoChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Pareto Chart

Shows columns with a **cumulative percentage line** for 80-20 analysis.

---

### 📖 How to Read
- **Bars** = individual category values
- **Line** = cumulative percentage
- Find where line crosses 80% for key factors

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| 80-20 analysis | ✅ Ideal |
| Root cause analysis | ✅ Ideal |
| Quality control | ✅ Good |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Support Issues** | Most common problems |
| **Student Struggles** | Top difficulty areas |
| **Usage Patterns** | Most used features |
                `
            }
        }
    }
};

const issuesData = {
    categories: ['Login Issues', 'Payment', 'Video', 'Schedule', 'Content', 'Other'],
    data: [45, 28, 15, 8, 5, 3],
    yAxisLabel: 'Tickets'
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Support Ticket Analysis</h3>
            <ParetoChart {...issuesData} />
        </section>
    </div>
);

export const Interactive = {
    args: {
        categories: ['A', 'B', 'C', 'D', 'E'],
        data: [50, 30, 12, 5, 3],
        yAxisLabel: 'Count',
        height: 400
    }
};
