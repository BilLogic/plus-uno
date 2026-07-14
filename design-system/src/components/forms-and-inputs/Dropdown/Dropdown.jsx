import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Dropdown.scss';

const Dropdown = ({
    id,
    buttonText = "Dropdown",
    items = [],
    size = "default",
    style = "default",
    fill = "outline",
    split = false,
    direction = "dropdown",
    className = "",
    isOpen: controlledIsOpen, // Optional controlled state
    toggle // Optional custom toggle component
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);
    // Viewport-aware placement: the menu flips up when there isn't room below, and right-aligns
    // when a left-aligned menu would spill off the right edge. Only the default vertical dropdown
    // is auto-placed; an explicit `direction` of dropup/dropleft/dropright is honored as authored.
    const [placement, setPlacement] = useState({ vertical: 'down', horizontal: 'start' });

    // Determine if controlled or uncontrolled
    const isControlled = controlledIsOpen !== undefined;
    const show = isControlled ? controlledIsOpen : internalIsOpen;

    const toggleDropdown = () => {
        if (!isControlled) {
            setInternalIsOpen(!internalIsOpen);
        }
    };

    const closeDropdown = () => {
        if (!isControlled) {
            setInternalIsOpen(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownRef]);

    // Measure available space and choose a placement so the menu stays on-screen.
    const measurePlacement = useCallback(() => {
        const toggleEl = dropdownRef.current;
        const menuEl = menuRef.current;
        if (!toggleEl || !menuEl) return;
        const t = toggleEl.getBoundingClientRect();
        const m = menuEl.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const vw = window.innerWidth || document.documentElement.clientWidth;
        const MARGIN = 8;

        // Vertical: only the neutral 'dropdown' auto-flips; 'dropup' stays up, side directions stay put.
        let vertical = direction === 'dropup' ? 'up' : 'down';
        if (direction === 'dropdown') {
            const below = vh - t.bottom;
            const above = t.top;
            if (below < m.height + MARGIN && above > below) vertical = 'up';
        }

        // Horizontal alignment for vertical menus: right-align if a left-aligned menu would overflow.
        let horizontal = 'start';
        if (direction === 'dropdown' || direction === 'dropup') {
            if (t.left + m.width > vw - MARGIN && t.right - m.width > MARGIN) horizontal = 'end';
        }

        setPlacement((prev) =>
            prev.vertical === vertical && prev.horizontal === horizontal ? prev : { vertical, horizontal }
        );
    }, [direction]);

    useLayoutEffect(() => {
        if (!show) {
            setPlacement((prev) => (prev.vertical === 'down' && prev.horizontal === 'start' ? prev : { vertical: 'down', horizontal: 'start' }));
            return;
        }
        measurePlacement();
        const onReflow = () => measurePlacement();
        window.addEventListener('resize', onReflow);
        window.addEventListener('scroll', onReflow, true);
        return () => {
            window.removeEventListener('resize', onReflow);
            window.removeEventListener('scroll', onReflow, true);
        };
    }, [show, measurePlacement]);

    const wrapperClasses = [
        'pdropdown',
        'dropdown',
        direction !== 'dropdown' ? direction : '',
        size !== 'default' ? size : '',
        style !== 'default' ? `pdropdown-${style}` : 'pdropdown-default',
        fill === 'ghost' ? 'pdropdown-ghost' : 'pdropdown-outline',
        split ? 'pdropdown-split-dropdown' : '',
        show ? 'show' : '',
        className
    ].filter(Boolean).join(' ');

    const menuClasses = [
        'dropdown-menu',
        show ? 'show' : ''
    ].filter(Boolean).join(' ');

    const renderToggle = () => {
        const caretClass =
            direction === 'dropup' ? 'pdropdown-caret-up' :
            direction === 'dropleft' ? 'pdropdown-caret-left' :
            direction === 'dropright' ? 'pdropdown-caret-right' :
            // For standard dropdown direction, use up caret when menu is open
            show ? 'pdropdown-caret-up' : '';

        const toggleClasses = [
            split ? 'pdropdown-split-toggle-btn' : 'pdropdown-default-toggle',
            'dropdown-toggle',
            caretClass
        ].filter(Boolean).join(' ');

        return (
            <button
                type="button"
                className={toggleClasses}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={show}
                aria-label={split ? `${buttonText || 'Toggle'} options` : undefined}
            >
                {!split && <span>{buttonText}</span>}
            </button>
        );
    };

    const renderSplitButton = () => (
        <button type="button" className="pdropdown-split-text-btn">
            <span>{buttonText}</span>
        </button>
    );

    return (
        <div id={id} className={wrapperClasses} ref={dropdownRef}>
            {split ? (
                direction === 'dropleft' ? (
                    <>
                        {renderToggle()}
                        {renderSplitButton()}
                    </>
                ) : (
                    <>
                        {renderSplitButton()}
                        {renderToggle()}
                    </>
                )
            ) : (
                toggle ? (
                    <div onClick={toggleDropdown} className="d-inline-block" style={{ cursor: 'pointer' }}>
                        {toggle}
                    </div>
                ) : (
                    renderToggle()
                )
            )}

            <div
                className={menuClasses}
                ref={menuRef}
                style={{
                    ...(placement.vertical === 'up' ? { top: 'auto', bottom: '100%' } : null),
                    ...(placement.horizontal === 'end' ? { left: 'auto', right: 0 } : null),
                }}
            >
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <button
                            type="button"
                            className={`dropdown-item ${item.selected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''} ${item.header ? 'dropdown-section-header' : ''}`}
                            disabled={item.disabled}
                            onClick={(e) => {
                                if (item.onClick) item.onClick(e);
                                if (!item.keepOpen) closeDropdown(); // Allow optional keepOpen for things like multi-select
                            }}
                        >
                            <div className="dropdown-item-inner">

                                <i className="fas fa-check selected-icon" style={{ opacity: item.selected ? 1 : 0 }}></i>

                                {item.leadingIcon && <i className={`fas fa-${item.leadingIcon}`}></i>}

                                <span className="pdropdown-item-text" style={{ flexGrow: 1, minWidth: 0 }}>
                                    {item.text || item.label}
                                </span>

                                {item.trailingIcon && <i className={`fas fa-${item.trailingIcon}`}></i>}

                                {item.counter !== undefined && (
                                    <span className="pdropdown-counter">
                                        {item.counter}
                                    </span>
                                )}

                                {item.dropright && <i className="fas fa-caret-right"></i>}
                            </div>
                        </button>
                        {item.divider && index < items.length - 1 && (
                            <div className="pdropdown-divider"></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

Dropdown.propTypes = {
    id: PropTypes.string,
    buttonText: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        label: PropTypes.string,
        selected: PropTypes.bool,
        disabled: PropTypes.bool,
        header: PropTypes.bool,
        multiSelectCheckbox: PropTypes.bool,
        multiSelectChecked: PropTypes.bool,
        leadingIcon: PropTypes.string,
        trailingIcon: PropTypes.string,
        counter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        dropright: PropTypes.bool,
        divider: PropTypes.bool,
        onClick: PropTypes.func
    })),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    style: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default']),
    fill: PropTypes.oneOf(['outline', 'ghost']),
    split: PropTypes.bool,
    direction: PropTypes.oneOf(['dropdown', 'dropup', 'dropleft', 'dropright']),
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    toggle: PropTypes.node
};

export default Dropdown;
