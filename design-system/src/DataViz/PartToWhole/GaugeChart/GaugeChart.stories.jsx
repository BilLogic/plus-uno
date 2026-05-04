import React from 'react';
import GaugeChart from './GaugeChart';

export default {
    title: 'Data Visualizations/PartToWhole/GaugeChart',
    component: GaugeChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Gauge Chart

A gauge chart displays a **single value on a dial**, perfect for KPIs and progress indicators.

### Overview
A gauge chart displays a **single value on a dial**, perfect for KPIs and progress indicators.

---

### How to Read
- **Needle/fill position** indicates current value
- **Scale** shows the range (min to max)
- **Center text** displays the exact value
- Color zones can indicate performance thresholds

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Single KPI display | ✅ Ideal |
| Progress toward goal | ✅ Ideal |
| Performance dashboards | ✅ Good |
| Multiple values | ❌ Use Bar/Donut |
| Trend over time | ❌ Use Line Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Completion Rate** | Course/module completion % |
| **Session Goals** | Sessions completed vs target |
| **Student Progress** | Learning objectives achieved |
| **Platform Health** | System uptime, response time |
| **Tutor Metrics** | Student satisfaction score |

---

### How to Use

**Best Practices:**
✅ Use sparingly for key metrics only
✅ Include clear min/max labels
✅ Add color zones for thresholds (red/yellow/green)
✅ Show exact value in center

**Avoid:**
❌ Too many gauges on one dashboard
❌ Comparing multiple gauges (use bar charts)
❌ Complex scales or many tick marks
                `
            }
        }
    },
    argTypes: {
        value: { control: { type: 'number', min: 0, max: 100 }, description: 'Current value' },
        min: { control: 'number', description: 'Minimum scale value' },
        max: { control: 'number', description: 'Maximum scale value' },
        label: { control: 'text', description: 'Label below value' },
        height: { control: 'number', description: 'Chart height in pixels' },
        color: { control: 'color', description: 'Gauge fill color' }
    }
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Performance Gauges</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows KPIs at a glance.
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <GaugeChart value={75} label="Completion" />
                <GaugeChart value={92} label="Accuracy" color="var(--color-success)" />
                <GaugeChart value={45} label="Engagement" color="var(--color-warning)" />
            </div>
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        value: 65,
        min: 0,
        max: 100,
        label: 'Progress',
        height: 300
    }
};
