import React from 'react';
import Section from '@/components/Section';

export default {
    title: 'Components/Section',
    component: Section,
    tags: ['autodocs'],
    argTypes: {
        padding: {
            control: { type: 'select' },
            options: ['none', 'sm', 'md', 'lg', 'xl']
        },
        background: {
            control: { type: 'select' },
            options: ['transparent', 'surface', 'surface-alt']
        },
    },
};

export const Default = {
    args: {
        title: 'Section Title',
        children: <p>This is a standard section with default padding and transparent background.</p>,
    },
};

export const WithBackground = {
    args: {
        title: 'Background Section',
        background: 'surface-alt',
        children: <p>This section has a surface-alt background color.</p>,
    },
};

export const LargePadding = {
    args: {
        title: 'Large Padding',
        padding: 'xl',
        background: 'surface',
        children: <p>This section has extra large padding.</p>,
    },
};
