import React from 'react';
import OrganizationChart from './OrganizationChart';

export default {
    title: 'Data Visualizations/Other/OrganizationChart',
    component: OrganizationChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Organization Chart

Shows **hierarchical organizational structures** with reporting lines.

### Overview
Shows **hierarchical organizational structures** with reporting lines.

---

### How to Read
- **Nodes** = people/roles
- **Lines** = reporting relationships
- **Levels** = hierarchy depth

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Team structures | ✅ Ideal |
| Reporting lines | ✅ Ideal |
| Decision hierarchies | ✅ Good |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Team Structure** | Tutor organization |
| **Course Hierarchy** | Subject → Topic → Lesson |
| **Support Escalation** | Support team structure |

---

### How to Use

**Best Practices:**
✅ Align the organization chart setup with the primary question you need to answer
✅ Keep labels, units, and legends explicit so interpretation is immediate
✅ Limit visual complexity to emphasize the most important pattern
✅ Use consistent color meaning across categories or series

**Avoid:**
❌ Mixing unrelated metrics without clarifying scale or context
❌ Overcrowding the chart with too many categories or series
❌ Using decorative styling that competes with the data
                `
            }
        }
    }
};

const teamData = {
    data: [
        ['CEO', 'CTO'],
        ['CEO', 'CFO'],
        ['CEO', 'COO'],
        ['CTO', 'Dev Lead'],
        ['CTO', 'QA Lead'],
        ['Dev Lead', 'Frontend'],
        ['Dev Lead', 'Backend']
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Company Organization</h3>
            <OrganizationChart {...teamData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        data: [
            ['Manager', 'Team Lead A'],
            ['Manager', 'Team Lead B'],
            ['Team Lead A', 'Member 1'],
            ['Team Lead A', 'Member 2']
        ],
        height: 500
    }
};
