import React, { useState } from 'react';
import Switch from './Switch';

export default {
    title: 'Forms/Switch',
    component: Switch,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Switch component for toggling between two states (on/off). Similar to a checkbox but with a sliding toggle visual.',
            },
        },
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the switch',
            table: { category: 'Content' },
        },
        checked: {
            table: { disable: true, category: 'Development' },
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the switch',
            table: { category: 'Behavior' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        name: {
            table: { disable: true, category: 'Development' },
        },
        value: {
            table: { disable: true, category: 'Development' },
        },
        defaultChecked: {
            table: { disable: true, category: 'Development' },
        },
        onChange: {
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        style: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Short and long label text.
        </p>
        <Switch id="switch-short" name="switch-short" label="Wi‑Fi" defaultChecked />
        <Switch
            id="switch-long"
            name="switch-long"
            label="Enable email notifications for all activity"
            defaultChecked={false}
        />
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        <Switch id="switch-small" name="switch-small" label="Small" size="small" defaultChecked />
        <Switch id="switch-medium" name="switch-medium" label="Medium (Default)" size="medium" defaultChecked />
        <Switch id="switch-large" name="switch-large" label="Large" size="large" defaultChecked />
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        <Switch id="switch-off" name="switch-off" label="Off" defaultChecked={false} />
        <Switch id="switch-on" name="switch-on" label="On" defaultChecked />
        <Switch id="switch-disabled" name="switch-disabled" label="Disabled" disabled />
        <Switch id="switch-disabled-on" name="switch-disabled-on" label="Disabled (On)" disabled defaultChecked />
    </div>
);

export const Interactive = (args) => {
    const [checked, setChecked] = useState(args.checked || false);

    return (
        <Switch
            id="switch-interactive"
            name="switch-interactive"
            label={args.label}
            checked={checked}
            size={args.size}
            disabled={args.disabled}
            onChange={(e) => setChecked(e.target.checked)}
        />
    );
};

Interactive.args = {
    label: 'Toggle Switch',
    size: 'medium',
    disabled: false,
};
