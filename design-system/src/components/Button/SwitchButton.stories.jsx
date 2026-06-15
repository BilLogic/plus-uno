import React, { useState } from 'react';
import SwitchButton from './SwitchButton';

export default {
    title: 'Components/SwitchButton',
    component: SwitchButton,
    tags: ['autodocs'],
    parameters: {
        docs: {
            toc: { title: 'On this page' }
        }
    },
    argTypes: {
        // CONTENT
        label: {
            control: 'text',
            description: 'Optional text label rendered beside the toggle',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            description: 'Appends a danger-colored asterisk to the label',
            table: { category: 'Content' }
        },

        // DESIGN
        checked: {
            control: 'boolean',
            description: 'Whether the switch is toggled on (controlled)',
            table: { category: 'Design' }
        },
        defaultChecked: {
            control: 'boolean',
            description: 'Initial checked state for uncontrolled usage',
            table: { category: 'Design' }
        },

        // BEHAVIOR
        disabled: {
            control: 'boolean',
            description: 'Prevents interaction and applies disabled styling',
            table: { category: 'Behavior' }
        },
        readOnly: {
            control: 'boolean',
            description: 'Displays state without allowing user interaction',
            table: { category: 'Behavior' }
        },
        onChange: {
            table: { disable: true }
        },

        // DEVELOPMENT
        id: {
            control: 'text',
            table: { category: 'Development' }
        },
        name: {
            control: 'text',
            table: { category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
export const Overview = {
    render: () => <SwitchButton checked onChange={() => {}} />
};

// ---------------------------------------------------------------------------
// Default (unchecked)
// ---------------------------------------------------------------------------
export const DefaultUnchecked = {
    name: 'Default – Unchecked',
    render: () => <SwitchButton checked={false} onChange={() => {}} />
};

// ---------------------------------------------------------------------------
// Default (checked)
// ---------------------------------------------------------------------------
export const DefaultChecked = {
    name: 'Default – Checked',
    render: () => <SwitchButton checked onChange={() => {}} />
};

// ---------------------------------------------------------------------------
// With Label
// ---------------------------------------------------------------------------
export const WithLabel = {
    name: 'With Label',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SwitchButton label="Text" checked onChange={() => {}} />
            <SwitchButton label="Text" checked={false} onChange={() => {}} />
        </div>
    )
};

// ---------------------------------------------------------------------------
// Required
// ---------------------------------------------------------------------------
export const Required = {
    name: 'Required',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SwitchButton label="Text" required checked onChange={() => {}} />
            <SwitchButton label="Text" required checked={false} onChange={() => {}} />
        </div>
    )
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------
export const Disabled = {
    name: 'Disabled',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SwitchButton checked={false} disabled onChange={() => {}} />
            <SwitchButton checked disabled onChange={() => {}} />
        </div>
    )
};

// ---------------------------------------------------------------------------
// Read-Only
// ---------------------------------------------------------------------------
export const ReadOnly = {
    name: 'Read-Only',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SwitchButton label="Text" readOnly checked />
            <SwitchButton label="Text" readOnly checked={false} />
        </div>
    )
};

// ---------------------------------------------------------------------------
// All States
// ---------------------------------------------------------------------------
export const AllStates = {
    name: 'All States',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ width: '120px', fontSize: '12px', color: '#6f797a' }}>Default</span>
                <SwitchButton checked={false} onChange={() => {}} />
                <SwitchButton checked onChange={() => {}} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ width: '120px', fontSize: '12px', color: '#6f797a' }}>Disabled</span>
                <SwitchButton checked={false} disabled onChange={() => {}} />
                <SwitchButton checked disabled onChange={() => {}} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ width: '120px', fontSize: '12px', color: '#6f797a' }}>Read-Only</span>
                <SwitchButton label="Text" readOnly checked={false} />
                <SwitchButton label="Text" readOnly checked />
            </div>
        </div>
    )
};

// ---------------------------------------------------------------------------
// Interactive Playground
// ---------------------------------------------------------------------------
const InteractiveTemplate = (args) => {
    const [isChecked, setIsChecked] = useState(args.checked ?? false);
    return (
        <SwitchButton
            {...args}
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
        />
    );
};

export const Interactive = {
    args: {
        label: 'Toggle label',
        checked: false,
        required: false,
        disabled: false,
        readOnly: false,
    },
    render: (args) => <InteractiveTemplate {...args} />
};
