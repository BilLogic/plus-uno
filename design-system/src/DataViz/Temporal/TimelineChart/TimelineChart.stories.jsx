import React from 'react';
import TimelineChart from './TimelineChart';

export default {
    title: 'Data Visualizations/Temporal/TimelineChart',
    component: TimelineChart,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Timeline Chart

Shows **events or milestones** along a horizontal timeline.

### Overview
Shows **events or milestones** along a horizontal timeline.

---

### How to Read
- **Points** = events/milestones
- **Position** = chronological order
- **Labels** = event names and descriptions

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Project milestones | ✅ Ideal |
| Historical events | ✅ Ideal |
| Progress tracking | ✅ Good |
| Quantitative data | ❌ Use Line Chart |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Student Journey** | Enrollment → Completion |
| **Course Milestones** | Module completion dates |
| **Project Timeline** | Development phases |

---

### How to Use

**Best Practices:**
✅ Align the timeline chart setup with the primary question you need to answer
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

const studentJourneyData = {
    data: [
        { name: 'Application', label: 'Application Submitted', description: 'Student applied for tutoring' },
        { name: 'Assessment', label: 'Initial Assessment', description: 'Baseline skills evaluated' },
        { name: 'Enrollment', label: 'Course Enrolled', description: 'Started learning path' },
        { name: 'Midterm', label: 'Midterm Review', description: 'Progress checkpoint' },
        { name: 'Completion', label: 'Course Completed', description: 'Certification earned' }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Learning Journey</h3>
            <TimelineChart {...studentJourneyData} />
        </section>
    </div>
);


export const Interactive = {
    args: {
        data: [
            { name: 'Step 1', label: 'Start', description: 'Beginning' },
            { name: 'Step 2', label: 'Middle', description: 'In progress' },
            { name: 'Step 3', label: 'End', description: 'Complete' }
        ],
        height: 400
    }
};
