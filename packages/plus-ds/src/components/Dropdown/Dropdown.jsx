import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Dropdown.scss';

const Dropdown = ({
    id,
    buttonText = "Dropdown",
    items = [],
    size = "default",
    style = "default",
    fill = "filled", // NEW: filled, tonal, outline, ghost
    split = false,
    direction = "dropdown",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen(!isOpen);
    const closeDropdown = () => setIsOpen(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const wrapperClasses = [
        'pdropdown',
        'dropdown',
        direction !== 'dropdown' ? direction : '',
        size !== 'default' ? size : '',
        style !== 'default' ? `pdropdown-${style}` : 'pdropdown-default',
        fill !== 'filled' ? `pdropdown-${fill}` : '', // NEW: fill variant class
        split ? 'pdropdown-split-dropdown' : '',
        isOpen ? 'show' : '',
        className
    ].filter(Boolean).join(' ');

    const menuClasses = [
        'dropdown-menu',
        isOpen ? 'show' : ''
    ].filter(Boolean).join(' ');

    const renderToggle = () => {
        const toggleClasses = [
            split ? 'pdropdown-split-toggle-btn' : 'pdropdown-default-toggle',
            'dropdown-toggle',
            direction === 'dropup' ? 'pdropdown-caret-up' : '',
            direction === 'dropleft' ? 'pdropdown-caret-left' : '',
            direction === 'dropright' ? 'pdropdown-caret-right' : ''
        ].filter(Boolean).join(' ');

        return (
            <button
                type="button"
                className={toggleClasses}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {!split && <span>{buttonText}</span>}
            </button>
        );
    };

    const renderSplitButton = () => (
        <button type="button" className="pdropdown-split-text-btn pdropdown-default-toggle">
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
                renderToggle()
            )}

            <div className={menuClasses}>
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <button
                            type="button"
                            className={`dropdown-item ${item.selected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''} ${item.header ? 'dropdown-section-header' : ''}`}
                            disabled={item.disabled}
                            onClick={item.onClick}
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
    fill: PropTypes.oneOf(['filled', 'tonal', 'outline', 'ghost']),
    split: PropTypes.bool,
    direction: PropTypes.oneOf(['dropdown', 'dropup', 'dropleft', 'dropright']),
    className: PropTypes.string
};

export default Dropdown;
