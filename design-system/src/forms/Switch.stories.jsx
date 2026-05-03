import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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
    },
};

export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <Switch id="switch-overview" name="switch-overview" label="Wi‑Fi" defaultChecked />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.formSwitch }
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SMALL</span>
            <Switch id="switch-small" name="switch-small" label="Label" size="small" defaultChecked />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
            <Switch id="switch-medium" name="switch-medium" label="Label" size="medium" defaultChecked />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LARGE</span>
            <Switch id="switch-large" name="switch-large" label="Label" size="large" defaultChecked />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OFF</span>
            <Switch id="switch-off" name="switch-off" label="Label" defaultChecked={false} />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ON</span>
            <Switch id="switch-on" name="switch-on" label="Label" defaultChecked />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
            <Switch id="switch-disabled" name="switch-disabled" label="Label" disabled />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED (ON)</span>
            <Switch id="switch-disabled-on" name="switch-disabled-on" label="Label" disabled defaultChecked />
        </div>
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
