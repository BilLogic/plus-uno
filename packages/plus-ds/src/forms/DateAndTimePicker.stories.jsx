import React, { useState } from 'react';
import DateAndTimePicker from './DateAndTimePicker';

export default {
    title: 'Forms/Time Picker',
    component: DateAndTimePicker,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Date and Time Picker component for selecting dates and times. Supports various states including default, focus, disabled, error, and success validation states.'
            }
        }
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the date and time picker field',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            description: 'Whether the field is required (shows red asterisk)',
            table: { category: 'Content' }
        },
        datePlaceholder: {
            control: 'text',
            description: 'Placeholder text for the date input',
            table: { category: 'Content' }
        },
        timePlaceholder: {
            control: 'text',
            description: 'Placeholder text for the time input',
            table: { category: 'Content' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the component',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the date and time picker component',
            table: { category: 'Behavior' }
        },
        readonly: {
            control: 'boolean',
            description: 'Make the component read-only',
            table: { category: 'Behavior' }
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'success'],
            description: 'Validation state of the component',
            table: { category: 'Validation' }
        },
        validationMessage: {
            control: 'text',
            description: 'Message displayed for validation states',
            table: { category: 'Validation' }
        },
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Date and Time Picker configurations matching Figma specifications.
 */
export const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Default State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Default</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Default date and time picker component with label and required indicator.
                </p>
                <DateAndTimePicker
                    id="datetime-default"
                    label="Month"
                    required
                />
            </section>

            {/* Focus State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Focus</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Date and time picker component in focused state with primary border highlight.
                </p>
                <DateAndTimePicker
                    id="datetime-focus"
                    label="Month"
                    required
                />
            </section>

            {/* Disabled State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled date and time picker component with greyed out text and non-interactive controls.
                </p>
                <DateAndTimePicker
                    id="datetime-disabled"
                    label="Month"
                    required
                    disabled
                />
            </section>

            {/* Error State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Error</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Date and time picker component in error state with red border and validation message.
                </p>
                <DateAndTimePicker
                    id="datetime-error"
                    label="Month"
                    required
                    validation="invalid"
                    validationMessage="Validation message"
                />
            </section>

            {/* Success State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Success</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Date and time picker component in success state with green border and validation message.
                </p>
                <DateAndTimePicker
                    id="datetime-success"
                    label="Month"
                    required
                    validation="success"
                    validationMessage="Validation message"
                />
            </section>
        </div>
    );
};

/**
 * Interactive
 * Interactive example with controls for all props.
 */
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
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-surface-container)', borderRadius: '4px' }}>
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
    validationMessage: ''
};


