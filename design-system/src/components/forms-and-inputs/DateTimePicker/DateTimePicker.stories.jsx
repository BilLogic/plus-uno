import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, within } from 'storybook/test';
import { expectFieldDisabled, expectFieldFocused, expectFieldHovered, expectFieldInvalid, expectFieldReadOnly, fieldBox } from '@/storybook-docs/lib/field-states.js';
import DateTimePicker from './DateTimePicker';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Forms and inputs/Date time picker/Date time picker',
    component: DateTimePicker,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A date field and a time field read as one moment, with the viewer’s time zone named beneath. The date half opens the same calendar as DatePicker.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Label text for the date and time picker field',
            table: { category: 'Content' },
        },
        isRequired: {
            control: 'boolean',
            description: 'Whether the field is required (shows red asterisk)',
            table: { category: 'Content' },
        },
        datePlaceholder: {
            control: 'text',
            description: 'Placeholder text for the date input',
            table: { category: 'Content' },
        },
        timePlaceholder: {
            control: 'text',
            description: 'Placeholder text for the time input',
            table: { category: 'Content' },
        },
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            description: 'Field height: 40 default, 32 compact',
            table: { category: 'Design' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the date and time picker component',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            description: 'Make the component read-only',
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
        errorMessage: {
            control: 'text',
            description: 'Message shown when `isInvalid`',
            table: { category: 'Validation' },
        },
        successMessage: {
            control: 'text',
            description: 'Message shown when `isValid`',
            table: { category: 'Validation' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        showSectionLabels: {
            control: 'boolean',
            description: 'Show or hide the Date/Time section labels above each input',
            table: { category: 'Content' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => (
    <div style={{ maxWidth: 'var(--size-4000)' }}>
        <DateTimePicker id="datetime-overview" label="Month" isRequired showSectionLabels={false} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formDateTime }
    }
};

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', maxWidth: 'var(--size-5400)' }}>
        <div>
            <DemoLabel>DEFAULT (40)</DemoLabel>
            <DateTimePicker id="dt-default" label="Month" isRequired spacing="default" showSectionLabels={false} />
        </div>
        <div>
            <DemoLabel>COMPACT (32)</DemoLabel>
            <DateTimePicker id="dt-compact" label="Month" isRequired spacing="compact" showSectionLabels={false} />
        </div>
    </div>
);

export const Validation = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', maxWidth: 'var(--size-5400)' }}>
        <div>
            <DemoLabel>INVALID</DemoLabel>
            <DateTimePicker
                id="datetime-error"
                label="Month"
                isRequired
                isInvalid
                errorMessage="Validation message"
                showSectionLabels={false}
            />
        </div>
        <div>
            <DemoLabel>VALID</DemoLabel>
            <DateTimePicker
                id="datetime-success"
                label="Month"
                isRequired
                isValid
                successMessage="Validation message"
                showSectionLabels={false}
            />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', maxWidth: 'var(--size-5400)' }}>
        <div>
            <DemoLabel>DEFAULT</DemoLabel>
            <DateTimePicker id="datetime-default" label="Month" isRequired showSectionLabels={false} />
        </div>
        <div>
            <DemoLabel>DISABLED</DemoLabel>
            <DateTimePicker id="datetime-disabled" label="Month" isRequired isDisabled showSectionLabels={false} />
        </div>
        <div>
            <DemoLabel>READ ONLY</DemoLabel>
            <DateTimePicker id="datetime-readonly" label="Month" isRequired isReadOnly showSectionLabels={false} />
        </div>
    </div>
);

export const TimeZones = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', maxWidth: 'var(--size-4000)', paddingBottom: 'var(--size-1900)' }}>
        <DateTimePicker
            id="datetime-tz-same"
            label="Session start"
            timeZone="America/New_York"
            dateValue="2026-10-21"
            timeValue="04:00 PM"
        />
        <DateTimePicker
            id="datetime-tz-other"
            label="Session start"
            timeZone="America/Los_Angeles"
            otherTimeZone="America/New_York"
            otherPerson="the student"
            dateValue="2026-10-21"
            timeValue="01:00 PM"
        />
    </div>
);
TimeZones.storyName = 'Time zones';
TimeZones.parameters = {
    docs: {
        description: {
            story: 'The caption names the viewer’s zone. When the other person is elsewhere, it adds their time too.',
        },
    },
};

