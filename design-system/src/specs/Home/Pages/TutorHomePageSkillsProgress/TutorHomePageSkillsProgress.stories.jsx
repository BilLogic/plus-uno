/**
 * TutorHomePageSkillsProgress Stories
 * Figma Spec: node-id=563-206909
 */

import React from 'react';
import TutorHomePageSkillsProgress from './TutorHomePageSkillsProgress';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';

const skillsOverviewData = {
    categories: [
        'Teaching Math',
        'Communicating Clearly',
        'Motivating Students',
        'Staying Positive',
        'Managing Time',
        'Fostering Participation'
    ],
    yourPerformance: [60, 55, 80, 90, 70, 85],
    averagePerformance: [70, 70, 65, 75, 60, 70]
};

const skillsProgressData = {
    sessionRanges: ['64-68', '74-78', '84-88', '94-98', '104-108'],
    averageScores: [30, 55, 12, 25, 65]
};

export default {
    title: 'Specs/Home/Pages/TutorHomePageSkillsProgress',
    component: TutorHomePageSkillsProgress,
    tags: ['!dev', '!autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    args: {
        breakpoint: 'xl',
    },
    argTypes: {
        breakpoint: {
            control: 'select',
            options: ['md', 'lg', 'xl'],
            description: 'Simulated viewport width in the preview toolbar',
            table: { category: 'Layout' },
        },
    },
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Tutor home page with Skills Progress tab active and the rating metrics impact card.'
            }
        }
    }
};

export const Overview = {
    render: () => (
        <TutorHomePageSkillsProgress
            tutorName="John Doe"
            userBadge="Lead"
            skillsOverviewData={skillsOverviewData}
            skillsProgressData={skillsProgressData}
        />
    ),
};

export const Interactive = {
    render: (args) => (
        <TutorHomePageSkillsProgress
            {...args}
            skillsOverviewData={skillsOverviewData}
            skillsProgressData={skillsProgressData}
        />
    ),
    args: {
        tutorName: 'John Doe',
        userBadge: 'Lead',
    },
    argTypes: {
        tutorName: { control: 'text', table: { category: 'Content' } },
        userBadge: {
            control: { type: 'select' },
            options: ['Lead', 'Regular'],
            table: { category: 'Content' }
        }
    },
};
