import React from 'react';
import Spinner from '@/components/Spinner';

export default {
    title: 'Components/Spinner',
    component: Spinner,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Spinner size',
        },
        label: { control: 'text', description: 'Accessibility label' },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Spinner size="small" />
        <Spinner size="default" />
        <Spinner size="large" />
    </div>
);

export const Interactive = {
    args: {
        size: 'default',
        label: 'Loading...',
    },
};
