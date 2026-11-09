import React, { useState } from 'react';
import StatusTag from '@/components/labels/StatusTag';
import Button from '@/components/forms-and-inputs/Button/Button';
import { ButtonGroup } from '@/components';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Badges/Engagement Badges',
    component: StatusTag,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Engagement status badges used to indicate student engagement levels: "Fully engaged", "Partially engaged", "Not engaged at all", "N/A", or "Select".'
            }
        }
    },
    argTypes: {
        children: { control: 'text' },
        appearance: {
            control: 'select',
            options: ['success', 'warning', 'danger', 'neutral'],
            description: 'Green for Fully engaged, Yellow for Partially engaged, Red for Not engaged at all, Gray for N/A and Select.'
        },
    },
};


/**
 * Fully Engaged Badge
 * Green background with success state
 */
export const FullyEngaged = {
    args: {
        children: 'Fully engaged',
        appearance: 'success',
    },
};

export const FullyEngagedStatic = {
    args: {
        children: 'Fully engaged',
        appearance: 'success',
    },
};

/**
 * Partially Engaged Badge
 * Yellow background with warning state
 */
export const PartiallyEngaged = {
    args: {
        children: 'Partially engaged',
        appearance: 'warning',
    },
};

export const PartiallyEngagedStatic = {
    args: {
        children: 'Partially engaged',
        appearance: 'warning',
    },
};

/**
 * Not Engaged At All Badge
 * Red background with danger state
 */
export const NotEngagedAtAll = {
    args: {
        children: 'Not engaged at all',
        appearance: 'danger',
    },
};

export const NotEngagedAtAllStatic = {
    args: {
        children: 'Not engaged at all',
        appearance: 'danger',
    },
};

/**
 * N/A Badge
 * Gray background with secondary state
 */
export const NA = {
    args: {
        children: 'N/A',
        appearance: 'neutral',
    },
};

export const NAStatic = {
    args: {
        children: 'N/A',
        appearance: 'neutral',
    },
};

/**
 * Select Badge
 * Gray background with secondary state and dropdown
 */
export const Select = {
    args: {
        children: 'Select',
        appearance: 'neutral',
    },
};

export const SelectStatic = {
    args: {
        children: 'Select',
        appearance: 'neutral',
    },
};

/**
 * All Variations
 * Shows all engagement badge states
 */
export const AllVariations = () => (
    <div
        className="d-flex flex-column gap-4"
        style={{
            padding: 'var(--size-section-gap-lg)',
            backgroundColor: 'var(--ds-background-neutral)',
            minHeight: '100vh'
        }}
    >
        <div>
            <h5 className="text-muted mb-2">Engagement Badges</h5>
            <p className="text-muted small mb-0">All supported engagement states. Size: b3 (12px).</p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-section-gap-lg)' }}>
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Fully Engaged</h6>
                <div className="d-flex flex-column gap-2">
                    <StatusTag appearance="success" className="fw-normal">Fully engaged</StatusTag>
                    <StatusTag appearance="success" className="fw-normal">Fully engaged</StatusTag>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Partially Engaged</h6>
                <div className="d-flex flex-column gap-2">
                    <StatusTag appearance="warning" className="fw-normal">Partially engaged</StatusTag>
                    <StatusTag appearance="warning" className="fw-normal">Partially engaged</StatusTag>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Not Engaged At All</h6>
                <div className="d-flex flex-column gap-2">
                    <StatusTag appearance="danger" className="fw-normal">Not engaged at all</StatusTag>
                    <StatusTag appearance="danger" className="fw-normal">Not engaged at all</StatusTag>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>N/A</h6>
                <div className="d-flex flex-column gap-2">
                    <StatusTag appearance="neutral" className="fw-normal">N/A</StatusTag>
                    <StatusTag appearance="neutral" className="fw-normal">N/A</StatusTag>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Select</h6>
                <div className="d-flex flex-column gap-2">
                    <StatusTag appearance="neutral" className="fw-normal">Select</StatusTag>
                    <StatusTag appearance="neutral" className="fw-normal">Select</StatusTag>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Interactive Template
 * For testing individual badge states with controls
 */
export const Interactive = () => {
    const [text, setText] = useState('Fully engaged');
    const [style, setStyle] = useState('success');
    const [showDropdown, setShowDropdown] = useState(true);

    const engagementOptions = [
        { label: 'Fully engaged', value: 'Fully engaged', style: 'success' },
        { label: 'Partially engaged', value: 'Partially engaged', style: 'warning' },
        { label: 'Not engaged at all', value: 'Not engaged at all', style: 'danger' },
        { label: 'N/A', value: 'N/A', style: 'neutral' },
        { label: 'Select', value: 'Select', style: 'neutral' }
    ];

    return (
        <div
            className="d-flex flex-column gap-4"
            style={{
                padding: 'var(--size-section-gap-lg)',
                backgroundColor: 'var(--ds-background-neutral)',
                minHeight: '100vh'
            }}
        >
            <div>
                <h5 className="text-muted mb-2">Interactive Engagement Badges</h5>
                <p className="text-muted small mb-0">Test different engagement states and configurations.</p>
            </div>

            {/* Controls */}
            <div
                className="d-flex flex-wrap gap-3 p-3"
                style={{
                    backgroundColor: 'var(--ds-surface-container)',
                    borderRadius: 'var(--size-card-radius-sm)'
                }}
            >
                <div className="d-flex flex-column gap-2">
                    <label htmlFor="engagement-state-select" className="small text-muted fw-bold">Engagement State:</label>
                    <select
                        id="engagement-state-select"
                        className="form-select form-select-sm"
                        value={text}
                        onChange={(e) => {
                            const selected = engagementOptions.find(opt => opt.value === e.target.value);
                            setText(selected.value);
                            setStyle(selected.style);
                        }}
                        style={{ width: '200px' }}
                    >
                        {engagementOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="d-flex flex-column gap-2">
                    <span className="small text-muted fw-bold">Show Dropdown:</span>
                    <ButtonGroup label="Show dropdown toggle">
                        <Button
                            text="Yes"
                            spacing="compact"
                            isSelected={showDropdown}
                            onClick={() => setShowDropdown(true)}
                        />
                        <Button
                            text="No"
                            spacing="compact"
                            isSelected={!showDropdown}
                            onClick={() => setShowDropdown(false)}
                        />
                    </ButtonGroup>
                </div>
            </div>

            {/* Badge Preview */}
            <div
                className="d-flex justify-content-center align-items-center p-4"
                style={{
                    backgroundColor: 'var(--ds-surface-container)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    minHeight: '120px'
                }}
            >
                <StatusTag appearance={style} className="fw-normal">{text}</StatusTag>
            </div>

            {/* All States Reference */}
            <div>
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>All States Reference</h6>
                <div className="d-flex flex-wrap gap-3 mt-2">
                    {engagementOptions.map(option => (
                        <div key={option.value} className="d-flex flex-column gap-1 align-items-center">
                            <StatusTag appearance={option.style} className="fw-normal">{option.value}</StatusTag>
                            <span className="small text-muted">{option.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
