import React from 'react';
import FunnelChart from './FunnelChart';

export default {
    title: 'Data Visualizations/Other/FunnelChart',
    component: FunnelChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Funnel Chart

A funnel chart displays **sequential stages in a process**, showing how values decrease at each step.

### Overview
A funnel chart displays **sequential stages in a process**, showing how values decrease at each step.

---

### How to Read
- **Widest section** = starting point (most volume)
- **Narrowing** = drop-off at each stage
- **Width** = proportional to stage value
- Compare adjacent sections for conversion rates

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Sales pipelines | ✅ Ideal |
| Conversion funnels | ✅ Ideal |
| Process efficiency | ✅ Good |
| Non-sequential data | ❌ Use Bar Chart |
| Time-based trends | ❌ Use Line Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Student Journey** | Interest → Trial → Enrollment → Active |
| **Learning Path** | Started → Engaged → Completed → Certified |
| **Onboarding** | Sign-up → Profile → First Session → Regular |
| **Assessment Flow** | Started → Submitted → Passed |
| **Referral Process** | Referred → Signed Up → Converted |

---

### How to Use

**Best Practices:**
✅ Order from largest to smallest
✅ Show percentages with values
✅ Use consistent colors/gradient
✅ Label each stage clearly

**Avoid:**
❌ Non-sequential relationships
❌ More than 5-7 stages
❌ Stages that don't flow logically
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of { name, y } stage objects' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const salesData = {
    data: [
        { name: 'Leads', y: 1500 },
        { name: 'Qualified', y: 800 },
        { name: 'Proposal', y: 400 },
        { name: 'Negotiation', y: 200 },
        { name: 'Closed', y: 100 }
    ]
};

const enrollmentData = {
    data: [
        { name: 'Website Visits', y: 10000 },
        { name: 'Application Started', y: 3000 },
        { name: 'Application Submitted', y: 1500 },
        { name: 'Accepted', y: 800 },
        { name: 'Enrolled', y: 500 }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Sales Pipeline</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows conversion through sales stages.
            </p>
            <FunnelChart {...salesData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Enrollment Funnel</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Tracks prospective students through enrollment process.
            </p>
            <FunnelChart {...enrollmentData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        height: 400,
        data: [
            { name: 'Stage 1', y: 1000 },
            { name: 'Stage 2', y: 700 },
            { name: 'Stage 3', y: 400 },
            { name: 'Stage 4', y: 200 },
            { name: 'Stage 5', y: 100 }
        ]
    }
};
