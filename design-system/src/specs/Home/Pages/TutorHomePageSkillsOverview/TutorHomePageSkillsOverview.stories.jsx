/**
 * TutorHomePageSkillsOverview Stories
 * Figma Spec: node-id=563-206909
 */

import React from 'react';
import TutorHomePageSkillsOverview from './TutorHomePageSkillsOverview';

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

export default {
    title: 'Specs/Home/Pages/TutorHomePageSkillsOverview',
    component: TutorHomePageSkillsOverview,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Tutor home page with Skills Overview tab active and the circular progress impact card.'
            }
        }
    }
};

export const Overview = {
    render: () => (
        <TutorHomePageSkillsOverview
            tutorName="John Doe"
            userBadge="Lead"
            skillsOverviewData={skillsOverviewData}
        />
    ),
    parameters: { layout: 'fullscreen' }
};

export const Interactive = {
    render: (args) => (
        <TutorHomePageSkillsOverview {...args} skillsOverviewData={skillsOverviewData} />
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
    parameters: { layout: 'fullscreen' }
};
