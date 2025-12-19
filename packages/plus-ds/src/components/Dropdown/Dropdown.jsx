import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const Dropdown = ({
    id,
    buttonText = "Dropdown",
    items = [],
    size = "default",
    style = "default",
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
        style !== 'default' ? `pdropdown-${style}` : '',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', width: '100%' }}>
                                {item.multiSelectCheckbox && (
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '2px',
                                        backgroundColor: item.multiSelectChecked ? 'var(--color-primary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {item.multiSelectChecked && (
                                            <i className="fas fa-check" style={{ color: 'var(--color-on-primary)', fontSize: '8px' }}></i>
                                        )}
                                    </div>
                                )}

                                <i className="fas fa-check selected-icon" style={{ opacity: item.selected ? 1 : 0 }}></i>

                                {item.leadingIcon && <i className={`fas fa-${item.leadingIcon}`}></i>}

                                <span className="pdropdown-item-text" style={{ flexGrow: 1, minWidth: 0 }}>
                                    {item.text || item.label}
                                </span>

                                {item.trailingIcon && <i className={`fas fa-${item.trailingIcon}`}></i>}

                                {item.counter !== undefined && (
                                    <span style={{
                                        backgroundColor: 'color-mix(in srgb, var(--color-on-surface) 16%, transparent)',
                                        borderRadius: 'var(--size-border-radius-radius-1000)',
                                        padding: '0 var(--size-element-pad-x-sm)',
                                        height: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'var(--font-size-body3)',
                                        lineHeight: 'var(--font-line-height-body3)',
                                        fontWeight: 'var(--font-weight-semibold-1)',
                                        flexShrink: 0
                                    }}>
                                        {item.counter}
                                    </span>
                                )}

                                {item.dropright && <i className="fas fa-caret-right"></i>}
                            </div>
                        </button>
                        {item.divider && index < items.length - 1 && (
                            <div style={{ height: '1px', backgroundColor: 'var(--color-outline-variant)', width: '100%' }}></div>
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
    split: PropTypes.bool,
    direction: PropTypes.oneOf(['dropdown', 'dropup', 'dropleft', 'dropright']),
    className: PropTypes.string
};

export default Dropdown;