export const Interactive = (args) => {
    const [value, setValue] = useState(null);

    return (
        <div style={{ maxWidth: 'var(--size-4000)' }}>
            <DateTimePicker
                {...args}
                onChange={(data) => {
                    setValue(data);
                }}
            />
            {value && (
                <div
                    style={{
                        marginTop: 'var(--space-100)',
                        padding: 'var(--space-075)',
                        backgroundColor: 'var(--ds-surface-container)',
                        borderRadius: 'var(--radius-025)',
                    }}
                >
                    <p className="body-default" style={{ margin: 0 }}>
                        <strong>Selected:</strong> {value.date} {value.time || ''}
                    </p>
                </div>
            )}
        </div>
    );
};

Interactive.args = {
    id: 'datetime-interactive',
    label: 'Month',
    isRequired: true,
    datePlaceholder: 'MM/DD/YY',
    timePlaceholder: '__ : __',
    spacing: 'default',
    isDisabled: false,
    isReadOnly: false,
    isInvalid: false,
    isValid: false,
    showSectionLabels: false,
};

/** One story per state, for the Examples tab. */
const wrap = { maxWidth: 'var(--size-4000)' };
const dateInput = (canvasElement) => canvasElement.querySelectorAll('input')[0];
const timeInput = (canvasElement) => canvasElement.querySelectorAll('input')[1];

export const Default = {
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-default" label="Session start" showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('group', { name: 'Session start' })).toBeVisible();
        await expect(dateInput(canvasElement)).toHaveValue('');
        await expect(timeInput(canvasElement)).toHaveValue('');
    },
};

export const WithValue = {
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-value" label="Session start" dateValue="2026-10-21" timeValue="04:00 PM" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(dateInput(canvasElement)).toHaveValue('10/21/2026');
        await expect(timeInput(canvasElement)).toHaveValue('4:00 PM');
    },
};

export const Compact = {
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-compact" label="Session start" spacing="compact" showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(fieldBox(canvasElement, 0).getBoundingClientRect().height).toBe(32);
        await expect(fieldBox(canvasElement, 1).getBoundingClientRect().height).toBe(32);
    },
};

export const Invalid = {
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-invalid" label="Session start" isInvalid errorMessage="Choose a start date and time." showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expectFieldInvalid(canvasElement, fieldBox(canvasElement, 0), 'date half');
        await expectFieldInvalid(canvasElement, fieldBox(canvasElement, 1), 'time half');
        await expect(within(canvasElement).getByText('Choose a start date and time.')).toBeVisible();
    },
};

export const Valid = {
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-valid" label="Session start" isValid successMessage="Start saved." dateValue="2026-10-21" timeValue="04:00 PM" showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(fieldBox(canvasElement, 0)).toHaveClass('plus-field--valid');
        await expect(within(canvasElement).getByText('Start saved.')).toBeVisible();
    },
};

export const ReadOnly = {
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-readonly" label="Session start" isReadOnly dateValue="2026-10-21" timeValue="04:00 PM" showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expectFieldReadOnly(canvasElement, fieldBox(canvasElement, 0), 'date half');
        await expectFieldReadOnly(canvasElement, fieldBox(canvasElement, 1), 'time half');
    },
};

export const Disabled = {
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-disabled" label="Session start" isDisabled showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expectFieldDisabled(fieldBox(canvasElement, 0), 'date half');
        await expectFieldDisabled(fieldBox(canvasElement, 1), 'time half');
        await expect(dateInput(canvasElement)).toBeDisabled();
    },
};

/** Hover turns each half's border `border.focused`. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-hover" label="Session start" showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expectFieldHovered(canvasElement, fieldBox(canvasElement, 0), 'date half');
        await expectFieldHovered(canvasElement, fieldBox(canvasElement, 1), 'time half');
    },
};

/** Keyboard focus draws the 2px ring, 2px off the focused half. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={wrap}>
            <DateTimePicker id="dt-state-focus" label="Session start" showSectionLabels={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expectFieldFocused(canvasElement, fieldBox(canvasElement, 0), dateInput(canvasElement), 'date half');
        await expectFieldFocused(canvasElement, fieldBox(canvasElement, 1), timeInput(canvasElement), 'time half');
    },
};
