import React from 'react';
import BulletChart from './BulletChart';

export default {
    title: 'Data Visualizations/Comparison/BulletChart',
    component: BulletChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Bullet Chart

A bullet chart displays **actual vs target** performance with qualitative ranges, replacing gauges in dashboards.

---

### 📖 How to Read
- **Bar** = actual value
- **Vertical line** = target value
- **Background zones** = qualitative ranges (poor/ok/good)
- Bar reaching target = goal met

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| KPI vs target | ✅ Ideal |
| Goal progress | ✅ Ideal |
| Multiple metrics dashboard | ✅ Good |
| Single metric | ❌ Use Gauge |
| Time trends | ❌ Use Line Chart |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Session Goals** | Actual sessions vs weekly target |
| **Completion Rate** | Current % vs goal % |
| **Performance Metrics** | Score vs benchmark |
| **Revenue Targets** | Actual vs budget |

---

### 🛠️ How to Use

**Best Practices:**
✅ Use consistent color bands (red/yellow/green)
✅ Show clear target marker
✅ Compare multiple bullets vertically
✅ Include metric labels

**Avoid:**
❌ Inconsistent scales across bullets
❌ Missing target markers
❌ Too many range zones (>3)
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of { y, target }' },
        categories: { control: 'object', description: 'Metric labels' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const kpiData = {
    categories: ['Revenue', 'Profit', 'Customer Sat'],
    data: [
        { y: 78, target: 85 },
        { y: 65, target: 70 },
        { y: 92, target: 90 }
    ],
    height: 250
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>KPI Dashboard</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows actual vs target with quality ranges (red/yellow/green zones).
            </p>
            <BulletChart {...kpiData} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        categories: ['Metric'],
        data: [{ y: 75, target: 80 }],
        height: 120
    }
};
