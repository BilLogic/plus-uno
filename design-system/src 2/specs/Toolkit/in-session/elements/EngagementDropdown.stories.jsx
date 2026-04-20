import React, { useState } from 'react';
import { EngagementDropdown } from './EngagementDropdown.jsx';
import { EngagementBadge } from './EngagementBadge.jsx';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Engagement Dropdown',
    component: EngagementDropdown,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Interactive Engagement Dropdown composed of the Toolkit "Engagement Badge" and "Engagement List Items". Used to select student engagement status during in-session activities.'
            }
        }
    },
    argTypes: {
        initialStatus: {
            control: 'select',
            options: ['unknown', 'fully-engaged', 'partially-engaged', 'not-engaged', 'na'],
            description: 'Initial engagement status'
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the dropdown'
        }
    }
};

/**
 * Default / Unfilled State
 * Shows "Select" badge with dropdown caret
 */
export const Unfilled = () => {
    return (
        <EngagementDropdown initialStatus="unknown" />
    );
};

/**
 * Filled State - Fully Engaged
 * Shows green "Fully engaged" badge
 */
export const FilledFullyEngaged = () => {
    return (
        <EngagementDropdown initialStatus="fully-engaged" />
    );
};

/**
 * Filled State - Partially Engaged
 * Shows yellow "Partially engaged" badge
 */
export const FilledPartiallyEngaged = () => {
    return (
        <EngagementDropdown initialStatus="partially-engaged" />
    );
};

/**
 * Filled State - Not Engaged
 * Shows red "Not engaged at all" badge
 */
export const FilledNotEngaged = () => {
    return (
        <EngagementDropdown initialStatus="not-engaged" />
    );
};

/**
 * Disabled State
 * Shows badge at 38% opacity, dropdown is not interactive
 */
export const Disabled = () => {
    return (
        <EngagementDropdown initialStatus="unknown" disabled={true} />
    );
};

/**
 * All States Overview
 * Shows all engagement dropdown states side by side
 */
export const AllStates = () => (
    <div 
        className="d-flex flex-column" 
        style={{ 
            padding: 'var(--size-section-gap-lg)', 
            gap: 'var(--size-section-gap-lg)', 
            backgroundColor: 'var(--color-surface-variant)', 
            minHeight: '100vh' 
        }}
    >
        <div>
            <h5 className="text-muted mb-2">Engagement Dropdown States</h5>
            <p className="text-muted small mb-0">All supported engagement dropdown states. Click on any badge to open the dropdown.</p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-section-gap-lg)' }}>
            <div className="d-flex flex-column gap-2">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Unfilled</h6>
                <EngagementDropdown initialStatus="unknown" />
            </div>

            <div className="d-flex flex-column gap-2">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Fully Engaged</h6>
                <EngagementDropdown initialStatus="fully-engaged" />
            </div>

            <div className="d-flex flex-column gap-2">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Partially Engaged</h6>
                <EngagementDropdown initialStatus="partially-engaged" />
            </div>

            <div className="d-flex flex-column gap-2">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Not Engaged</h6>
                <EngagementDropdown initialStatus="not-engaged" />
            </div>

            <div className="d-flex flex-column gap-2">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Disabled</h6>
                <EngagementDropdown initialStatus="unknown" disabled={true} />
            </div>
        </div>

        <div>
            <h6 className="text-muted mb-2">Badge States (Static Reference)</h6>
            <div className="d-flex flex-wrap align-items-center" style={{ gap: 'var(--size-element-gap-lg)' }}>
                <EngagementBadge status="unknown" showDropdown={true} />
                <EngagementBadge status="fully-engaged" showDropdown={true} />
                <EngagementBadge status="partially-engaged" showDropdown={true} />
                <EngagementBadge status="not-engaged" showDropdown={true} />
                <EngagementBadge status="unknown" showDropdown={true} disabled={true} />
            </div>
        </div>
    </div>
);

/**
 * Interactive
 * Fully interactive engagement dropdown with state feedback
 */
export const Interactive = () => {
    const [lastSelection, setLastSelection] = useState({ status: null, reason: null });

    const handleStatusChange = (status, reason) => {
        setLastSelection({ status, reason });
    };

    return (
        <div 
            className="d-flex flex-column" 
            style={{ 
                padding: 'var(--size-section-gap-lg)', 
                gap: 'var(--size-section-gap-lg)', 
                backgroundColor: 'var(--color-surface-variant)', 
                minHeight: '100vh' 
            }}
        >
            <div>
                <h5 className="text-muted mb-2">Interactive Engagement Dropdown</h5>
                <p className="text-muted small mb-0">Click on the badge to open the dropdown and select an engagement status.</p>
            </div>

            {/* Status Display */}
            <div 
                className="d-flex flex-wrap gap-3 p-3" 
                style={{ 
                    backgroundColor: 'var(--color-surface-container-low)', 
                    borderRadius: 'var(--size-card-radius-sm)' 
                }}
            >
                <div className="d-flex flex-column gap-1">
                    <span className="small text-muted fw-bold">Last Selected Status:</span>
                    <span className="body2-txt">{lastSelection.status || 'None'}</span>
                </div>
                {lastSelection.reason && (
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted fw-bold">Reason:</span>
                        <span className="body2-txt">{lastSelection.reason}</span>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            <div className="d-flex flex-column gap-2">
                <span className="small text-muted fw-bold">Engagement Dropdown</span>
                <EngagementDropdown 
                    initialStatus="unknown" 
                    onStatusChange={handleStatusChange}
                />
            </div>
        </div>
    );
};
