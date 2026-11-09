import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
                    'A time field: type a time, or pick one from the day\'s times, every half hour by default. Each time carries its period. A typed time that is not in the list is read on Enter; text that is not a time is refused and marked invalid.',
            },
        },
    },
    argTypes: {
        style: { table: { disable: true } },
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            table: { category: 'Design', defaultValue: { summary: 'default' } },
        },
        placeholder: {
            control: 'text',
            table: { category: 'Content' },
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isInvalid: {
            control: 'boolean',
            table: { category: 'Validation' },
        },
        isValid: {
            control: 'boolean',
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
    const [defaultField, compactField] = canvas.getAllByRole('combobox');
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
    const withValue = canvas.getAllByRole('combobox')[1];
    // The picked time reads as it does in the list; there is no AM/PM control beside it.
    await expect(withValue).toHaveValue('2:30 PM');
    await expect(withValue.closest('.plus-field').querySelector('.plus-time-picker__period-toggle')).toBeNull();
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
    const input = canvas.getByRole('combobox');
    const body = within(canvasElement.ownerDocument.body);

    // Typing filters the day's times; picking one reports it.
    await userEvent.click(input);
    await userEvent.type(input, '9:30');
    await userEvent.click(await body.findByRole('option', { name: '9:30 AM' }));
    await expect(canvas.getByText('09:30 AM')).toBeVisible();

    // A time that is not in the list is read from what was typed.
    await userEvent.click(input);
    await userEvent.type(input, '1405{Enter}');
    await expect(canvas.getByText('02:05 PM')).toBeVisible();
};

export const TwentyFourHourValueIsSplit = () => (
    <TimePicker aria-label="Time" value="14:30" />
);
TwentyFourHourValueIsSplit.storyName = '24-hour value';
TwentyFourHourValueIsSplit.parameters = {
    docs: {
        description: {
            story: 'A 24-hour value is read as the same time and shown in 12-hour form.',
        },
    },
};
TwentyFourHourValueIsSplit.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveValue('2:30 PM');
};

/** One story per state, for the Examples tab. */
const wrap = { maxWidth: 'var(--size-1400)' };
const input = (canvasElement) => within(canvasElement).getByRole('combobox');

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
        await expect(input(canvasElement)).toHaveValue('2:30 PM');
        // Opening the list brings the picked time into view, without scrolling the page.
        const pageTop = window.scrollY;
        await userEvent.click(input(canvasElement));
        const picked = await within(document.body).findByRole('option', { name: '2:30 PM' });
        const surface = picked.closest('.plus-listbox').getBoundingClientRect();
        await waitFor(() => {
            const row = picked.getBoundingClientRect();
            expect(row.top >= surface.top && row.bottom <= surface.bottom, 'the picked row is in view').toBe(true);
        });
        await expect(window.scrollY, 'the page did not move').toBe(pageTop);
        await userEvent.keyboard('{Escape}');
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
