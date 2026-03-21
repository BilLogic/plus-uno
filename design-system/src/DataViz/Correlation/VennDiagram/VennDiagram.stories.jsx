import React from 'react';
import VennDiagram from './VennDiagram';

export default {
    title: 'Data Visualizations/Correlation/VennDiagram',
    component: VennDiagram,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
## Venn Diagram

Shows **overlapping sets** and their relationships.

---

### 📖 How to Read
- **Circles** = distinct sets/groups
- **Overlaps** = shared elements
- **Size** = relative quantity

---

### 🎯 When to Use

| Use Case | Recommendation |
|----------|----------------|
| Set relationships | ✅ Ideal |
| Skill overlaps | ✅ Good |
| Group comparisons | ✅ Good |

---

### 🏫 适用场景 (PLUS Context)

| Scenario | Example |
|----------|---------|
| **Skill Overlap** | Math + Science students |
| **Feature Usage** | Users using multiple features |
| **Course Enrollment** | Multi-subject students |
                `
            }
        }
    }
};

const skillsData = {
    data: [
        { sets: ['Math'], value: 5, name: 'Math Only' },
        { sets: ['Science'], value: 4, name: 'Science Only' },
        { sets: ['English'], value: 6, name: 'English Only' },
        { sets: ['Math', 'Science'], value: 3, name: 'Math & Science' },
        { sets: ['Math', 'English'], value: 2, name: 'Math & English' },
        { sets: ['Science', 'English'], value: 2, name: 'Science & English' },
        { sets: ['Math', 'Science', 'English'], value: 1, name: 'All Three' }
    ]
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Subject Enrollment</h3>
            <VennDiagram {...skillsData} />
        </section>
    </div>
);

export const Interactive = {
    args: {
        data: [
            { sets: ['A'], value: 10 },
            { sets: ['B'], value: 8 },
            { sets: ['A', 'B'], value: 4 }
        ],
        height: 400
    }
};
