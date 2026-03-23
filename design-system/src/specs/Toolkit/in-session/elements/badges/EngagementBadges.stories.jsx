import React, { useState } from 'react';
import Badge from '../../../../../components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Badges/Engagement Badges',
    component: Badge,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Engagement status badges used to indicate student engagement levels: "Fully engaged", "Partially engaged", "Not engaged at all", "N/A", or "Select".'
            }
        }
    },
    argTypes: {
        text: { control: 'text' },
        style: {
            control: 'select',
            options: ['success', 'warning', 'danger', 'secondary'],
            description: 'Green for Fully engaged, Yellow for Partially engaged, Red for Not engaged at all, Grey for N/A and Select.'
        },
        size: {
            control: 'select',
            options: ['b3'],
            description: 'Engagement badges use "b3" (12px) size.'
        },
        trailingVisual: { control: 'boolean', description: 'Show dropdown caret icon' }
    },
};

const caretIcon = <i className="fa-solid fa-caret-down"></i>;

/**
 * Fully Engaged Badge
 * Green background with success state
 */
export const FullyEngaged = {
    args: {
        text: 'Fully engaged',
        style: 'success',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const FullyEngagedStatic = {
    args: {
        text: 'Fully engaged',
        style: 'success',
        size: 'b3',
        className: 'fw-normal',
    },
};

/**
 * Partially Engaged Badge
 * Yellow background with warning state
 */
export const PartiallyEngaged = {
    args: {
        text: 'Partially engaged',
        style: 'warning',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const PartiallyEngagedStatic = {
    args: {
        text: 'Partially engaged',
        style: 'warning',
        size: 'b3',
        className: 'fw-normal',
    },
};

/**
 * Not Engaged At All Badge
 * Red background with danger state
 */
export const NotEngagedAtAll = {
    args: {
        text: 'Not engaged at all',
        style: 'danger',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const NotEngagedAtAllStatic = {
    args: {
        text: 'Not engaged at all',
        style: 'danger',
        size: 'b3',
        className: 'fw-normal',
    },
};

/**
 * N/A Badge
 * Grey background with secondary state
 */
export const NA = {
    args: {
        text: 'N/A',
        style: 'secondary',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const NAStatic = {
    args: {
        text: 'N/A',
        style: 'secondary',
        size: 'b3',
        className: 'fw-normal',
    },
};

/**
 * Select Badge
 * Grey background with secondary state and dropdown
 */
export const Select = {
    args: {
        text: 'Select',
        style: 'secondary',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const SelectStatic = {
    args: {
        text: 'Select',
        style: 'secondary',
        size: 'b3',
        className: 'fw-normal',
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
            backgroundColor: 'var(--color-surface-variant)',
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
                    <Badge text="Fully engaged" style="success" size="b3" trailingVisual={caretIcon} className="fw-normal" />
                    <Badge text="Fully engaged" style="success" size="b3" className="fw-normal" />
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Partially Engaged</h6>
                <div className="d-flex flex-column gap-2">
                    <Badge text="Partially engaged" style="warning" size="b3" trailingVisual={caretIcon} className="fw-normal" />
                    <Badge text="Partially engaged" style="warning" size="b3" className="fw-normal" />
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Not Engaged At All</h6>
                <div className="d-flex flex-column gap-2">
                    <Badge text="Not engaged at all" style="danger" size="b3" trailingVisual={caretIcon} className="fw-normal" />
                    <Badge text="Not engaged at all" style="danger" size="b3" className="fw-normal" />
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>N/A</h6>
                <div className="d-flex flex-column gap-2">
                    <Badge text="N/A" style="secondary" size="b3" trailingVisual={caretIcon} className="fw-normal" />
                    <Badge text="N/A" style="secondary" size="b3" className="fw-normal" />
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Select</h6>
                <div className="d-flex flex-column gap-2">
                    <Badge text="Select" style="secondary" size="b3" trailingVisual={caretIcon} className="fw-normal" />
                    <Badge text="Select" style="secondary" size="b3" className="fw-normal" />
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
        { label: 'N/A', value: 'N/A', style: 'secondary' },
        { label: 'Select', value: 'Select', style: 'secondary' }
    ];

    return (
        <div
            className="d-flex flex-column gap-4"
            style={{
                padding: 'var(--size-section-gap-lg)',
                backgroundColor: 'var(--color-surface-variant)',
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
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: 'var(--size-card-radius-sm)'
                }}
            >
                <div className="d-flex flex-column gap-2">
                    <label className="small text-muted fw-bold">Engagement State:</label>
                    <select
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
                    <label className="small text-muted fw-bold">Show Dropdown:</label>
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn btn-sm ${showDropdown ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowDropdown(true)}
                        >
                            Yes
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${!showDropdown ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowDropdown(false)}
                        >
                            No
                        </button>
                    </div>
                </div>
            </div>

            {/* Badge Preview */}
            <div
                className="d-flex justify-content-center align-items-center p-4"
                style={{
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    minHeight: '120px'
                }}
            >
                <Badge
                    text={text}
                    style={style}
                    size="b3"
                    trailingVisual={showDropdown ? caretIcon : null}
                    className="fw-normal"
                />
            </div>

            {/* All States Reference */}
            <div>
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>All States Reference</h6>
                <div className="d-flex flex-wrap gap-3 mt-2">
                    {engagementOptions.map(option => (
                        <div key={option.value} className="d-flex flex-column gap-1 align-items-center">
                            <Badge
                                text={option.value}
                                style={option.style}
                                size="b3"
                                trailingVisual={caretIcon}
                                className="fw-normal"
                            />
                            <span className="small text-muted">{option.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
