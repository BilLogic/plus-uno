import React, { useState } from 'react';
import Dropdown from '../../../../../components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Timeframe Filter',
    component: Dropdown,
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const timeframeOptions = [
    { text: 'This week', value: 'this_week' },
    { text: 'This month', value: 'this_month' },
    { text: 'All time', value: 'all_time' },
    { text: 'Custom', value: 'custom' },
];

/**
 * Timeframe Filter Wrapper
 * Dropdown with optional date pickers when Custom is selected
 */
export const TimeframeFilter = ({ initialSelection = 'This week', interactive = true, isOpen, showCustomDates = false }) => {
    const [selected, setSelected] = useState(initialSelection);
    const isCustom = selected === 'Custom' || showCustomDates;

    const dropdownItems = timeframeOptions.map(opt => ({
        text: opt.text,
        selected: selected === opt.text,
        onClick: interactive ? () => setSelected(opt.text) : undefined
    }));

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-sm)'
            }}
        >
            <Dropdown
                buttonText={selected}
                items={dropdownItems}
                style="secondary"
                fill="outline"
                size="small"
                isOpen={isOpen}
            />
            {isCustom && (
                <>
                    <Dropdown
                        buttonText="Select Date"
                        items={[]}
                        style="primary"
                        fill="outline"
                        size="small"
                    />
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>to</span>
                    <Dropdown
                        buttonText="Select Date"
                        items={[]}
                        style="primary"
                        fill="outline"
                        size="small"
                    />
                </>
            )}
        </div>
    );
};

/**
 * Overview - All States
 * Shows all visual states of the Timeframe Filter
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        <section>
            <h6 className="h6 mb-3">Default State (Closed)</h6>
            <TimeframeFilter initialSelection="This week" interactive={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State (Dropdown Menu)</h6>
            <div style={{ height: '180px' }}>
                <TimeframeFilter initialSelection="This week" interactive={false} isOpen={true} />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Custom Selected (With Date Pickers)</h6>
            <TimeframeFilter initialSelection="Custom" interactive={false} showCustomDates={true} />
        </section>

        <section>
            <h6 className="h6 mb-3">Other Selections</h6>
            <div style={{ display: 'flex', gap: 'var(--size-element-gap-lg)' }}>
                <TimeframeFilter initialSelection="This month" interactive={false} />
                <TimeframeFilter initialSelection="All time" interactive={false} />
            </div>
        </section>
    </div>
);

/**
 * Interactive Demo
 * Allows user to interact with the filter
 */
export const Interactive = () => (
    <div>
        <h6 className="h6 mb-3">Interactive Demo</h6>
        <p className="body2-txt mb-4">
            Select a timeframe option. Choosing "Custom" will show date pickers.
        </p>
        <TimeframeFilter />
    </div>
);
