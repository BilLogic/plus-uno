/**
 * OverviewCard Stories
 * Figma Spec: node-id=83-125838
 * 
 * Two card types:
 * 1. SMART Cards (tutor needs) - with vertical bar visualization
 * 2. Metric Cards - with donut chart visualization
 */

import React from 'react';
import OverviewCard from './OverviewCard';

export default {
    title: 'Specs/Universal/Cards/OverviewCard',
    component: OverviewCard,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Overview cards for SMART competency metrics and training progress tracking.

## Card Types

### SMART Cards (Student Needs)
- **Relationships** - Pink/magenta theme
- **Socio-Emotional** - Gold/amber theme  
- **Mastering Content** - Purple theme
- **Advocacy** - Green theme
- **Technology Tools** - Blue theme
- **Undefined** - Neutral/gray theme (no data state)

### Metric Cards
- **Status** - Overall status percentage
- **Completion Rate** - Lessons completed
- **Accuracy Rate** - Individual accuracy
- **Avg Accuracy Rate** - Group average accuracy
- **Avg Completion Rate** - Group average completion
- **Avg Time Spent** - Average training time
- **Effort** - Effort goal fulfillment
- **Progress** - Progress goal fulfillment

Each card displays a title, subtitle, description, and visualization (SMART bars or donut chart).`
            }
        }
    },
    argTypes: {
        type: {
            control: 'select',
            options: [
                'relationships',
                'socio-emotional',
                'mastering-content',
                'advocacy',
                'technology-tools',
                'undefined',
                'status',
                'completion',
                'accuracy',
                'avg-accuracy',
                'avg-completion',
                'time-spent',
                'effort',
                'progress'
            ],
            description: 'Card type - determines styling and visualization'
        },
        title: {
            control: 'text',
            description: 'Card title'
        },
        subtitle: {
            control: 'text',
            description: 'Bold subtitle text'
        },
        description: {
            control: 'text',
            description: 'Description/body text'
        },
        chartValue: {
            control: { type: 'range', min: 0, max: 100, step: 1 },
            description: 'Donut chart value (0-100) for metric cards'
        }
    }
};

// Sample SMART data for visualizations
const smartDataSets = {
    relationships: { socio: 0.01, mastering: 0.01, advocacy: 0.01, relationships: 0.85, technology: 0.01 },
    'socio-emotional': { socio: 0.86, mastering: 0.75, advocacy: 0.75, relationships: 0.75, technology: 0.75 },
    'mastering-content': { socio: 0.75, mastering: 0.87, advocacy: 0.75, relationships: 0.75, technology: 0.75 },
    'advocacy': { socio: 0.75, mastering: 0.75, advocacy: 0.88, relationships: 0.75, technology: 0.75 },
    'technology-tools': { socio: 0.75, mastering: 0.75, advocacy: 0.75, relationships: 0.75, technology: 0.89 },
    'undefined': { socio: 0.01, mastering: 0.01, advocacy: 0.01, relationships: 0.01, technology: 0.01 }
};

/**
 * All SMART card variants displayed together
 */
export const SMARTCards = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 275px)',
        gap: '16px',
        padding: '24px',
        backgroundColor: 'var(--color-surface, #f9f9fc)'
    }}>
        <OverviewCard
            type="relationships"
            smartData={smartDataSets.relationships}
        />
        <OverviewCard
            type="socio-emotional"
            smartData={smartDataSets['socio-emotional']}
        />
        <OverviewCard
            type="mastering-content"
            smartData={smartDataSets['mastering-content']}
        />
        <OverviewCard
            type="advocacy"
            smartData={smartDataSets.advocacy}
        />
        <OverviewCard
            type="technology-tools"
            smartData={smartDataSets['technology-tools']}
        />
        <OverviewCard
            type="undefined"
            smartData={smartDataSets.undefined}
        />
    </div>
);

SMARTCards.parameters = {
    docs: {
        description: {
            story: 'All SMART card types showing student needs with vertical bar visualizations.'
        }
    }
};

/**
 * All Metric card variants displayed together
 */
export const MetricCards = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 275px)',
        gap: '16px',
        padding: '24px',
        backgroundColor: 'var(--color-surface, #f9f9fc)'
    }}>
        <OverviewCard
            type="status"
            chartValue={37.5}
            subtitle="37.5%"
        />
        <OverviewCard
            type="completion"
            chartValue={20}
        />
        <OverviewCard
            type="accuracy"
            chartValue={20}
        />
        <OverviewCard
            type="avg-accuracy"
            chartValue={20}
        />
        <OverviewCard
            type="avg-completion"
            chartValue={20}
        />
        <OverviewCard
            type="time-spent"
            chartValue={33}
            subtitle="30 / 90 min"
            editLink
        />
        <OverviewCard
            type="effort"
            chartValue={20}
        />
        <OverviewCard
            type="progress"
            chartValue={20}
        />
    </div>
);

MetricCards.parameters = {
    docs: {
        description: {
            story: 'All metric card types showing various KPIs with donut chart visualizations.'
        }
    }
};

/**
 * Relationships card - pink/magenta theme
 */
export const Relationships = {
    args: {
        type: 'relationships',
        smartData: smartDataSets.relationships
    }
};

/**
 * Socio-Emotional card - gold/amber theme
 */
export const SocioEmotional = {
    args: {
        type: 'socio-emotional',
        smartData: smartDataSets['socio-emotional']
    }
};

/**
 * Mastering Content card - purple theme
 */
export const MasteringContent = {
    args: {
        type: 'mastering-content',
        smartData: smartDataSets['mastering-content']
    }
};

/**
 * Advocacy card - green theme
 */
export const Advocacy = {
    args: {
        type: 'advocacy',
        smartData: smartDataSets.advocacy
    }
};

/**
 * Technology Tools card - blue theme
 */
export const TechnologyTools = {
    args: {
        type: 'technology-tools',
        smartData: smartDataSets['technology-tools']
    }
};

/**
 * Undefined/no data state
 */
export const Undefined = {
    args: {
        type: 'undefined',
        smartData: smartDataSets.undefined
    }
};

/**
 * Status metric card
 */
export const Status = {
    args: {
        type: 'status',
        chartValue: 37.5,
        subtitle: '37.5%'
    }
};

/**
 * Completion Rate metric card
 */
export const CompletionRate = {
    args: {
        type: 'completion',
        chartValue: 20
    }
};

/**
 * Accuracy Rate metric card
 */
export const AccuracyRate = {
    args: {
        type: 'accuracy',
        chartValue: 20
    }
};

/**
 * Average Accuracy Rate metric card
 */
export const AvgAccuracyRate = {
    args: {
        type: 'avg-accuracy',
        chartValue: 20
    }
};

/**
 * Average Completion Rate metric card
 */
export const AvgCompletionRate = {
    args: {
        type: 'avg-completion',
        chartValue: 20
    }
};

/**
 * Average Time Spent metric card
 */
export const AvgTimeSpent = {
    args: {
        type: 'time-spent',
        chartValue: 33,
        subtitle: '30 / 90 min',
        editLink: true
    }
};

/**
 * Effort metric card
 */
export const Effort = {
    args: {
        type: 'effort',
        chartValue: 20
    }
};

/**
 * Progress metric card
 */
export const Progress = {
    args: {
        type: 'progress',
        chartValue: 20
    }
};

/**
 * Interactive playground
 */
export const Interactive = {
    args: {
        type: 'relationships',
        smartData: { socio: 0.6, mastering: 0.4, advocacy: 0.8, relationships: 0.9, technology: 0.5 },
        chartValue: 75
    }
};

/**
 * Overview - All variants in one view
 */
export const Overview = () => (
    <div style={{ padding: '24px', backgroundColor: 'var(--color-surface, #f9f9fc)' }}>
        <h3 style={{ marginBottom: '16px', fontFamily: 'Lato, sans-serif' }}>SMART Cards (Student Needs)</h3>
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px'
        }}>
            <OverviewCard type="relationships" smartData={smartDataSets.relationships} />
            <OverviewCard type="socio-emotional" smartData={smartDataSets['socio-emotional']} />
            <OverviewCard type="mastering-content" smartData={smartDataSets['mastering-content']} />
            <OverviewCard type="advocacy" smartData={smartDataSets.advocacy} />
            <OverviewCard type="technology-tools" smartData={smartDataSets['technology-tools']} />
            <OverviewCard type="undefined" smartData={smartDataSets.undefined} />
        </div>

        <h3 style={{ marginBottom: '16px', fontFamily: 'Lato, sans-serif' }}>Metric Cards</h3>
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px'
        }}>
            <OverviewCard type="status" chartValue={37.5} subtitle="37.5%" />
            <OverviewCard type="completion" chartValue={20} />
            <OverviewCard type="accuracy" chartValue={20} />
            <OverviewCard type="avg-accuracy" chartValue={20} />
            <OverviewCard type="avg-completion" chartValue={20} />
            <OverviewCard type="time-spent" chartValue={33} subtitle="30 / 90 min" editLink />
            <OverviewCard type="effort" chartValue={20} />
            <OverviewCard type="progress" chartValue={20} />
        </div>
    </div>
);
