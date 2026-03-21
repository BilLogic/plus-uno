import React from 'react';
import OrganizationChart from './OrganizationChart';

export default {
    title: 'Data Visualizations/Other/OrganizationChart',
    component: OrganizationChart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Organization Chart

Shows **hierarchical organizational structures** with reporting lines.

---

### 📖 How to Read
- **Nodes** = people/roles
- **Lines** = reporting relationships
- **Levels** = hierarchy depth

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Team structures | ✅ Ideal |
| Reporting lines | ✅ Ideal |
| Decision hierarchies | ✅ Good |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Team Structure** | Tutor organization |
| **Course Hierarchy** | Subject → Topic → Lesson |
| **Support Escalation** | Support team structure |
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
