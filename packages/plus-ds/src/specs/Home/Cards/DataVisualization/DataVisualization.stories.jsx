import React from 'react';
import DataVisualization from './DataVisualization';
import DataVisualizationTrainingProgress from './DataVisualizationTrainingProgress';
import DataVisualizationSkillsProgress from './DataVisualizationSkillsProgress';

export default {
    title: 'Specs/Home/Cards/DataVisualization',
    component: DataVisualization,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="plus-storybook-constrained" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <Story />
            </div>
        ),
    ],
};

export const Default = {
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <DataVisualization {...args} />
            <DataVisualizationSkillsProgress
                skillsOverviewData={args.skillsOverviewData}
                skillsProgressData={{
                    sessionRanges: ['64-68', '74-78', '84-88', '94-98', '104-108'],
                    averageScores: [30, 55, 12, 25, 65]
                }}
            />
        </div>
    ),
    args: {
        skillsOverviewData: {
            categories: [
                'Teaching Math',
                'Communicating Clearly',
                'Motivating Students',
                'Staying Positive',
                'Managing Time',
                'Fostering Participation',
                'Building Rapport'
            ],
            yourPerformance: [60, 55, 80, 90, 70, 85, 75],
            averagePerformance: [70, 70, 65, 75, 60, 70, 60]
        }
    },
};

export const Alternative = {
    render: (args) => <DataVisualizationTrainingProgress {...args} />,
    args: {
        title: 'Training Progress',
        tooltip: 'Training progress information',
        trainingProgressData: {
            categories: [
                'Social Emotional Learning',
                'Mastering Content',
                'Advocacy',
                'Relationships',
                'Technology Tools'
            ],
            completionPercentages: [25, 50, 80, 55, 90]
        }
    },
};


