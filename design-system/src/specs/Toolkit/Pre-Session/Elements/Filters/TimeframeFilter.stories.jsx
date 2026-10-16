import React, { useState } from 'react';
import { expect, within } from 'storybook/test';
import { DatePicker, Select } from '@/components';
import { FilterSelect } from './FilterSelect';
import { playPicksOne } from './filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Timeframe Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const timeframeOptions = [
    { value: 'this_week', label: 'This week' },
    { value: 'this_month', label: 'This month' },
    { value: 'all_time', label: 'All time' },
    { value: 'custom', label: 'Custom' },
];

/**
 * Timeframe filter: timeframes exclude each other, so it picks one and
 * applies at once. "Custom" adds a from and a to date beside it.
 */
export const TimeframeFilter = ({ value, defaultValue = 'this_week', onChange, open, showCustomDates = false }) => {
    const [own, setOwn] = useState(defaultValue);
    const timeframe = value !== undefined ? value : own;
    const isCustom = timeframe === 'custom' || showCustomDates;

    const handleChange = (next) => {
        if (value === undefined) setOwn(next);
        if (onChange) onChange(next);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm)' }}>
            <FilterSelect
                aria-label="Timeframe"
                options={timeframeOptions}
                value={timeframe}
                onChange={handleChange}
                open={open}
            />
            {isCustom && (
                <>
                    <DatePicker size="small" aria-label="From date" />
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>to</span>
                    <DatePicker size="small" aria-label="To date" />
                </>
            )}
        </div>
    );
};

/** Every state: closed, open, custom with its dates, and the other picks. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-3">Default state (closed)</h6>
            <TimeframeFilter />
        </section>
        <section style={{ paddingBottom: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Open state</h6>
            <TimeframeFilter open />
        </section>
        <section style={{ marginTop: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Custom picked (with dates)</h6>
            <TimeframeFilter defaultValue="custom" />
        </section>
        <section>
            <h6 className="h6 mb-3">Other picks</h6>
            <div style={{ display: 'flex', gap: 'var(--size-element-gap-lg)' }}>
                <TimeframeFilter defaultValue="this_month" />
                <TimeframeFilter defaultValue="all_time" />
            </div>
        </section>
    </div>
);

/** Pick a timeframe; "Custom" shows the date fields. */
export const Interactive = () => {
    const [timeframe, setTimeframe] = useState('this_week');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
            <TimeframeFilter value={timeframe} onChange={setTimeframe} />
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {timeframe}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = async (context) => {
    await playPicksOne({ name: 'Timeframe', pick: 'Custom', after: /^custom$/ })(context);
    const canvas = within(context.canvasElement);
    await expect(canvas.getByLabelText('From date')).toBeInTheDocument();
    await expect(canvas.getByLabelText('To date')).toBeInTheDocument();
};
