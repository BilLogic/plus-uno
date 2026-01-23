import React from 'react';
import LessonWelcomeSection from './LessonWelcomeSection';

export default {
    title: 'Specs/Training/Lessons/Sections/LessonWelcomeSection',
    component: LessonWelcomeSection,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Welcome section with navigation tabs and actionable jumbotron content. Matches Figma node 63-178182.',
            },
        },
    },
    argTypes: {
        userName: { control: 'text' },
        title: { control: 'text' },
        description: { control: 'text' },
        activeTab: {
            control: 'select',
            options: ['sign-up', 'session-links', 'reflection']
        },
        onTabChange: { action: 'tab changed' },
    }
};

const defaultTabs = [
    { id: 'sign-up', label: 'Sign Up / Edit', selected: true },
    { id: 'session-links', label: 'Session links' },
    { id: 'reflection', label: 'Reflection' }
];

export const Overview = {
    args: {
        userName: 'Tutor',
        tabs: defaultTabs,
        activeTab: 'sign-up',
        title: 'Welcome back, Tutor!',
        description: 'Sign up for your next session to continue your journey.',
        primaryAction: { text: 'Sign up now', leadingVisual: 'square-plus', onClick: () => console.log('Primary action clicked') },
        secondaryAction: { text: 'View schedule', style: 'secondary', fill: 'filled', onClick: () => console.log('Secondary action clicked') },
    },
    render: (args) => <LessonWelcomeSection {...args} />
};

export const Interactive = {
    args: {
        ...Overview.args,
    },
    render: (args) => <LessonWelcomeSection {...args} />
};
