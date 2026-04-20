import React, { useState } from 'react';
import Radio from './Radio';

export default {
    title: 'Forms/Radio',
    component: Radio,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Radio component for single selection from mutually exclusive options. Must be used in groups with the same name attribute.'
            }
        }
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the radio',
            table: { category: 'Content' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the radio',
            table: { category: 'Behavior' }
        }
    }
};

export const Overview = () => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio Group</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Radio id="radio-1" name="radio-group" label="Option 1" value="option1" checked={value === 'option1'} onChange={(e) => setValue(e.target.value)} />
                    <Radio id="radio-2" name="radio-group" label="Option 2" value="option2" checked={value === 'option2'} onChange={(e) => setValue(e.target.value)} />
                    <Radio id="radio-3" name="radio-group" label="Option 3" value="option3" checked={value === 'option3'} onChange={(e) => setValue(e.target.value)} />
                    <Radio id="radio-disabled" name="radio-group-disabled" label="Disabled" value="disabled" disabled />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Radio id="radio-small" name="radio-size" label="Small" size="small" defaultChecked />
                    <Radio id="radio-medium" name="radio-size-m" label="Medium (Default)" size="medium" defaultChecked />
                    <Radio id="radio-large" name="radio-size-l" label="Large" size="large" defaultChecked />
                </div>
            </section>
        </div>
    );
};

export const Interactive = (args) => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Radio
                id="radio-int-1"
                name="radio-interactive"
                label={args.label}
                value="option1"
                checked={value === 'option1'}
                size={args.size}
                disabled={args.disabled}
                onChange={(e) => setValue(e.target.value)}
            />
            <Radio
                id="radio-int-2"
                name="radio-interactive"
                label="Option 2"
                value="option2"
                checked={value === 'option2'}
                size={args.size}
                disabled={args.disabled}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};

Interactive.args = {
    label: 'Option 1',
    size: 'medium',
    disabled: false
};
