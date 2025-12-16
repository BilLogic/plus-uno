import React from 'react';
import Progress from '@/components/Progress';

export default {
    title: 'Components/Progress',
    component: Progress,
    tags: ['autodocs'],
    argTypes: {
        value: { control: { type: 'range', min: 0, max: 100 }, description: 'Progress value' },
        style: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'light', 'dark'],
            description: 'Progress bar style',
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Progress bar size',
        },
        striped: { control: 'boolean', description: 'Striped effect' },
        animated: { control: 'boolean', description: 'Animated stripes' },
        showLabel: { control: 'boolean', description: 'Show percentage label' },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Progress value={25} />
        <Progress value={50} style="success" />
        <Progress value={75} style="info" striped />
        <Progress value={100} style="warning" striped animated />
        <Progress value={60} size="small" />
        <Progress value={60} size="large" />
    </div>
);

export const Interactive = {
    args: {
        value: 50,
        style: 'primary',
        size: 'medium',
        striped: false,
        animated: false,
        showLabel: true,
    },
};
