/**
 * TutorHomePageSkillsOverviewDifferentLayout Stories
 * Figma Spec: node-id=563-192630
 */

import React from 'react';
import TutorHomePageSkillsOverviewDifferentLayout from './TutorHomePageSkillsOverviewDifferentLayout';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';

const trainingProgressData = {
    categories: [
        'Social Emotional Learning',
        'Mastering Content',
        'Advocacy',
        'Relationships',
        'Technology Tools'
    ],
    completionPercentages: [25, 50, 80, 55, 90]
};

export default {
    title: 'Specs/Home/Pages/TutorHomePageSkillsOverviewDifferentLayout',
    component: TutorHomePageSkillsOverviewDifferentLayout,
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
                component: 'Alternative tutor home page layout with Training Progress radar chart and stacked metric cards.'
            }
        }
    }
};

export const Overview = {
    render: () => (
        <TutorHomePageSkillsOverviewDifferentLayout
            tutorName="John Doe"
            userBadge="Lead"
            trainingProgressData={trainingProgressData}
        />
    ),
};

export const Interactive = {
    render: (args) => (
        <TutorHomePageSkillsOverviewDifferentLayout
            {...args}
            trainingProgressData={trainingProgressData}
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
