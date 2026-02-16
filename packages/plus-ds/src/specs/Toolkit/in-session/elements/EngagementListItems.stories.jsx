import React, { useState } from 'react';
import { EngagementListItems, EngagementSubmenuItems } from './EngagementListItems.jsx';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Engagement List Items',
    component: EngagementListItems,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'The menu list items used within the Engagement Badge dropdown. Includes main engagement options and a submenu for "Partially engaged" reasons.'
            }
        }
    },
    argTypes: {
        isOpen: { control: 'boolean', description: 'Force open state' },
        status: { 
            control: 'select', 
            options: ['unknown', 'fully-engaged', 'partially-engaged', 'not-engaged'],
            description: 'Current engagement status'
        }
    }
};

// Story Template wrapper to provide the Dropdown Menu container context
const Template = (args) => (
    <div className="pdropdown">
        <div 
            className="dropdown-menu show" 
            style={{ 
                position: 'static', 
                display: 'block', 
                width: '200px',
                backgroundColor: 'var(--color-surface-container-high)',
                borderRadius: 'var(--size-modal-radius-sm)',
                boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'
            }}
        >
            <EngagementListItems {...args} />
        </div>
    </div>
);

const SubmenuTemplate = (args) => (
    <div className="pdropdown">
        <div 
            className="dropdown-menu show" 
            style={{ 
                position: 'static', 
                display: 'block', 
                width: '220px',
                backgroundColor: 'var(--color-surface-container-high)',
                borderRadius: 'var(--size-modal-radius-sm)',
                boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'
            }}
        >
            <EngagementSubmenuItems {...args} />
        </div>
    </div>
);

/**
 * Unfilled State
 * No engagement status selected yet
 */
export const Unfilled = Template.bind({});
Unfilled.args = {
    status: 'unknown'
};

/**
 * Fully Engaged Selected
 * Shows checkmark next to "Fully engaged on zo..."
 */
export const FullyEngagedSelected = Template.bind({});
FullyEngagedSelected.args = {
    status: 'fully-engaged'
};

/**
 * Partially Engaged Selected
 * Shows checkmark next to "Partially engaged"
 */
export const PartiallyEngagedSelected = Template.bind({});
PartiallyEngagedSelected.args = {
    status: 'partially-engaged'
};

/**
 * Not Engaged Selected
 * Shows checkmark next to "Not engaged at all"
 */
export const NotEngagedSelected = Template.bind({});
NotEngagedSelected.args = {
    status: 'not-engaged'
};

/**
 * Partially Engaged Submenu
 * Shows the submenu options when "Partially engaged" is selected
 */
export const PartiallyEngagedSubmenu = SubmenuTemplate.bind({});
PartiallyEngagedSubmenu.args = {
    selectedReason: null
};

/**
 * Partially Engaged Submenu - With Selection
 * Shows the submenu with a reason selected
 */
export const PartiallyEngagedSubmenuWithSelection = SubmenuTemplate.bind({});
PartiallyEngagedSubmenuWithSelection.args = {
    selectedReason: 'joined-late'
};

/**
 * All Variations
 * Shows all engagement list item states side by side
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
            <h5 className="text-muted mb-2">Engagement List Items</h5>
            <p className="text-muted small mb-0">All supported engagement dropdown states.</p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-section-gap-lg)' }}>
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Unfilled</h6>
                <div className="pdropdown">
                    <div 
                        className="dropdown-menu show" 
                        style={{ 
                            position: 'static', 
                            display: 'block', 
                            width: '200px',
                            backgroundColor: 'var(--color-surface-container-high)',
                            borderRadius: 'var(--size-modal-radius-sm)',
                            boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'
                        }}
                    >
                        <EngagementListItems status="unknown" />
                    </div>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Partially Engaged (with submenu)</h6>
                <div className="pdropdown">
                    <div 
                        className="dropdown-menu show" 
                        style={{ 
                            position: 'static', 
                            display: 'block', 
                            width: '200px',
                            backgroundColor: 'var(--color-surface-container-high)',
                            borderRadius: 'var(--size-modal-radius-sm)',
                            boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'
                        }}
                    >
                        <EngagementListItems status="partially-engaged" />
                    </div>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Submenu Items</h6>
                <div className="pdropdown">
                    <div 
                        className="dropdown-menu show" 
                        style={{ 
                            position: 'static', 
                            display: 'block', 
                            width: '220px',
                            backgroundColor: 'var(--color-surface-container-high)',
                            borderRadius: 'var(--size-modal-radius-sm)',
                            boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'
                        }}
                    >
                        <EngagementSubmenuItems selectedReason="joined-late" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Interactive
 * Fully interactive engagement list with state management
 */
export const Interactive = () => {
    const [status, setStatus] = useState('unknown');
    const [selectedReason, setSelectedReason] = useState(null);
    const [showSubmenu, setShowSubmenu] = useState(false);

    const handleSelect = (newStatus, reason = null) => {
        setStatus(newStatus);
        if (newStatus === 'partially-engaged') {
            setShowSubmenu(true);
        } else {
            setShowSubmenu(false);
            setSelectedReason(null);
        }
    };

    const handleReasonSelect = (reason) => {
        setSelectedReason(reason);
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
                <h5 className="text-muted mb-2">Interactive Engagement List Items</h5>
                <p className="text-muted small mb-0">Click on items to change selection state.</p>
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
                    <span className="small text-muted fw-bold">Current Status:</span>
                    <span className="body2-txt">{status}</span>
                </div>
                {selectedReason && (
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted fw-bold">Selected Reason:</span>
                        <span className="body2-txt">{selectedReason}</span>
                    </div>
                )}
                <button 
                    className="btn btn-sm btn-outline-secondary ms-auto"
                    onClick={() => {
                        setStatus('unknown');
                        setSelectedReason(null);
                        setShowSubmenu(false);
                    }}
                >
                    Reset
                </button>
            </div>

            {/* Dropdown Menus */}
            <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-element-gap-lg)' }}>
                <div className="d-flex flex-column gap-2">
                    <span className="small text-muted fw-bold">Main Menu</span>
                    <div className="pdropdown">
                        <div 
                            className="dropdown-menu show" 
                            style={{ 
                                position: 'static', 
                                display: 'block', 
                                width: '200px',
                                backgroundColor: 'var(--color-surface-container-high)',
                                borderRadius: 'var(--size-modal-radius-sm)',
                                boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'
                            }}
                        >
                            <EngagementListItems 
                                status={status} 
                                onSelect={handleSelect}
                            />
                        </div>
                    </div>
                </div>

                {showSubmenu && (
                    <div className="d-flex flex-column gap-2">
                        <span className="small text-muted fw-bold">Submenu (Partially Engaged Reasons)</span>
                        <div className="pdropdown">
                            <div 
                                className="dropdown-menu show" 
                                style={{ 
                                    position: 'static', 
                                    display: 'block', 
                                    width: '220px',
                                    backgroundColor: 'var(--color-surface-container-high)',
                                    borderRadius: 'var(--size-modal-radius-sm)',
                                    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'
                                }}
                            >
                                <EngagementSubmenuItems 
                                    selectedReason={selectedReason}
                                    onSelect={handleReasonSelect}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
