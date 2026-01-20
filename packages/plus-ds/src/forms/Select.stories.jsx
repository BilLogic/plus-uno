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
    tags: ['autodocs'],
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
| **Sizes** | small, medium (default), large |`
            }
        }
    }
};

const sampleOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
    { value: 'fig', label: 'Fig' },
    { value: 'grape', label: 'Grape' },
    { value: 'honeydew', label: 'Honeydew' }
];

/**
 * Overview
 * Shows all Select configurations
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '400px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Single Select</h6>
                <Select options={sampleOptions} placeholder="Select a fruit..." />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Multi-Select with Badges</h6>
                <Select
                    mode="multi"
                    options={sampleOptions}
                    placeholder="Select fruits..."
                    defaultValue={['apple', 'cherry']}
                />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Searchable</h6>
                <Select options={sampleOptions} placeholder="Type to search..." searchable />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Creatable (Multi)</h6>
                <Select
                    mode="multi"
                    options={sampleOptions}
                    placeholder="Add or select..."
                    searchable
                    creatable
                />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Sizes</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Select size="small" options={sampleOptions} placeholder="Small" />
                    <Select size="medium" options={sampleOptions} placeholder="Medium (default)" />
                    <Select size="large" options={sampleOptions} placeholder="Large" />
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Full playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [value, setValue] = useState(args.mode === 'multi' ? [] : '');

        return (
            <div style={{ maxWidth: '400px' }}>
                <Select
                    {...args}
                    options={sampleOptions}
                    value={value}
                    onChange={setValue}
                />
                <p className="body3-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Selected: {args.mode === 'multi'
                        ? (value.length > 0 ? value.join(', ') : 'None')
                        : (value || 'None')
                    }
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
        disabled: false
    },
    argTypes: {
        mode: {
            control: { type: 'select' },
            options: ['single', 'multi'],
            table: { category: 'Design' }
        },
        size: {
            control: { type: 'select' },
            options: ['small', 'medium', 'large'],
            table: { category: 'Design' }
        },
        displayMode: {
            control: { type: 'select' },
            options: ['badges', 'text'],
            if: { arg: 'mode', eq: 'multi' },
            table: { category: 'Design' }
        },
        placeholder: {
            control: 'text',
            table: { category: 'Content' }
        },
        searchable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        creatable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        disabled: {
            control: 'boolean',
            table: { category: 'State' }
        }
    }
};
