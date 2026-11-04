import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px } from '@/storybook-docs/lib/style-probes.js';
import Toggle from './Toggle';

export default {
    title: 'Components/Forms and inputs/Toggle',
    component: Toggle,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'Toggle replaces the old switch. Props follow Atlassian: `isChecked`, `isDisabled`. `size` is the track height in pixels, 16 or 20. The track takes the neutral bold fill off and the Lagoon fill on, with named hovered steps and the 2px focus ring in `border.focused`.' },
        ],
        docs: {
            description: {
                component:
                    'A toggle turns one setting on or off, and the change takes effect at once. It comes in two sizes: 16 for pages with many toggles, 20 to call attention to one setting.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Label text for the toggle',
            table: { category: 'Content' },
        },
        size: {
            control: 'inline-radio',
            options: [16, 20],
            description: 'Track height in pixels',
            table: { category: 'Design' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the toggle',
            table: { category: 'Behavior' },
        },
        isLoading: {
            control: 'boolean',
            description: 'A change is being saved: shows a spinner and ignores input',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            description: 'Shown and announced, not changeable',
            table: { category: 'Behavior' },
        },
        isChecked: { table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        name: { table: { disable: true, category: 'Development' } },
        value: { table: { disable: true, category: 'Development' } },
        defaultChecked: { table: { disable: true, category: 'Development' } },
        onChange: { table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxWidth: '360px' };

export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <Toggle id="toggle-overview" name="toggle-overview" label="Allow pull requests" defaultChecked />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formToggle }
    }
};

/** 16 is the default; 20 calls attention to one setting. */
export const Sizes = () => (
    <div style={stack}>
        <Toggle id="toggle-16" label="Size 16" size={16} defaultChecked />
        <Toggle id="toggle-20" label="Size 20" size={20} defaultChecked />
    </div>
);
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const small = canvas.getByRole('switch', { name: 'Size 16' });
    const large = canvas.getByRole('switch', { name: 'Size 20' });
    await expect(px(getComputedStyle(small).height), 'size 16 track height').toBe(16);
    await expect(px(getComputedStyle(small).width), 'size 16 track width').toBe(32);
    await expect(px(getComputedStyle(large).height), 'size 20 track height').toBe(20);
    await expect(px(getComputedStyle(large).width), 'size 20 track width').toBe(40);
};

/** Off, on, and disabled in each position. */
export const States = () => (
    <div style={stack}>
        <Toggle id="toggle-off" label="Off" />
        <Toggle id="toggle-on" label="On" defaultChecked />
        <Toggle id="toggle-disabled" label="Disabled" isDisabled />
        <Toggle id="toggle-disabled-on" label="Disabled and on" isDisabled defaultChecked />
    </div>
);

/** Loading: a change is being saved. A spinner shows, input is ignored and `aria-busy` is set. */
export const Loading = () => (
    <Toggle id="toggle-loading" label="Saving the setting" defaultChecked isLoading />
);
Loading.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole('switch', { name: 'Saving the setting' });
    await expect(control.getAttribute('aria-busy')).toBe('true');
    await expect(canvas.getByRole('status')).toBeTruthy();
    await userEvent.click(control);
    await expect(control.getAttribute('aria-checked')).toBe('true');
};

/** Short and long labels. */
export const Content = () => (
    <div style={stack}>
        <Toggle id="toggle-short" label="Wi-Fi" defaultChecked />
        <Toggle id="toggle-long" label="Enable email notifications for all activity" />
    </div>
);

export const Interactive = (args) => {
    const [checked, setChecked] = useState(false);

    return (
        <Toggle
            id="toggle-interactive"
            name="toggle-interactive"
            label={args.label}
            isChecked={checked}
            size={args.size}
            isDisabled={args.isDisabled}
            isReadOnly={args.isReadOnly}
            onChange={(e) => setChecked(e.target.checked)}
        />
    );
};

Interactive.args = {
    label: 'Allow pull requests',
    size: 16,
    isDisabled: false,
    isReadOnly: false,
};

/**
 * Read-only: the setting is shown at full contrast and stays in the tab order,
 * and clicking does not change it.
 */
export const ReadOnly = () => (
    <Toggle id="toggle-readonly" label="Auto-assign substitutes" defaultChecked isReadOnly />
);
ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole('switch', { name: 'Auto-assign substitutes' });
    await expect(control.getAttribute('aria-readonly')).toBe('true');
    await userEvent.click(control);
    await expect(control.getAttribute('aria-checked')).toBe('true');
};

/** Keyboard focus: the focus-ring role, 2px wide and 2px off the track, as on Checkbox and Radio. */
export const KeyboardFocus = () => <Toggle id="toggle-focus" label="Send reminders" defaultChecked />;
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
    await expect(style.boxShadow, 'no second ring').toBe('none');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(style.outlineColor, `${mode}: ring color`).toBe(token('--ds-border-focused'));
    });
};

/**
 * Track colors: neutral bold off and Lagoon on, each stepping to its named
 * hovered step; the thumb is `icon.inverse`, and a disabled toggle takes the
 * disabled fill with an `icon.disabled` thumb in both positions.
 */
export const TrackColors = () => (
    <div style={stack}>
        <Toggle id="toggle-c-off" label="Off" />
        <Toggle id="toggle-c-on" label="On" defaultChecked />
        <Toggle id="toggle-c-dis" label="Disabled off" isDisabled />
        <Toggle id="toggle-c-dis-on" label="Disabled on" isDisabled defaultChecked />
    </div>
);
TrackColors.parameters = { docs: { disable: true } };
TrackColors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = (name) => canvas.getByRole('switch', { name });
    const fill = (el) => getComputedStyle(el).backgroundColor;
    const hovered = (el) => withForcedPseudo(el, ':hover', () => getComputedStyle(el).backgroundColor);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(fill(control('Off')), `${mode}: off track`).toBe(token('--ds-background-neutral-bold'));
        await expect(fill(control('On')), `${mode}: on track`).toBe(token('--ds-background-selected-bold'));
        await expect(hovered(control('Off')), `${mode}: off hovered`).toBe(token('--ds-background-neutral-bold-hovered'));
        await expect(hovered(control('On')), `${mode}: on hovered`).toBe(token('--ds-background-selected-bold-hovered'));
        const thumb = (el) => el.querySelector('.plus-toggle-thumb');
        await expect(getComputedStyle(thumb(control('On'))).backgroundColor, `${mode}: thumb`).toBe(token('--ds-icon-inverse'));
        for (const name of ['Disabled off', 'Disabled on']) {
            await expect(fill(control(name)), `${mode}: ${name} track`).toBe(token('--ds-background-disabled'));
            await expect(getComputedStyle(thumb(control(name))).backgroundColor, `${mode}: ${name} thumb`).toBe(token('--ds-icon-disabled'));
        }
    });
};
