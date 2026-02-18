import React, { useState } from 'react';
import Select from '../../../../../forms/Select';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Form/Reason Dropdown',
    component: Select,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

// Call-off reason options
const reasonOptions = [
    { value: 'illness', label: 'Illness/Health issue' },
    { value: 'family', label: 'Family emergency' },
    { value: 'work', label: 'Work/Job conflict' },
    { value: 'transportation', label: 'Transportation issue' },
    { value: 'academic', label: 'Academic commitment' },
    { value: 'mistake', label: 'Signed up by mistake' },
    { value: 'other', label: 'Other' },
];

/**
 * Overview - All States
 * Shows all visual states of the Call-Off Reason Select
 * 
 * Uses design system Select component with:
 * - mode="single" for single selection
 * - required=true for showing required indicator
 * - placeholder for unfilled state
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
            <h6 className="h6 mb-3">Unfilled State (Default/Placeholder)</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-xs)',
                    maxWidth: '589px'
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
                    <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        Reason for call-Off
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Select
                    options={reasonOptions}
                    placeholder="Select a reason"
                    mode="single"
                    required
                />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Filled State (Selection Made)</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-xs)',
                    maxWidth: '589px'
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
                    <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        Reason for call-Off
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Select
                    options={reasonOptions}
                    placeholder="Select a reason"
                    mode="single"
                    defaultValue="other"
                    required
                />
            </div>
        </section>
    </div>
);

/**
 * Interactive Demo
 * Allows user to interact with the select
 */
export const Interactive = () => {
    const [selectedReason, setSelectedReason] = useState('');

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Select a reason for the call-off from the dropdown.
            </p>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-xs)',
                    maxWidth: '589px'
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
                    <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        Reason for call-Off
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Select
                    options={reasonOptions}
                    placeholder="Select a reason"
                    mode="single"
                    value={selectedReason}
                    onChange={(val) => setSelectedReason(val)}
                    required
                />
            </div>
            {selectedReason && (
                <p className="body2-txt mt-4" style={{ color: 'var(--color-secondary-text)' }}>
                    Selected: {reasonOptions.find(o => o.value === selectedReason)?.label}
                </p>
            )}
        </div>
    );
};
