/**
 * OverviewCard Stories
 * Figma Spec: node-id=83-125838
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
                component: `Overview cards for SMART competency metrics and student progress tracking.
                
**SMART Types:**
- **Relationships** - Pink/magenta theme
- **Socio-Emotional** - Gold/amber theme  
- **Mastering Content** - Purple theme
- **Advocacy** - Green theme
- **Technology Tools** - Blue theme

Each card displays a title, metric value, trend indicator, and optional sparkline chart.`
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
                'undefined'
            ],
            description: 'SMART competency type - determines color scheme'
        },
        title: {
            control: 'text',
            description: 'Card title'
        },
        value: {
            control: 'text',
            description: 'Large metric value'
        },
        trend: {
            control: 'text',
            description: 'Trend indicator text'
        }
    }
};

// Sample data for sparklines
const sampleData = {
    relationships: [10, 12, 11, 14, 13, 15, 16, 15, 17, 18],
    'socio-emotional': [5, 8, 6, 9, 7, 10, 9, 11, 10, 12],
    'mastering-content': [65, 68, 70, 72, 72, 71, 72, 73, 75, 78],
    advocacy: [0, 1, 0, 0, 2, 1, 3, 2, 4, 3],
    'technology-tools': [90, 92, 94, 94, 95, 95, 96, 97, 96, 98]
};

/**
 * All SMART card variants displayed together
 */
export const AllVariants = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))',
        gap: '16px',
        padding: '24px',
        backgroundColor: 'var(--color-surface, #f9f9fc)'
    }}>
        <OverviewCard
            type="relationships"
            title="Relationships"
            icon={<i className="fas fa-heart" />}
            value="85%"
            trend="+5% from last week"
            data={sampleData.relationships}
        />
        <OverviewCard
            type="socio-emotional"
            title="Socio-Emotional"
            icon={<i className="fas fa-smile" />}
            value="72%"
            trend="Steady growth"
            data={sampleData['socio-emotional']}
        />
        <OverviewCard
            type="mastering-content"
            title="Mastering Content"
            icon={<i className="fas fa-book" />}
            value="78%"
            trend="Quiz completion"
            data={sampleData['mastering-content']}
        />
        <OverviewCard
            type="advocacy"
            title="Advocacy"
            icon={<i className="fas fa-bullhorn" />}
            value="3"
            trend="New cases this week"
            data={sampleData.advocacy}
        />
        <OverviewCard
            type="technology-tools"
            title="Tech Tools"
            icon={<i className="fas fa-laptop" />}
            value="98%"
            trend="High adoption"
            data={sampleData['technology-tools']}
        />
        <OverviewCard
            type="undefined"
            title="Student Need"
            icon={<i className="fas fa-info-circle" />}
            value="--"
            trend="No data available"
        />
    </div>
);

/**
 * Relationships card - pink/magenta theme
 */
export const Relationships = {
    args: {
        type: 'relationships',
        title: 'Relationships',
        icon: <i className="fas fa-heart" />,
        value: '85%',
        trend: '+5% from last week',
        data: sampleData.relationships
    }
};

/**
 * Socio-Emotional card - gold/amber theme
 */
export const SocioEmotional = {
    args: {
        type: 'socio-emotional',
        title: 'Socio-Emotional',
        icon: <i className="fas fa-smile" />,
        value: '72%',
        trend: 'Steady growth',
        data: sampleData['socio-emotional']
    }
};

/**
 * Mastering Content card - purple theme
 */
export const MasteringContent = {
    args: {
        type: 'mastering-content',
        title: 'Mastering Content',
        icon: <i className="fas fa-book" />,
        value: '78%',
        trend: 'Quiz completion rate',
        data: sampleData['mastering-content']
    }
};

/**
 * Advocacy card - green theme
 */
export const Advocacy = {
    args: {
        type: 'advocacy',
        title: 'Advocacy',
        icon: <i className="fas fa-bullhorn" />,
        value: '3',
        trend: 'New cases this week',
        data: sampleData.advocacy
    }
};

/**
 * Technology Tools card - blue theme
 */
export const TechnologyTools = {
    args: {
        type: 'technology-tools',
        title: 'Tech Tools',
        icon: <i className="fas fa-laptop" />,
        value: '98%',
        trend: 'High adoption rate',
        data: sampleData['technology-tools']
    }
};

/**
 * Undefined/neutral state
 */
export const Undefined = {
    args: {
        type: 'undefined',
        title: 'Student Need',
        icon: <i className="fas fa-info-circle" />,
        value: '--',
        trend: 'No data available'
    }
};

/**
 * Interactive playground
 */
export const Interactive = {
    args: {
        type: 'relationships',
        title: 'Interactive Card',
        value: '85%',
        trend: 'Try changing props!',
        icon: <i className="fas fa-star" />,
        data: [5, 10, 5, 10, 5, 10, 15, 10]
    }
};
