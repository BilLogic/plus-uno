import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { EngagementDropdown } from './EngagementDropdown.jsx';
import { EngagementBadge } from './EngagementBadge.jsx';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Engagement Dropdown',
    component: EngagementDropdown,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Engagement picker: a small single Select for the student\'s engagement during a session. Partially engaged adds a Reason Select, and applies once a reason is picked. The field takes the color of the status picked.'
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
                <p className="text-muted small mb-0">Pick an engagement status. Partially engaged asks for a reason before it applies.</p>
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
                    <span className="body2-txt" data-testid="applied-status">{lastSelection.status || 'None'}</span>
                </div>
                {lastSelection.reason && (
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted fw-bold">Reason:</span>
                        <span className="body2-txt" data-testid="applied-reason">{lastSelection.reason}</span>
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

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const status = canvas.getByTestId('applied-status');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Engagement' }));
    await userEvent.click(await page.findByRole('option', { name: 'Partially engaged' }));
    await expect(status).toHaveTextContent('None');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Reason' }));
    await userEvent.click(await page.findByRole('option', { name: 'Left zoom early' }));
    await expect(status).toHaveTextContent('partially-engaged');
    await expect(canvas.getByTestId('applied-reason')).toHaveTextContent('left-early');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Engagement' }));
    await userEvent.click(await page.findByRole('option', { name: 'Fully engaged on zoom' }));
    await expect(status).toHaveTextContent('fully-engaged');
    await expect(canvas.queryByRole('combobox', { name: 'Reason' })).toBeNull();
};
