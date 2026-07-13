import React from 'react';

/**
 * Engagement List Items Component
 * Dropdown menu items for selecting engagement status
 * 
 * Design tokens used:
 * - Background: --color-surface-container-high
 * - Border radius: --size-modal-radius-sm
 * - Padding: --size-element-pad-x-md, --size-element-pad-y-md
 * - Gap: --size-element-gap-md
 * - Typography: body2-txt (14px)
 * - Icon size: fa-b2 (12px)
 */

// Sub-menu items for "Partially engaged" option
const partiallyEngagedReasons = [
    { id: 'joined-late', label: 'Joined late (10+ min)', icon: null },
    { id: 'unresponsive', label: 'Unresponsive on zoom', icon: null },
    { id: 'left-early', label: 'Left zoom early', icon: null },
    { id: 'other', label: 'Other', icon: 'fa-solid fa-circle-info', tooltip: 'If none apply, select "Other" and message your supervisor on Slack.' }
];

export const EngagementListItems = ({ 
    status = 'unknown', 
    onSelect,
    showSubmenu = false,
    selectedReason = null
}) => {
    const handleSelect = (val, reason = null) => (e) => {
        if (onSelect) {
            onSelect(val, reason);
        }
    };

    return (
        <div className="engagement-list-items-wrapper">
            <button
                type="button"
                className={`dropdown-item ${status === 'fully-engaged' ? 'selected' : ''}`}
                onClick={handleSelect('fully-engaged')}
            >
                <span className="pdropdown-item-text">Fully engaged on zoom</span>
                <i className="fa-solid fa-caret-right ms-2" style={{ fontSize: 'var(--font-size-fa-b2-solid)', color: 'var(--color-on-surface-variant)' }} />
            </button>
            <button
                type="button"
                className={`dropdown-item ${status === 'partially-engaged' ? 'selected' : ''}`}
                onClick={handleSelect('partially-engaged')}
            >
                <span className="pdropdown-item-text">Partially engaged</span>
                <i className="fa-solid fa-caret-right ms-2" style={{ fontSize: 'var(--font-size-fa-b2-solid)', color: 'var(--color-on-surface-variant)' }} />
            </button>
            <button
                type="button"
                className={`dropdown-item ${status === 'not-engaged' ? 'selected' : ''}`}
                onClick={handleSelect('not-engaged')}
            >
                                <span className="pdropdown-item-text">Not engaged at all</span>
            </button>
        </div>
    );
};

export const EngagementSubmenuItems = ({ 
    selectedReason = null, 
    onSelect 
}) => {
    const handleSelect = (reason) => (e) => {
        if (onSelect) {
            onSelect(reason);
        }
    };

    return (
        <div className="engagement-submenu-items-wrapper">
            {partiallyEngagedReasons.map((reason) => (
                <button
                    key={reason.id}
                    type="button"
                    className={`dropdown-item d-flex align-items-center ${selectedReason === reason.id ? 'selected' : ''}`}
                    onClick={handleSelect(reason.id)}
                >
                                        <span 
                        className="me-2" 
                        style={{ 
                            width: '12px', 
                            height: '12px', 
                            border: '1px solid var(--color-primary)', 
                            borderRadius: 'var(--size-element-radius-xs)',
                            backgroundColor: selectedReason === reason.id ? 'var(--color-primary)' : 'var(--color-on-primary)',
                            display: 'inline-block',
                            position: 'relative'
                        }} 
                    >
                        {selectedReason === reason.id && (
                            <i 
                                className="fa-solid fa-check" 
                                style={{ 
                                    fontSize: '8px', 
                                    color: 'var(--color-on-primary)',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }} 
                            />
                        )}
                    </span>
                    <span className="pdropdown-item-text">{reason.label}</span>
                    {reason.icon && (
                        <i 
                            className={`${reason.icon} ms-2`} 
                            style={{ fontSize: 'var(--font-size-fa-b2-solid)', color: 'var(--color-on-surface-variant)' }}
                            title={reason.tooltip}
                        />
                    )}
                </button>
            ))}
        </div>
    );
};
