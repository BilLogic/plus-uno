import React from 'react';
import OverviewCard from '../../../../components/Card/OverviewCard/OverviewCard';

export default {
    title: 'Specs/Universal/Cards/OverviewCard',
    component: OverviewCard,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Overview cards for SMART competency metrics and student progress.
                
**Types:**
- **SMART:** relationships, socio-emotional, mastering-content, advocacy, technology-tools
- **Metrics:** status, completion, accuracy, time-spent, effort, progress`
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
                'status',
                'completion',
                'accuracy',
                'time-spent',
                'effort',
                'progress'
            ]
        },
        title: { control: 'text' },
        value: { control: 'text' },
        trend: { control: 'text' },
        subtitle: { control: 'text' }
    }
};

/**
 * Overview
 * Displays all available variants of the OverviewCard.
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* SMART Competency Cards */}
            <div>
                <h6 className="h6 mb-3">SMART Competencies</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <OverviewCard
                        type="socio-emotional"
                        title="Socio-Emotional"
                        value="85%"
                        subtitle="Students displaying growth"
                        icon={<i className="fas fa-heart" />}
                    />
                    <OverviewCard
                        type="mastering-content"
                        title="Mastering Content"
                        value="92%"
                        subtitle="Concept mastery rate"
                        icon={<i className="fas fa-brain" />}
                    />
                    <OverviewCard
                        type="advocacy"
                        title="Advocacy"
                        value="78%"
                        subtitle="Self-advocacy instances"
                        icon={<i className="fas fa-bullhorn" />}
                    />
                    <OverviewCard
                        type="relationships"
                        title="Relationships"
                        value="88%"
                        subtitle="Positive interactions"
                        icon={<i className="fas fa-users" />}
                    />
                    <OverviewCard
                        type="technology-tools"
                        title="Technology Tools"
                        value="95%"
                        subtitle="Tool proficiency"
                        icon={<i className="fas fa-laptop" />}
                    />
                </div>
            </div>

            {/* Metric Cards */}
            <div>
                <h6 className="h6 mb-3">Metrics</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <OverviewCard
                        type="status"
                        title="Status"
                        value="On Track"
                        trend="↑ 5%"
                        subtitle="Weekly progress"
                    />
                    <OverviewCard
                        type="completion"
                        title="Completion"
                        value="12/15"
                        trend="+2"
                        subtitle="Modules completed"
                    />
                    <OverviewCard
                        type="accuracy"
                        title="Accuracy"
                        value="94%"
                        subtitle="Average quiz score"
                    />
                    <OverviewCard
                        type="time-spent"
                        title="Time Spent"
                        value="4.5h"
                        subtitle="Total session time"
                    />
                </div>
            </div>
        </div>
    )
};

/**
 * Interactive
 * Playground for testing component props.
 */
export const Interactive = {
    args: {
        type: 'socio-emotional',
        title: 'Socio-Emotional',
        value: '85%',
        subtitle: 'Students displaying growth',
        icon: <i className="fas fa-heart" />,
        style: { width: '275px' }
    },
    render: (args) => <OverviewCard {...args} />
};
