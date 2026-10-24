import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Switch from './Switch';

export default {
    title: 'Components/Forms and inputs/Toggle',
    component: Switch,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-24', kind: 'changed', summary: 'Keyboard focus is the 2px focus ring 2px off the track, as on Checkbox and Radio; a pointer focus draws none.' },
            { date: '2026-10-24', kind: 'changed', summary: 'Hover lays the 08 state layer over the track: primary 08 when off, shadow 08 over the fill when on.' },
            { date: '2026-10-23', kind: 'changed', summary: 'A labeled switch is a 24 row at every size, its label 14/20, with one track geometry.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="large"` was deprecated: it draws like `medium` and warns in development.' },
        ],
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
        source: { language: 'jsx', code: webAppSourceSnippets.formSwitch }
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

/**
 * Read-only: the setting is shown at full contrast and stays in the tab order,
 * and clicking does not change it.
 */
export const ReadOnly = () => (
    <Switch id="switch-readonly" label="Auto-assign substitutes" defaultChecked readOnly />
);
ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole('switch', { name: 'Auto-assign substitutes' });
    await expect(control.getAttribute('aria-readonly')).toBe('true');
    await userEvent.click(control);
    await expect(control.checked).toBe(true);
};

/** Keyboard focus: the focus-ring role, 2px wide and 2px off the track, as on Checkbox and Radio. */
export const KeyboardFocus = () => <Switch id="switch-focus" label="Send reminders" defaultChecked />;
KeyboardFocus.parameters = { docs: { disable: true } };
KeyboardFocus.play = async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('switch', { name: 'Send reminders' });
    control.style.transition = 'none';
    await userEvent.tab();
    await expect(document.activeElement).toBe(control);
    const style = getComputedStyle(control);
    await waitFor(() => expect(style.outlineStyle).toBe('solid'));
    await expect(px(style.outlineWidth), 'ring width').toBe(2);
    await expect(px(style.outlineOffset), 'ring gap').toBe(2);
    await expect(style.outlineColor, 'ring color').toBe(tokenColor(canvasElement, '--color-focus-ring'));
    await expect(style.boxShadow, 'no second ring').toBe('none');
};
