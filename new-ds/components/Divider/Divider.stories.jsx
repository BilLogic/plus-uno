import React from 'react';
import Divider from '@/components/Divider';

export default {
    title: 'Components/Divider',
    component: Divider,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl', '1px', '1.5px', '2px', '2.5px'],
            description: 'Divider thickness',
        },
        style: {
            control: 'select',
            options: ['light', 'dark'],
            description: 'Divider style',
        },
        opacity10: { control: 'boolean', description: '10% opacity' },
        width: { control: 'text', description: 'Divider width' },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        <div>
            <h3>Default Divider</h3>
            <Divider />
        </div>
        <div>
            <h3>Thick Divider</h3>
            <Divider size="xl" />
        </div>
        <div>
            <h3>Dark Divider</h3>
            <Divider style="dark" />
        </div>
        <div>
            <h3>Opacity 10%</h3>
            <Divider opacity10 />
        </div>
    </div>
);

export const Interactive = {
    args: {
        size: 'md',
        style: 'light',
        opacity10: false,
        width: '100%',
    },
};
