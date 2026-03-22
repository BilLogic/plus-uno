import React, { useState } from 'react';
import DateAndTimePicker from './DateAndTimePicker';

export default {
    title: 'Forms/Time Picker',
    component: DateAndTimePicker,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Date and Time Picker component for selecting dates and times. Supports various states including default, focus, disabled, error, and success validation states.',
            },
        },
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the date and time picker field',
            table: { category: 'Content' },
        },
        required: {
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
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the component',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the date and time picker component',
            table: { category: 'Behavior' },
        },
        readonly: {
            control: 'boolean',
            description: 'Make the component read-only',
            table: { category: 'Behavior' },
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'success'],
            description: 'Validation state of the component',
            table: { category: 'Validation' },
        },
        validationMessage: {
            control: 'text',
            description: 'Message displayed for validation states',
            table: { category: 'Validation' },
        },
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' },
        },
        showSectionLabels: {
            control: 'boolean',
            description: 'Show or hide the Date/Time section labels above each input',
            table: { category: 'Content' },
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' },
        },
    },
};

export const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
        <div>
            <h6 className="h6 mb-2">Without section labels</h6>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Compact row: date and time only.
            </p>
            <DateAndTimePicker id="datetime-content-nolabel" label="Month" required showSectionLabels={false} />
        </div>
        <div>
            <h6 className="h6 mb-2">With section labels</h6>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                “Date” and “Time” captions above each control.
            </p>
            <DateAndTimePicker id="datetime-content-labels" label="Month" required showSectionLabels />
        </div>
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <DateAndTimePicker id="dt-small" label="Month" required size="small" showSectionLabels={false} />
        <DateAndTimePicker id="dt-medium" label="Month" required size="medium" showSectionLabels={false} />
        <DateAndTimePicker id="dt-large" label="Month" required size="large" showSectionLabels={false} />
    </div>
);

export const Variants = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <DateAndTimePicker
            id="datetime-error"
            label="Month"
            required
            validation="invalid"
            validationMessage="Validation message"
            showSectionLabels={false}
        />
        <DateAndTimePicker
            id="datetime-success"
            label="Month"
            required
            validation="success"
            validationMessage="Validation message"
            showSectionLabels={false}
        />
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <DateAndTimePicker id="datetime-default" label="Month" required showSectionLabels={false} />
        <DateAndTimePicker id="datetime-disabled" label="Month" required disabled showSectionLabels={false} />
        <DateAndTimePicker id="datetime-readonly" label="Month" required readonly showSectionLabels={false} />
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(null);

    return (
        <div style={{ maxWidth: '600px' }}>
            <DateAndTimePicker
                {...args}
                onChange={(data) => {
                    setValue(data);
                    console.log('Date and Time:', data);
                }}
            />
            {value && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--color-surface-container)',
                        borderRadius: '4px',
                    }}
                >
                    <p className="body2-txt" style={{ margin: 0 }}>
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
    required: true,
    datePlaceholder: 'MM/DD/YY',
    timePlaceholder: '__ : __',
    size: 'medium',
    disabled: false,
    readonly: false,
    validation: 'none',
    validationMessage: '',
    showSectionLabels: false,
};
