import React from 'react';
import Checkbox from '@/components/Checkbox';

export default {
    title: 'Components/Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text', description: 'Checkbox label' },
        checked: { control: 'boolean', description: 'Checked state' },
        indeterminate: { control: 'boolean', description: 'Indeterminate state' },
        disabled: { control: 'boolean', description: 'Disabled state' },
        required: { control: 'boolean', description: 'Required state' },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Checkbox label="Default Checkbox" id="check1" />
        <Checkbox label="Checked Checkbox" id="check2" checked />
        <Checkbox label="Indeterminate Checkbox" id="check3" indeterminate />
        <Checkbox label="Disabled Checkbox" id="check4" disabled />
        <Checkbox label="Required Checkbox" id="check5" required />
    </div>
);

export const Interactive = {
    args: {
        label: 'Interactive Checkbox',
        id: 'interactive-check',
        checked: false,
        indeterminate: false,
        disabled: false,
        required: false,
    },
};
