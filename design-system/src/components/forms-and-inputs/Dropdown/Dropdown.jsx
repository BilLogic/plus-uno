import React, { useState, useRef, useEffect } from 'react';
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

            <div className={menuClasses}>
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
