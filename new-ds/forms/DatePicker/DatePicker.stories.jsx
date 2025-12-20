import React, { useState } from 'react';
import DatePicker from './DatePicker';

export default {
    title: 'Forms/DatePicker',
    component: DatePicker,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'DatePicker component for selecting dates. Replicates legacy design using React state and Bootstrap Dropdown.'
            }
        }
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large']
        },
        calendarAlign: {
            control: 'select',
            options: ['left', 'center', 'right']
        },
        disabled: {
            control: 'boolean'
        },
        readOnly: {
            control: 'boolean'
        }
    }
};

export const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '300px' }}>
            <section>
                <h5>Sizes</h5>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <DatePicker size="small" placeholder="Small" />
                    <DatePicker size="medium" placeholder="Medium" />
                    <DatePicker size="large" placeholder="Large" />
                </div>
            </section>

            <section>
                <h5>States</h5>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <DatePicker placeholder="Default" />
                    <DatePicker value="2023-10-25" placeholder="With Value" />
                    <DatePicker disabled placeholder="Disabled" />
                    <DatePicker readOnly value="2023-10-25" placeholder="Read Only" />
                </div>
            </section>
        </div>
    );
};

export const Interactive = () => {
    const [date, setDate] = useState('');

    return (
        <div style={{ paddingBottom: '300px' }}>
            <p>Selected Date: {date || 'None'}</p>
            <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Select a date"
            />
        </div>
    );
};

export const RangeExample = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '300px' }}>
            <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
                maxDate={endDate}
            />
            <span>to</span>
            <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="End Date"
                minDate={startDate}
            />
        </div>
    );
};
