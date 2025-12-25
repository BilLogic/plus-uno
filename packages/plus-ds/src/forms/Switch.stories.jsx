import React, { useState } from 'react';
import Switch from './Switch';

export default {
    title: 'Forms/Switch',
    component: Switch,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Switch component for toggling between two states (on/off). Similar to a checkbox but with a sliding toggle visual.'
            }
        }
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the switch',
            table: { category: 'Content' }
        },
        checked: {
            control: 'boolean',
            description: 'Controlled checked state',
            table: { category: 'State' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the switch',
            table: { category: 'Behavior' }
        }
    }
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>States</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Switch id="switch-off" name="switch-off" label="Off" defaultChecked={false} />
                <Switch id="switch-on" name="switch-on" label="On" defaultChecked={true} />
                <Switch id="switch-disabled" name="switch-disabled" label="Disabled" disabled />
                <Switch id="switch-disabled-on" name="switch-disabled-on" label="Disabled (On)" disabled defaultChecked />
            </div>
        </section>
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Switch id="switch-small" name="switch-small" label="Small" size="small" defaultChecked />
                <Switch id="switch-medium" name="switch-medium" label="Medium (Default)" size="medium" defaultChecked />
                <Switch id="switch-large" name="switch-large" label="Large" size="large" defaultChecked />
            </div>
        </section>
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
    checked: false,
    size: 'medium',
    disabled: false
};
