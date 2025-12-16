import React, { useState } from 'react';
import Switch from './Switch';

export default {
    title: 'Components/Switch',
    component: Switch,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Switch component for toggling between two states. Wrapper around Bootstrap Form.Check type="switch".'
            }
        }
    },
    argTypes: {
        checked: {
            control: 'boolean',
            description: 'Checked state (controlled)'
        },
        disabled: {
            control: 'boolean',
            description: 'Disabled state'
        }
    }
};

const Template = (args) => <Switch {...args} />;

export const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h5>States</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Switch label="Checked" defaultChecked={true} id="switch-checked" />
                    <Switch label="Unchecked" defaultChecked={false} id="switch-unchecked" />
                    <Switch label="Disabled" disabled id="switch-disabled" />
                    <Switch label="Disabled & Checked" disabled defaultChecked id="switch-disabled-checked" />
                </div>
            </section>
        </div>
    );
};

export const Interactive = () => {
    const [isOn, setIsOn] = useState(false);

    return (
        <Switch
            label={isOn ? "On" : "Off"}
            checked={isOn}
            onChange={(e) => setIsOn(e.target.checked)}
            id="switch-interactive"
        />
    );
};
