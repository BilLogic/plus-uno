import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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

const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <DateAndTimePicker id="datetime-overview" label="Month" required showSectionLabels={false} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.formDateTime }
    }
};

export const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <section>
            <h6 className="h6 mb-2">Without section labels</h6>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '12px' }}>
                Compact row: date and time only.
            </p>
            <div style={contentVariantCard}>
                <DateAndTimePicker id="datetime-content-nolabel" label="Month" required showSectionLabels={false} />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-2">With section labels</h6>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '12px' }}>
                “Date” and “Time” captions above each control.
            </p>
            <div style={contentVariantCard}>
                <DateAndTimePicker id="datetime-content-labels" label="Month" required showSectionLabels />
            </div>
        </section>
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SMALL</span>
            <DateAndTimePicker id="dt-small" label="Month" required size="small" showSectionLabels={false} />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
            <DateAndTimePicker id="dt-medium" label="Month" required size="medium" showSectionLabels={false} />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LARGE</span>
            <DateAndTimePicker id="dt-large" label="Month" required size="large" showSectionLabels={false} />
        </div>
    </div>
);

export const Styles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INVALID</span>
            <DateAndTimePicker
                id="datetime-error"
                label="Month"
                required
                validation="invalid"
                validationMessage="Validation message"
                showSectionLabels={false}
            />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SUCCESS</span>
            <DateAndTimePicker
                id="datetime-success"
                label="Month"
                required
                validation="success"
                validationMessage="Validation message"
                showSectionLabels={false}
            />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
            <DateAndTimePicker id="datetime-default" label="Month" required showSectionLabels={false} />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
            <DateAndTimePicker id="datetime-disabled" label="Month" required disabled showSectionLabels={false} />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
            <DateAndTimePicker id="datetime-readonly" label="Month" required readonly showSectionLabels={false} />
        </div>
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
