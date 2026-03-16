import React, { useState } from 'react';
import Select from '../../../../../forms/Select';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Form/Supervisor Selection Dropdown',
    component: Select,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

// Supervisor options
const supervisorOptions = [
    { value: 'supervisor-a', label: 'Supervisor A' },
    { value: 'supervisor-b', label: 'Supervisor B' },
    { value: 'supervisor-c', label: 'Supervisor C' },
    { value: 'supervisor-d', label: 'Supervisor D' },
    { value: 'supervisor-e', label: 'Supervisor E' },
];

/**
 * Overview - All States
 * Shows all visual states of the Supervisor Selection Dropdown
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
                        Which supervisor did you speak with?
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Select
                    options={supervisorOptions}
                    placeholder="Select a supervisor"
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
                        Which supervisor did you speak with?
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Select
                    options={supervisorOptions}
                    placeholder="Select a supervisor"
                    mode="single"
                    defaultValue="supervisor-a"
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
    const [selectedSupervisor, setSelectedSupervisor] = useState('');

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Select the supervisor you spoke with from the dropdown.
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
                        Which supervisor did you speak with?
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Select
                    options={supervisorOptions}
                    placeholder="Select a supervisor"
                    mode="single"
                    value={selectedSupervisor}
                    onChange={(val) => setSelectedSupervisor(val)}
                    required
                />
            </div>
            {selectedSupervisor && (
                <p className="body2-txt mt-4" style={{ color: 'var(--color-secondary-text)' }}>
                    Selected: {supervisorOptions.find(o => o.value === selectedSupervisor)?.label}
                </p>
            )}
        </div>
    );
};
