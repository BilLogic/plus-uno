import React from 'react';
import LessonOverviewSection from './LessonOverviewSection';

export default {
    title: 'Specs/Training/Lessons/Sections/LessonOverviewSection',
    component: LessonOverviewSection,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Horizontal scrollable overview cards displaying metrics/status. Matches Figma node 63-178172 using Universal OverviewCards.',
            },
        },
    },
    argTypes: {
        title: { control: 'text' },
        style: { control: 'object' },
        className: { control: 'text' }
    }
};

const sampleMetrics = [
    {
        id: 'student-need',
        type: 'relationships',
        title: 'Student Need',
        subtitle: 'Relationships',
        description: '3/3 students need relationship support',
        smartData: { socio: 0.2, mastering: 0.2, advocacy: 0.2, relationships: 0.8, technology: 0.2 }
    },
    {
        id: 'status',
        type: 'status',
        title: 'Status',
        subtitle: '37.5%',
        description: 'students has status: Outstanding.',
        chartValue: 37.5
    },
    {
        id: 'effort',
        type: 'effort',
        title: 'Effort',
        subtitle: '2/10',
        description: 'Students have fulfilled their effort goals.',
        chartValue: 20
    },
    {
        id: 'progress',
        type: 'progress',
        title: 'Progress',
        subtitle: '2/10',
        description: 'Students have fulfilled their progress goals.',
        chartValue: 20
    }
];

export const Overview = {
    args: {
        title: 'Students Overview',
        metrics: [], // Uses internal defaults that match Figma
    },
    render: (args) => <div style={{ maxWidth: '1200px' }}><LessonOverviewSection {...args} /></div>
};

export const Interactive = {
    args: {
        title: 'Custom Overview',
        metrics: sampleMetrics,
    },
    render: (args) => <div style={{ maxWidth: '1200px' }}><LessonOverviewSection {...args} /></div>
};
