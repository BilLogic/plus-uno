import React, { useState, useRef, useLayoutEffect, forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';
import { EngagementBadge } from './EngagementBadge.jsx';
import { EngagementListItems, EngagementSubmenuItems } from './EngagementListItems.jsx';
import '@/components/forms-and-inputs/Dropdown/Dropdown.scss';

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
    // Submenu flyout flips to the left side when it would overflow the right viewport edge.
    const submenuRef = useRef(null);
    const [submenuSide, setSubmenuSide] = useState('right');

    useLayoutEffect(() => {
        if (!showSubmenu) { setSubmenuSide('right'); return; }
        const el = submenuRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth;
        // Rendered on the right by default; flip left if it spills off-screen and there's room left.
        setSubmenuSide(r.right > vw - 8 && r.left - r.width > 8 ? 'left' : 'right');
    }, [showSubmenu, selectedReason]);

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
                className="dropdown-menu show"
                // Surface / radius / shadow come from the shared .dropdown-menu (Dropdown.scss);
                // only the submenu escape hatch (overflow) is set locally.
                style={{ overflow: 'visible' }}
            >
                <div style={{ position: 'relative' }}>
                    <EngagementListItems
                        status={status}
                        onSelect={handleSelect}
                    />

                    {showSubmenu && (
                        <div
                            ref={submenuRef}
                            className="dropdown-menu show"
                            // Reuse the shared menu surface/radius/shadow; flip side to stay on-screen.
                            style={{
                                position: 'absolute',
                                top: '28px',
                                zIndex: 1000,
                                ...(submenuSide === 'left' ? { right: '100%', left: 'auto' } : { left: '100%' }),
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
