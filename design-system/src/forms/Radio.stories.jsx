import React, { useState } from 'react';
import Radio from './Radio';

export default {
    title: 'Forms/Radio',
    component: Radio,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Radio component for single selection from mutually exclusive options. Must be used in groups with the same name attribute.',
            },
        },
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the radio',
            table: { category: 'Content' },
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the radio',
            table: { category: 'Behavior' },
        },
    },
};

export const Content = () => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ maxWidth: '600px' }}>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Option labels and a selected value in a named group.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Radio
                    id="radio-c1"
                    name="radio-content"
                    label="Option 1"
                    value="option1"
                    checked={value === 'option1'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-c2"
                    name="radio-content"
                    label="Option 2"
                    value="option2"
                    checked={value === 'option2'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-c3"
                    name="radio-content"
                    label="Option 3"
                    value="option3"
                    checked={value === 'option3'}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    );
};

export const Layout = () => {
    const [value, setValue] = useState('a');

    return (
        <div style={{ maxWidth: '600px' }}>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Vertical stack is the default layout for a radio group.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Radio
                    id="radio-l1"
                    name="radio-layout"
                    label="First choice"
                    value="a"
                    checked={value === 'a'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-l2"
                    name="radio-layout"
                    label="Second choice"
                    value="b"
                    checked={value === 'b'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-l3"
                    name="radio-layout"
                    label="Third choice"
                    value="c"
                    checked={value === 'c'}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    );
};

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        <Radio id="radio-small" name="radio-size" label="Small" size="small" defaultChecked />
        <Radio id="radio-medium" name="radio-size-m" label="Medium (Default)" size="medium" defaultChecked />
        <Radio id="radio-large" name="radio-size-l" label="Large" size="large" defaultChecked />
    </div>
);

export const InteractionStates = () => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
            <Radio
                id="radio-s1"
                name="radio-states"
                label="Selected"
                value="option1"
                checked={value === 'option1'}
                onChange={(e) => setValue(e.target.value)}
            />
            <Radio
                id="radio-s2"
                name="radio-states"
                label="Unselected"
                value="option2"
                checked={value === 'option2'}
                onChange={(e) => setValue(e.target.value)}
            />
            <Radio id="radio-disabled" name="radio-states-dis" label="Disabled" value="disabled" disabled />
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
    disabled: false,
};
