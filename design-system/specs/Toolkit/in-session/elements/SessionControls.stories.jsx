import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Session Controls',
    component: Button,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Session control buttons for managing in-session activities. Different button styles for different user roles and actions: Copy Assignments (outlined), Manage Session (filled), View Session Info (outlined).'
            }
        }
    },
    argTypes: {
        action: {
            control: 'select',
            options: ['copy assignments', 'manage session', 'view session info'],
            description: 'Type of action the button performs'
        },
        copied: {
            control: 'boolean',
            description: 'Whether the copy action has been completed (shows success state)'
        },
        user: {
            control: 'select',
            options: ['regular tutors', 'lead & supervisors'],
            description: 'User role that determines button visibility and styling'
        }
    }
};

/**
 * Session Controls Component
 * Renders different button styles based on action and user role
 * 
 * Button configurations:
 * - Copy Assignments (Lead & Supervisors): Outlined primary button, shows success state when copied
 * - Manage Session (Lead & Supervisors): Filled primary button
 * - View Session Info (Regular Tutors): Outlined primary button
 */
export const SessionControls = ({ 
    action = 'copy assignments', 
    copied = false, 
    user = 'lead & supervisors',
    onClick 
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick(action, copied);
        }
    };

    // Copy Assignments button for Lead & Supervisors
    if (action === 'copy assignments' && user === 'lead & supervisors') {
        if (copied) {
            // Success state - tonal button with success background
            return (
                <Button
                    text="Copy assignments"
                    style="success"
                    fill="tonal"
                    size="small"
                    leadingVisual="check"
                    onClick={handleClick}
                />
            );
        } else {
            // Default state - outlined button
            return (
                <Button
                    text="Copy assignments"
                    style="primary"
                    fill="outline"
                    size="small"
                    leadingVisual="copy"
                    onClick={handleClick}
                />
            );
        }
    }

    // Manage Session button for Lead & Supervisors - filled button
    if (action === 'manage session' && user === 'lead & supervisors') {
        return (
            <Button
                text="Manage session"
                style="primary"
                fill="filled"
                size="small"
                leadingVisual="gear"
                onClick={handleClick}
            />
        );
    }

    // View Session Info button for Regular Tutors - outlined button
    if (action === 'view session info' && user === 'regular tutors') {
        return (
            <Button
                text="View session info"
                style="primary"
                fill="outline"
                size="small"
                leadingVisual="info-circle"
                onClick={handleClick}
            />
        );
    }

    return null;
};

/**
 * Copy Assignments - Default State
 * Outlined button for Lead & Supervisors
 */
export const CopyAssignmentsDefault = () => {
    const [copied, setCopied] = useState(false);
    
    const handleClick = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    return (
        <SessionControls 
            action="copy assignments" 
            copied={copied}
            user="lead & supervisors"
            onClick={handleClick}
        />
    );
};

/**
 * Copy Assignments - Copied State
 * Success tonal button showing completed action
 */
export const CopyAssignmentsCopied = () => (
    <SessionControls 
        action="copy assignments" 
        copied={true}
        user="lead & supervisors"
    />
);

/**
 * Manage Session
 * Filled button for Lead & Supervisors
 */
export const ManageSession = () => (
    <SessionControls 
        action="manage session" 
        user="lead & supervisors"
    />
);

/**
 * View Session Info
 * Outlined button for Regular Tutors
 */
export const ViewSessionInfo = () => (
    <SessionControls 
        action="view session info" 
        user="regular tutors"
    />
);

/**
 * All Variations
 * Shows all session control button variations
 */
export const AllVariations = () => (
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
            <h5 className="text-muted mb-2">Session Controls</h5>
            <p className="text-muted small mb-0">Different button styles for different user roles and actions.</p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-section-gap-lg)' }}>
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Lead & Supervisors</h6>
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Copy Assignments (Default)</span>
                        <SessionControls action="copy assignments" user="lead & supervisors" />
                    </div>
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Copy Assignments (Copied)</span>
                        <SessionControls action="copy assignments" copied={true} user="lead & supervisors" />
                    </div>
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Manage Session</span>
                        <SessionControls action="manage session" user="lead & supervisors" />
                    </div>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Regular Tutors</h6>
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">View Session Info</span>
                        <SessionControls action="view session info" user="regular tutors" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Interactive
 * Fully interactive session controls with state management
 */
export const Interactive = () => {
    const [copied, setCopied] = useState(false);
    const [lastAction, setLastAction] = useState(null);

    const handleClick = (action, currentCopied) => {
        setLastAction(action);
        
        if (action === 'copy assignments' && !currentCopied) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        }
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
                <h5 className="text-muted mb-2">Interactive Session Controls</h5>
                <p className="text-muted small mb-0">Click on buttons to see their interactive behavior.</p>
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
                    <span className="small text-muted fw-bold">Last Action:</span>
                    <span className="body2-txt">{lastAction || 'None'}</span>
                </div>
                <div className="d-flex flex-column gap-1">
                    <span className="small text-muted fw-bold">Copy Status:</span>
                    <span className="body2-txt">{copied ? 'Copied!' : 'Not copied'}</span>
                </div>
            </div>

            {/* Button Groups */}
            <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-section-gap-lg)' }}>
                <div className="d-flex flex-column gap-3">
                    <span className="small text-muted fw-bold">Lead & Supervisors Controls</span>
                    <div className="d-flex flex-column gap-2">
                        <SessionControls 
                            action="copy assignments" 
                            copied={copied}
                            user="lead & supervisors"
                            onClick={handleClick}
                        />
                        <SessionControls 
                            action="manage session" 
                            user="lead & supervisors"
                            onClick={handleClick}
                        />
                    </div>
                </div>

                <div className="d-flex flex-column gap-3">
                    <span className="small text-muted fw-bold">Regular Tutors Controls</span>
                    <div className="d-flex flex-column gap-2">
                        <SessionControls 
                            action="view session info" 
                            user="regular tutors"
                            onClick={handleClick}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
