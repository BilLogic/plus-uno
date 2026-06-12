import React from 'react';
import WordCloud from './WordCloud';

export default {
    title: 'Data Visualizations/Other/WordCloud',
    component: WordCloud,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `## Word Cloud

A word cloud displays **text frequency** with word size proportional to occurrence.

### Overview
A word cloud displays **text frequency** with word size proportional to occurrence.

---

### How to Read
- **Larger words** = more frequent/important
- **Smaller words** = less frequent
- Position is typically random (no meaning)
- Focus on the most prominent words first

---

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Text analysis overview | ✅ Ideal |
| Survey response themes | ✅ Ideal |
| Tag/keyword display | ✅ Good |
| Precise frequency comparison | ❌ Use Bar Chart |
| Categorical analysis | ❌ Use Treemap |

---

### PLUS Context

| Scenario | Example |
|----------|---------|
| **Feedback Analysis** | Common words in student feedback |
| **Topic Tagging** | Frequently discussed topics |
| **Learning Keywords** | Key terms in course content |
| **Survey Responses** | Open-ended question themes |
| **Session Notes** | Common themes in tutor notes |

---

### How to Use

**Best Practices:**
✅ Filter out common words (the, and, etc.)
✅ Limit to top 50-100 words
✅ Use readable fonts
✅ Consider color by category

**Avoid:**
❌ Precise value comparisons
❌ Too many words (illegible)
❌ Very long words (layout issues)
                `
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Array of { name, weight }' },
        height: { control: 'number', description: 'Chart height in pixels' }
    }
};

const feedbackData = {
    data: [
        { name: 'Helpful', weight: 25 },
        { name: 'Clear', weight: 20 },
        { name: 'Engaging', weight: 18 },
        { name: 'Interactive', weight: 15 },
        { name: 'Thorough', weight: 12 },
        { name: 'Supportive', weight: 10 },
        { name: 'Organized', weight: 10 },
        { name: 'Responsive', weight: 8 },
        { name: 'Patient', weight: 8 },
        { name: 'Knowledgeable', weight: 15 },
        { name: 'Fun', weight: 7 },
        { name: 'Challenging', weight: 6 }
    ]
};

/**
 * Overview: Displays chart variants
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Student Feedback</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Visualizes most common feedback words.
            </p>
            <WordCloud {...feedbackData} />
        </section>
    </div>
);

/**
 * Interactive: Playground
 */
export const Interactive = {
    args: {
        height: 400,
        data: [
            { name: 'Word 1', weight: 20 },
            { name: 'Word 2', weight: 15 },
            { name: 'Word 3', weight: 12 },
            { name: 'Word 4', weight: 10 },
            { name: 'Word 5', weight: 8 }
        ]
    }
};
