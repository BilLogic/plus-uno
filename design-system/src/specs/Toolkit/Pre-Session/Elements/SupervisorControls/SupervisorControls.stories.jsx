import React, { useState } from 'react';
import { DropdownMenu, ButtonItem } from '@/components';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Supervisor Controls',
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

const gearTrigger = (
    <button type="button" className="plus-btn plus-btn--default" aria-label="Session actions" style={{ border: 'none', background: 'none' }}>
        <i className="fa-solid fa-gear" style={{ fontSize: 'var(--font-size-fa-h6-solid)', color: 'var(--ds-icon-subtle)' }} />
    </button>
);

/**
 * Supervisor Controls Menu Rows
 * Reusable rows for the supervisor actions menu. Cancel session is danger.
 */
const supervisorMenuRows = ({ onJoin, onEdit, onRecruit, onCancel } = {}) => [
    <ButtonItem key="join" onClick={onJoin} elemBefore={<i className="fa-solid fa-right-to-bracket" aria-hidden="true" />}>
        Join session
    </ButtonItem>,
    <ButtonItem key="edit" onClick={onEdit} elemBefore={<i className="fa-solid fa-pen-to-square" aria-hidden="true" />}>
        Edit session
    </ButtonItem>,
    <ButtonItem key="recruit" onClick={onRecruit} elemBefore={<i className="fa-solid fa-users" aria-hidden="true" />}>
        Recruit tutors
    </ButtonItem>,
    <ButtonItem
        key="cancel"
        onClick={onCancel}
        elemBefore={<i className="fa-solid fa-trash" aria-hidden="true" style={{ color: 'var(--color-danger)' }} />}
    >
        <span style={{ color: 'var(--color-danger)' }}>Cancel session</span>
    </ButtonItem>,
];

/**
 * Supervisor Controls Component
 * A gear icon button that opens a menu with supervisor actions.
 */
const SupervisorControlsComponent = ({ isOpen = false, onToggle }) => {
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <DropdownMenu trigger={gearTrigger} isOpen={isOpen} onOpenChange={onToggle}>
                {supervisorMenuRows({
                    onJoin: () => console.log('Join session clicked'),
                    onEdit: () => console.log('Edit session clicked'),
                    onRecruit: () => console.log('Recruit tutors clicked'),
                    onCancel: () => console.log('Cancel session clicked'),
                })}
            </DropdownMenu>
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
                return 'var(--ds-background-neutral-subtle-hovered)';
            case 'pressed':
                return 'var(--ds-background-neutral-subtle-pressed)';
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
                padding: 'var(--pad-y-md) var(--pad-x-md)',
                borderRadius: 'var(--radius-md)',
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
            <p className="body2-txt font-weight-light" style={{ color: 'var(--ds-icon-subtle)', marginBottom: 'var(--size-card-gap-md)' }}>
                The gear icon button in default, hover, and pressed states. Uses primary color for the icon.
            </p>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--size-section-gap-md)',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--ds-surface-container)',
                borderRadius: 'var(--size-card-radius-md)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <GearIconButton state="default" />
                    <p className="body3-txt" style={{ color: 'var(--ds-text-subtle)', marginTop: 'var(--stack-md)' }}>Default</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <GearIconButton state="hover" />
                    <p className="body3-txt" style={{ color: 'var(--ds-text-subtle)', marginTop: 'var(--stack-md)' }}>Hover</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <GearIconButton state="pressed" />
                    <p className="body3-txt" style={{ color: 'var(--ds-text-subtle)', marginTop: 'var(--stack-md)' }}>Pressed</p>
                </div>
            </div>
        </section>

        {/* Open State */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Open State (Dropdown Visible)</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--ds-text-subtle)', marginBottom: 'var(--size-card-gap-md)' }}>
                Dropdown menu with supervisor action options. Cancel session uses danger color.
            </p>
            <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'center',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--ds-surface-container)',
                borderRadius: 'var(--size-card-radius-md)',
                minHeight: 'var(--size-modal-min-height-sm)'
            }}>
                <DropdownMenu trigger={gearTrigger} isOpen>
                    {supervisorMenuRows()}
                </DropdownMenu>
            </div>
        </section>

        {/* Dropdown Menu Items */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Dropdown Menu Items</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--ds-text-subtle)', marginBottom: 'var(--size-card-gap-md)' }}>
                Individual menu items with their respective icons. Cancel session uses danger color.
            </p>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'var(--ds-surface-overlay)',
                borderRadius: 'var(--size-modal-radius-sm)',
                maxWidth: 'var(--size-modal-width-sm)',
                boxShadow: 'var(--elevation-light-2)'
            }}>
                {/* Join session */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-0625)',
                    padding: 'var(--pad-y-md) var(--pad-x-md)',
                    cursor: 'pointer'
                }}>
                    <i className="fa-solid fa-right-to-bracket" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--ds-icon-subtle)' }} />
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--ds-icon)', flex: 1 }}>Join session</span>
                </div>
                
                {/* Edit session */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-0625)',
                    padding: 'var(--pad-y-md) var(--pad-x-md)',
                    cursor: 'pointer'
                }}>
                    <i className="fa-solid fa-pen-to-square" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--ds-icon-subtle)' }} />
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--ds-icon)', flex: 1 }}>Edit session</span>
                </div>
                
                {/* Recruit tutors */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-0625)',
                    padding: 'var(--pad-y-md) var(--pad-x-md)',
                    cursor: 'pointer'
                }}>
                    <i className="fa-solid fa-users" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--ds-icon-subtle)' }} />
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--ds-icon)', flex: 1 }}>Recruit tutors</span>
                </div>
                
                {/* Cancel session - Danger style */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-0625)',
                    padding: 'var(--pad-y-md) var(--pad-x-md)',
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
                <p className="body2-txt font-weight-light" style={{ color: 'var(--ds-text-subtle)', marginBottom: 'var(--size-card-gap-md)' }}>
                    Click the gear icon to open the dropdown menu. Click outside or select an option to close.
                </p>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'center',
                    padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                    backgroundColor: 'var(--ds-surface-container)',
                    borderRadius: 'var(--size-card-radius-md)',
                    minHeight: 'var(--size-modal-min-height-md)'
                }}>
                    <DropdownMenu trigger={gearTrigger} isOpen={isOpen} onOpenChange={setIsOpen}>
                        {supervisorMenuRows({
                            onJoin: () => handleItemClick('Join session'),
                            onEdit: () => handleItemClick('Edit session'),
                            onRecruit: () => handleItemClick('Recruit tutors'),
                            onCancel: () => handleItemClick('Cancel session'),
                        })}
                    </DropdownMenu>
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
    <DropdownMenu trigger={gearTrigger} {...props}>
        {supervisorMenuRows({
            onJoin: onJoinSession,
            onEdit: onEditSession,
            onRecruit: onRecruitTutors,
            onCancel: onCancelSession,
        })}
    </DropdownMenu>
);
