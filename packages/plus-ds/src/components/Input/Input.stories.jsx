import React from 'react';
import Input from '@/components/Input';

export default {
    title: 'Components/Input',
    component: Input,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Input size',
        },
        disabled: {
            control: 'boolean',
            description: 'Disabled state',
        },
        readonly: {
            control: 'boolean',
            description: 'Readonly state',
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
        },
        value: {
            control: 'text',
            description: 'Input value',
        },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <Input placeholder="Default Input" />
        <Input placeholder="Small Input" size="small" />
        <Input placeholder="Large Input" size="large" />
        <Input placeholder="Disabled Input" disabled />
        <Input placeholder="Readonly Input" value="Readonly Value" readonly />
    </div>
);

export const Interactive = {
    args: {
        placeholder: 'Type something...',
        size: 'medium',
        disabled: false,
        readonly: false,
    },
};
