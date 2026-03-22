import React, { useState } from 'react';
import Select from './Select';

/**
 * Select Component
 *
 * Enhanced dropdown select with single/multi-select modes, searchable,
 * and creatable options. Uses ListGroup.Item for option rendering.
 */
export default {
    title: 'Forms/Select',
    component: Select,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `Enhanced Select component with custom dropdown popup.

| Feature | Description |
|---------|-------------|
| **Single Select** | Radio-style selection |
| **Multi Select** | Checkbox-style with dismissible badges |
| **Searchable** | Filter options by typing |
| **Creatable** | Add new values on the fly |
| **Sizes** | small, medium (default), large |`,
            },
        },
    },
};

const sampleOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
    { value: 'fig', label: 'Fig' },
    { value: 'grape', label: 'Grape' },
    { value: 'honeydew', label: 'Honeydew' },
];

export const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Placeholder and selection display for single-select mode.
        </p>
        <Select options={sampleOptions} placeholder="Select a fruit..." />
        <Select options={sampleOptions} placeholder="Pre-selected" defaultValue="cherry" />
    </div>
);

export const Variants = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '400px' }}>
        <section>
            <h6 className="h6" style={{ marginBottom: '12px' }}>
                Multi-select (badges)
            </h6>
            <Select
                mode="multi"
                options={sampleOptions}
                placeholder="Select fruits..."
                defaultValue={['apple', 'cherry']}
            />
        </section>
        <section>
            <h6 className="h6" style={{ marginBottom: '12px' }}>
                Searchable
            </h6>
            <Select options={sampleOptions} placeholder="Type to search..." searchable />
        </section>
        <section>
            <h6 className="h6" style={{ marginBottom: '12px' }}>
                Creatable (multi)
            </h6>
            <Select mode="multi" options={sampleOptions} placeholder="Add or select..." searchable creatable />
        </section>
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
        <Select size="small" options={sampleOptions} placeholder="Small" />
        <Select size="medium" options={sampleOptions} placeholder="Medium (default)" />
        <Select size="large" options={sampleOptions} placeholder="Large" />
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <Select options={sampleOptions} placeholder="Enabled" />
        <Select options={sampleOptions} placeholder="Disabled" disabled defaultValue="banana" />
    </div>
);

export const Interactive = {
    render: (args) => {
        const [value, setValue] = useState(args.mode === 'multi' ? [] : '');

        return (
            <div style={{ maxWidth: '400px' }}>
                <Select {...args} options={sampleOptions} value={value} onChange={setValue} />
                <p className="body3-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Selected:{' '}
                    {args.mode === 'multi'
                        ? value.length > 0
                            ? value.join(', ')
                            : 'None'
                        : value || 'None'}
                </p>
            </div>
        );
    },
    args: {
        mode: 'single',
        placeholder: 'Select...',
        searchable: false,
        creatable: false,
        displayMode: 'badges',
        size: 'medium',
        disabled: false,
    },
    argTypes: {
        mode: {
            control: { type: 'select' },
            options: ['single', 'multi'],
            table: { category: 'Design' },
        },
        size: {
            control: { type: 'select' },
            options: ['small', 'medium', 'large'],
            table: { category: 'Design' },
        },
        displayMode: {
            control: { type: 'select' },
            options: ['badges', 'text'],
            if: { arg: 'mode', eq: 'multi' },
            table: { category: 'Design' },
        },
        placeholder: {
            control: 'text',
            table: { category: 'Content' },
        },
        searchable: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        creatable: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        disabled: {
            control: 'boolean',
            table: { category: 'State' },
        },
    },
};
