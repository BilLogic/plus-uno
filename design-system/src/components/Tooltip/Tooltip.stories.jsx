import React from 'react';
import Tooltip from '@/components/Tooltip';
import Button from '@/components/Button';

export default {
    title: 'Components/Tooltip',
    component: Tooltip,
    tags: ['autodocs'],
    argTypes: {
        text: { control: 'text', description: 'Tooltip text' },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Tooltip placement',
        },
        size: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Tooltip size',
        },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', gap: '16px', padding: '50px' }}>
        <Tooltip text="Tooltip on top" placement="top">
            <Button btnText="Top" />
        </Tooltip>
        <Tooltip text="Tooltip on bottom" placement="bottom">
            <Button btnText="Bottom" />
        </Tooltip>
        <Tooltip text="Tooltip on left" placement="left">
            <Button btnText="Left" />
        </Tooltip>
        <Tooltip text="Tooltip on right" placement="right">
            <Button btnText="Right" />
        </Tooltip>
    </div>
);

export const Interactive = {
    args: {
        text: 'Tooltip text',
        placement: 'top',
        size: 'default',
    },
    render: (args) => (
        <div style={{ padding: '50px' }}>
            <Tooltip {...args}>
                <Button btnText="Hover me" />
            </Tooltip>
        </div>
    ),
};
