import React from 'react';
import Radio from '@/components/Radio';

export default {
    title: 'Components/Radio',
    component: Radio,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text', description: 'Radio label' },
        checked: { control: 'boolean', description: 'Checked state' },
        disabled: { control: 'boolean', description: 'Disabled state' },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Radio label="Default Radio" name="radio-group" id="radio1" />
        <Radio label="Checked Radio" name="radio-group" id="radio2" checked />
        <Radio label="Disabled Radio" name="radio-group" id="radio3" disabled />
    </div>
);

export const Interactive = {
    args: {
        label: 'Interactive Radio',
        name: 'interactive-radio',
        id: 'interactive-radio',
        checked: false,
        disabled: false,
    },
};
