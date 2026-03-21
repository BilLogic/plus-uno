import React, { useState } from 'react';
import Button from '../../../../../components/Button/Button';
import Dropdown from '../../../../../components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/SupervisorControls',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Supervisor Controls Dropdown Items
 * Reusable configuration for the dropdown menu
 */
const supervisorControlItems = [
    {
        text: 'Join session',
        leadingIcon: 'right-to-bracket',
        onClick: () => console.log('Join session clicked')
    },
    {
        text: 'Edit session',
        leadingIcon: 'pen-to-square',
        onClick: () => console.log('Edit session clicked')
    },
    {
        text: 'Recruit tutors',
        leadingIcon: 'users',
        onClick: () => console.log('Recruit tutors clicked')
    },
    {
        text: 'Cancel session',
        leadingIcon: 'trash',
        onClick: () => console.log('Cancel session clicked')
    }
];

/**
 * Supervisor Controls Component
 * A gear icon button that opens a dropdown with supervisor actions
 * Uses design system Dropdown component with:
 * - style="default" for neutral styling
 * - fill="ghost" for transparent background
 * - Custom dropdown items with icons
 */
const SupervisorControlsComponent = ({ isOpen = false, onToggle }) => {
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <Dropdown
                buttonText={<i className="fa-solid fa-gear" style={{ fontSize: 'var(--font-size-fa-h6-solid)', color: 'var(--color-on-surface-variant)' }} />}
                items={supervisorControlItems.map((item, index) => ({
                    ...item,
                    // Apply danger style to Cancel session
                    className: index === 3 ? 'text-danger' : ''
                }))}
                style="default"
                fill="ghost"
                isOpen={isOpen}
            />
        </div>
    );
};

/**
 * Gear Icon Button Component
 * Reusable gear icon button with state support
 */
const GearIconButton = ({ state = 'default' }) => {
    const getBackgroundColor = () => {
        switch (state) {
            case 'hover':
                return 'var(--color-primary-state-08)';
            case 'pressed':
                return 'var(--color-primary-state-12)';
            default:
                return 'transparent';
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'var(--size-button-min-width-md)',
                minHeight: 'var(--size-button-min-height-md)',
                padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                borderRadius: 'var(--size-element-radius-md)',
                backgroundColor: getBackgroundColor(),
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
            }}
        >
            <i
                className="fa-solid fa-gear"
                style={{
                    fontSize: 'var(--font-size-fa-h6-solid)',
                    color: 'var(--color-primary)'
                }}
            />
        </div>
    );
};

