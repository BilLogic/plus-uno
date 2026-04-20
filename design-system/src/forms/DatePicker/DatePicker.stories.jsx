import React, { useState } from 'react';
import DatePicker from './DatePicker';

export default {
    title: 'Forms/Date Picker',
    component: DatePicker,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'DatePicker component for selecting dates. Supports single date selection and date range selection through paired pickers.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design', defaultValue: { summary: 'medium' } },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        calendarAlign: {
            control: 'select',
            options: ['left', 'center', 'right'],
            description: 'Calendar dropdown alignment',
            table: { category: 'Layout' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the picker',
            table: { category: 'Behavior' },
        },
        readOnly: {
            control: 'boolean',
            description: 'Make read-only',
            table: { category: 'Behavior' },
        },
        minDate: {
            control: 'text',
            description: 'Optional minimum allowed date',
            table: { category: 'Behavior' },
        },
        maxDate: {
            control: 'text',
            description: 'Optional maximum allowed date',
            table: { category: 'Behavior' },
        },
    },
};

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '300px' }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Small, medium, and large trigger and calendar.
        </p>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SMALL</span>
                <DatePicker size="small" placeholder="Small" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
                <DatePicker size="medium" placeholder="Medium" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LARGE</span>
                <DatePicker size="large" placeholder="Large" />
            </div>
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '300px' }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Empty, with value, disabled, and read-only.
        </p>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
                <DatePicker placeholder="Default" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH VALUE</span>
                <DatePicker value="2023-10-25" placeholder="With Value" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <DatePicker disabled placeholder="Disabled" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
                <DatePicker readOnly value="2023-10-25" placeholder="Read Only" />
            </div>
        </div>
    </div>
);

export const PickDate = () => {
    const [date, setDate] = useState('');

    return (
        <div style={{ paddingBottom: '300px', maxWidth: '300px' }}>
            <h6 style={{ marginBottom: '16px' }}>Select a Single Date</h6>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                Click on the input to open the calendar and select a date.
            </p>
            <DatePicker value={date} onChange={setDate} placeholder="Select a date" />
            {date && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--color-surface-container)',
                        borderRadius: '4px',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '14px' }}>
                        <strong>Selected:</strong> {date}
                    </p>
                </div>
            )}
        </div>
    );
};
PickDate.storyName = 'Pick Date';
PickDate.parameters = {
    docs: {
        description: {
            story: 'Single date selection scenario. User picks one specific date.',
        },
    },
};

export const PickRange = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    return (
        <div style={{ paddingBottom: '300px' }}>
            <h6 style={{ marginBottom: '16px' }}>Select a Date Range</h6>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                Use two date pickers to define a start and end date for a range.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Start Date" maxDate={endDate} />
                <span style={{ color: '#666' }}>to</span>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="End Date" minDate={startDate} />
            </div>
            {(startDate || endDate) && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--color-surface-container)',
                        borderRadius: '4px',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '14px' }}>
                        <strong>Range:</strong> {startDate || '(not set)'} → {endDate || '(not set)'}
                    </p>
                </div>
            )}
        </div>
    );
};
PickRange.storyName = 'Pick Range';
PickRange.parameters = {
    docs: {
        description: {
            story: 'Date range selection scenario. Two paired pickers allow selecting a start and end date, with automatic range constraint.',
        },
    },
};

export const Interactive = (args) => {
    const [date, setDate] = useState('');

    return (
        <div style={{ paddingBottom: '300px' }}>
            <p>Selected Date: {date || 'None'}</p>
            <DatePicker {...args} value={date} onChange={setDate} />
        </div>
    );
};
Interactive.args = {
    placeholder: 'Select a date',
    size: 'medium',
    disabled: false,
    readOnly: false,
};
