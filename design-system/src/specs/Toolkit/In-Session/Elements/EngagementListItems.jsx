import React from 'react';
import { iconClass } from '../../../../lib/icon';

/**
 * Engagement List Items Component
 * Dropdown menu items for selecting engagement status
 * 
 * Renders bare `.dropdown-item` rows — the menu surface, radius, shadow and item
 * padding/typography all come from the shared Bootstrap-bridge styles
 * (styles/main.scss). Do NOT re-declare the menu background/radius here; wrap
 * these items in a `.dropdown-menu` container instead.
 */

// Sub-menu items for "Partially engaged" option
const partiallyEngagedReasons = [
    { id: 'joined-late', label: 'Joined late (10+ min)', icon: null },
    { id: 'unresponsive', label: 'Unresponsive on zoom', icon: null },
    { id: 'left-early', label: 'Left zoom early', icon: null },
    { id: 'other', label: 'Other', icon: iconClass('circle-info'), tooltip: 'If none apply, select "Other" and message your supervisor on Slack.' }
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
                {/* Terminal selection — no submenu, so no caret. */}
                <span className="pdropdown-item-text">Fully engaged on zoom</span>
            </button>
            <button
                type="button"
                className={`dropdown-item ${status === 'partially-engaged' ? 'selected' : ''}`}
                onClick={handleSelect('partially-engaged')}
            >
                {/* Opens the "reasons" submenu — the only item with a caret. */}
                <span className="pdropdown-item-text">Partially engaged</span>
                <i className="fa-solid fa-caret-right ms-2" style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--ds-icon-subtle)' }} />
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
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: selectedReason === reason.id ? 'var(--color-primary)' : 'var(--color-on-primary)',
                            display: 'inline-block',
                            position: 'relative'
                        }} 
                    >
                        {selectedReason === reason.id && (
                            <i 
                                className={iconClass('check')} 
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
                            style={{ fontSize: 'var(--font-size-fa-body2-solid)', color: 'var(--ds-icon-subtle)' }}
                            title={reason.tooltip}
                        />
                    )}
                </button>
            ))}
        </div>
    );
};
