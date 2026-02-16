import React, { useState, forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';
import { EngagementBadge } from './EngagementBadge.jsx';
import { EngagementListItems, EngagementSubmenuItems } from './EngagementListItems.jsx';
import '../../../../../packages/plus-ds/src/components/Dropdown/Dropdown.scss';

/**
 * Engagement Dropdown Component
 * Interactive dropdown composed of the Toolkit "Engagement Badge" and "Engagement List Items"
 * 
 * States:
 * - unfilled: Badge shows "Select" with dropdown
 * - open: Dropdown is open showing engagement options
 * - filled: Badge shows selected engagement status
 * - disabled: Badge is disabled (38% opacity)
 */

const CustomToggle = forwardRef(({ children, onClick, className }, ref) => (
    <div
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        className={`${className} cursor-pointer custom-toggle-no-caret`}
        style={{ display: 'inline-block' }}
    >
        <style>{`
            .custom-toggle-no-caret::after {
                display: none !important;
                content: none !important;
                border: none !important;
            }
        `}</style>
        {children}
    </div>
));

export const EngagementDropdown = ({
    initialStatus = 'unknown',
    onStatusChange,
    disabled = false,
    className = 'pdropdown'
}) => {
    const [status, setStatus] = useState(initialStatus);
    const [show, setShow] = useState(false);
    const [showSubmenu, setShowSubmenu] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);

    const handleSelect = (val, reason = null) => {
        if (val === 'partially-engaged') {
            setStatus(val);
            setShowSubmenu(true);
        } else {
            setStatus(val);
            setShowSubmenu(false);
            setSelectedReason(null);
            setShow(false);
            if (onStatusChange) {
                onStatusChange(val, reason);
            }
        }
    };

    const handleReasonSelect = (reason) => {
        setSelectedReason(reason);
        setShow(false);
        setShowSubmenu(false);
        if (onStatusChange) {
            onStatusChange(status, reason);
        }
    };

    const handleToggle = (isOpen) => {
        if (!disabled) {
            setShow(isOpen);
            if (!isOpen) {
                setShowSubmenu(false);
            }
        }
    };

    return (
        <Dropdown
            className={className}
            show={show}
            onToggle={handleToggle}
        >
            <Dropdown.Toggle as={CustomToggle} id="engagement-dropdown">
                <EngagementBadge 
                    status={status} 
                    showDropdown={true} 
                    disabled={disabled}
                />
            </Dropdown.Toggle>

            <Dropdown.Menu 
                className="dropdown-menu"
                style={{
                    backgroundColor: 'var(--color-surface-container-high)',
                    borderRadius: 'var(--size-modal-radius-sm)',
                    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
                    minWidth: '200px',
                    overflow: 'visible'
                }}
            >
                <div style={{ position: 'relative' }}>
                    <EngagementListItems
                        status={status}
                        onSelect={handleSelect}
                    />
                    
                    {showSubmenu && (
                        <div 
                            style={{
                                position: 'absolute',
                                left: '100%',
                                top: '28px',
                                backgroundColor: 'var(--color-surface-container-high)',
                                borderRadius: 'var(--size-modal-radius-sm)',
                                boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
                                minWidth: '200px',
                                zIndex: 1000
                            }}
                        >
                            <EngagementSubmenuItems
                                selectedReason={selectedReason}
                                onSelect={handleReasonSelect}
                            />
                        </div>
                    )}
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
};