/**
 * Overview
 * Shows all states of the Supervisor Controls component
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        {/* Gear Icon Button States */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Gear Icon Button States</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                The gear icon button in default, hover, and pressed states. Uses primary color for the icon.
            </p>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--size-section-gap-md)',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-md)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <GearIconButton state="default" />
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--size-element-gap-sm)' }}>Default</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <GearIconButton state="hover" />
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--size-element-gap-sm)' }}>Hover</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <GearIconButton state="pressed" />
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--size-element-gap-sm)' }}>Pressed</p>
                </div>
            </div>
        </section>

        {/* Open State */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Open State (Dropdown Visible)</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                Dropdown menu with supervisor action options. Cancel session uses danger color.
            </p>
            <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'center',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-md)',
                minHeight: 'var(--size-modal-min-height-sm)'
            }}>
                <Dropdown
                    buttonText={<i className="fa-solid fa-gear" style={{ fontSize: 'var(--font-size-fa-h6-solid)', color: 'var(--color-primary)' }} />}
                    items={[
                        {
                            text: 'Join session',
                            leadingIcon: 'right-to-bracket'
                        },
                        {
                            text: 'Edit session',
                            leadingIcon: 'pen-to-square'
                        },
                        {
                            text: 'Recruit tutors',
                            leadingIcon: 'users'
                        },
                        {
                            text: 'Cancel session',
                            leadingIcon: 'trash'
                        }
                    ]}
                    style="primary"
                    fill="ghost"
                    isOpen={true}
                />
            </div>
        </section>

        {/* Dropdown Menu Items */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Dropdown Menu Items</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                Individual menu items with their respective icons. Cancel session uses danger color.
            </p>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'var(--color-surface-container-high)',
                borderRadius: 'var(--size-modal-radius-sm)',
                maxWidth: 'var(--size-modal-width-sm)',
                boxShadow: 'var(--elevation-2)'
            }}>
                {/* Join session */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-md)',
                    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                    cursor: 'pointer'
                }}>
                    <i className="fa-solid fa-right-to-bracket" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--color-on-surface-variant)' }} />
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)', flex: 1 }}>Join session</span>
                </div>
                
                {/* Edit session */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-md)',
                    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                    cursor: 'pointer'
                }}>
                    <i className="fa-solid fa-pen-to-square" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--color-on-surface-variant)' }} />
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)', flex: 1 }}>Edit session</span>
                </div>
                
                {/* Recruit tutors */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-md)',
                    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                    cursor: 'pointer'
                }}>
                    <i className="fa-solid fa-users" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--color-on-surface-variant)' }} />
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)', flex: 1 }}>Recruit tutors</span>
                </div>
                
                {/* Cancel session - Danger style */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-md)',
                    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                    cursor: 'pointer'
                }}>
                    <i className="fa-solid fa-trash" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--color-danger)' }} />
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--color-danger)', flex: 1 }}>Cancel session</span>
                </div>
            </div>
        </section>
    </div>
);

/**
 * Interactive
 * Fully interactive Supervisor Controls component
 */
export const Interactive = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleItemClick = (action) => {
        console.log(`${action} clicked`);
        setIsOpen(false);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-lg)'
            }}
        >
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Interactive Demo</h6>
                <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                    Click the gear icon to open the dropdown menu. Click outside or select an option to close.
                </p>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'center',
                    padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: 'var(--size-card-radius-md)',
                    minHeight: 'var(--size-modal-min-height-md)'
                }}>
                    <Dropdown
                        buttonText={<i className="fa-solid fa-gear" style={{ fontSize: 'var(--font-size-fa-h6-solid)', color: 'var(--color-primary)' }} />}
                        items={[
                            {
                                text: 'Join session',
                                leadingIcon: 'right-to-bracket',
                                onClick: () => handleItemClick('Join session')
                            },
                            {
                                text: 'Edit session',
                                leadingIcon: 'pen-to-square',
                                onClick: () => handleItemClick('Edit session')
                            },
                            {
                                text: 'Recruit tutors',
                                leadingIcon: 'users',
                                onClick: () => handleItemClick('Recruit tutors')
                            },
                            {
                                text: 'Cancel session',
                                leadingIcon: 'trash',
                                onClick: () => handleItemClick('Cancel session')
                            }
                        ]}
                        style="primary"
                        fill="ghost"
                    />
                </div>
            </section>
        </div>
    );
};

/**
 * Exportable Supervisor Controls Component
 * For use in pages and other compositions
 */
export const SupervisorControlsDropdown = ({ onJoinSession, onEditSession, onRecruitTutors, onCancelSession, ...props }) => (
    <Dropdown
        buttonText={<i className="fa-solid fa-gear" style={{ fontSize: 'var(--font-size-fa-h6-solid)', color: 'var(--color-primary)' }} />}
        items={[
            {
                text: 'Join session',
                leadingIcon: 'right-to-bracket',
                onClick: onJoinSession
            },
            {
                text: 'Edit session',
                leadingIcon: 'pen-to-square',
                onClick: onEditSession
            },
            {
                text: 'Recruit tutors',
                leadingIcon: 'users',
                onClick: onRecruitTutors
            },
            {
                text: 'Cancel session',
                leadingIcon: 'trash',
                onClick: onCancelSession
            }
        ]}
        style="primary"
        fill="ghost"
        {...props}
    />
);
