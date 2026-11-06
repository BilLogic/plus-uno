import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { expectFieldDisabled, expectFieldFocused, expectFieldHovered, expectFieldInvalid, expectFieldReadOnly, fieldBox } from '@/storybook-docs/lib/field-states.js';
import TimePicker from './TimePicker';

export default {
    title: 'Components/Forms and inputs/Date time picker/Time picker',
    component: TimePicker,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A time field with an AM/PM toggle. It is checked when you press Enter or leave the field: a real time (hour 1–12, minute 0–59) is picked, anything else is kept as typed and marked invalid.',
            },
        },
    },
    argTypes: {
        style: { table: { disable: true } },
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            description: 'Field height: 40 default, 32 compact',
            table: { category: 'Design', defaultValue: { summary: 'default' } },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the picker',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            description: 'Make read-only',
            table: { category: 'Behavior' },
        },
        isInvalid: {
            control: 'boolean',
            description: 'Draw the field invalid',
            table: { category: 'Validation' },
        },
        isValid: {
            control: 'boolean',
            description: 'Draw the field valid',
            table: { category: 'Validation' },
        },
    },
};

export const Overview = () => (
    <div style={{ maxWidth: 'var(--size-1400)' }}>
        <TimePicker placeholder="__ : __" aria-label="Time" />
    </div>
);

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', maxWidth: 'var(--size-1400)' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT (40)</span>
            <TimePicker spacing="default" aria-label="Time" placeholder="Default" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">COMPACT (32)</span>
            <TimePicker spacing="compact" aria-label="Time" placeholder="Compact" />
        </div>
    </div>
);
Spacing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [defaultField, compactField] = canvas.getAllByRole('textbox');
    await inEveryColorModeOf(canvasElement, async (mode) => {
        await expect(defaultField.closest('.plus-field'), `${mode}: default field`).toHaveAttribute('data-spacing', 'default');
        await expect(compactField.closest('.plus-field'), `${mode}: compact field`).toHaveAttribute('data-spacing', 'compact');
    });
};

export const InteractionStates = () => (
    <div style={{ display: 'flex', gap: 'var(--space-150)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
            <TimePicker aria-label="Time" placeholder="Default" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH VALUE</span>
            <TimePicker aria-label="Time" value="02:30 PM" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
            <TimePicker aria-label="Time" isDisabled placeholder="Disabled" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
            <TimePicker aria-label="Time" isReadOnly value="02:30 PM" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INVALID</span>
            <TimePicker aria-label="Time" isInvalid placeholder="Invalid" />
        </div>
    </div>
);
InteractionStates.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const withValue = canvas.getAllByRole('textbox')[1];
    await expect(withValue).toHaveValue('02:30');
    const toggle = withValue.closest('.plus-field').querySelector('.plus-time-picker__period-toggle');
    await expect(toggle.textContent.trim()).toBe('PM');
};

export const PickTime = () => {
    const [value, setValue] = useState('');

    return (
        <div style={{ maxWidth: 'var(--size-1400)' }}>
            <h6 style={{ marginBottom: 'var(--space-100)' }}>Set a Time</h6>
            <TimePicker aria-label="Time" value={value} onChange={setValue} />
            {value && (
                <div
                    style={{
                        marginTop: 'var(--space-100)',
                        padding: 'var(--space-075)',
                        backgroundColor: 'var(--ds-surface-container)',
                        borderRadius: 'var(--radius-025)',
                    }}
                >
                    <p style={{ margin: 0, fontSize: 'var(--font-size-0875)' }}>
                        <strong>Time:</strong> {value}
                    </p>
                </div>
            )}
        </div>
    );
};
PickTime.storyName = 'Pick Time';
PickTime.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, '0930');
    await userEvent.tab();
    await expect(input).toHaveValue('09:30');
    await expect(canvas.getByText('Time:')).toBeVisible();
};

export const TwentyFourHourValueIsSplit = () => (
    <TimePicker aria-label="Time" value="14:30" />
);
TwentyFourHourValueIsSplit.storyName = '24-hour value is split';
TwentyFourHourValueIsSplit.parameters = {
    docs: {
        description: {
            story: 'A 24-hour value is split into the hour this control can show and the period that says which half of the day it is.',
        },
    },
};
TwentyFourHourValueIsSplit.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('02:30');
    const toggle = canvasElement.querySelector('.plus-time-picker__period-toggle');
    await expect(toggle.textContent.trim()).toBe('PM');
};

/** One story per state, for the Examples tab. */
const wrap = { maxWidth: 'var(--size-1400)' };
const input = (canvasElement) => within(canvasElement).getByRole('textbox');
const period = (canvasElement) => canvasElement.querySelector('.plus-time-picker__period-toggle');

export const Default = {
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" /></div>,
    play: async ({ canvasElement }) => {
        await expect(input(canvasElement)).toHaveAttribute('placeholder', '__ : __');
        await expect(input(canvasElement)).toHaveValue('');
    },
};

export const WithValue = {
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" value="02:30 PM" /></div>,
    play: async ({ canvasElement }) => {
        await expect(input(canvasElement)).toHaveValue('02:30');
        await expect(period(canvasElement).textContent.trim()).toBe('PM');
    },
};

export const Compact = {
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" spacing="compact" /></div>,
    play: async ({ canvasElement }) => {
        await expect(fieldBox(canvasElement).getBoundingClientRect().height).toBe(32);
    },
};

export const Invalid = {
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" isInvalid /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldInvalid(canvasElement, fieldBox(canvasElement), 'time picker');
    },
};

export const ReadOnly = {
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" isReadOnly value="02:30 PM" /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldReadOnly(canvasElement, fieldBox(canvasElement), 'time picker');
    },
};

export const Disabled = {
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" isDisabled /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldDisabled(fieldBox(canvasElement), 'time picker');
        await expect(input(canvasElement)).toBeDisabled();
    },
};

/** Hover turns the border `border.focused`. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldHovered(canvasElement, fieldBox(canvasElement), 'time picker');
    },
};

/** Keyboard focus draws the 2px ring, 2px off the box. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <div style={wrap}><TimePicker aria-label="Reminder time" /></div>,
    play: async ({ canvasElement }) => {
        await expectFieldFocused(canvasElement, fieldBox(canvasElement), input(canvasElement), 'time picker');
    },
};

export const Interactive = (args) => {
    const [value, setValue] = useState('');
    return (
        <div style={wrap}>
            <TimePicker {...args} value={value} onChange={setValue} />
        </div>
    );
};
Interactive.args = { 'aria-label': 'Reminder time', spacing: 'default', isDisabled: false, isReadOnly: false, isInvalid: false };
