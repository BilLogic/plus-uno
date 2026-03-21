import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ProductAreaDropdown.scss';

/**
 * ProductAreaDropdown Component
 * A dropdown for selecting product areas with open/closed states
 */
export const ProductAreaDropdown = ({
    label = 'Product Area',
    placeholder = 'Select product area',
    options = [
        { value: 'homepage', text: 'Homepage' },
        { value: 'training', text: 'Training' },
        { value: 'toolkit', text: 'Toolkit' },
        { value: 'admin', text: 'Admin' },
        { value: 'other', text: 'Other' }
    ],
    value,
    onChange,
    className = '',
    id,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [selectedValue, setSelectedValue] = useState(value || null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (value !== undefined) {
            setSelectedValue(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleSelect = (option) => {
        setSelectedValue(option.value);
        setIsOpen(false);
        if (onChange) {
            onChange(option.value);
        }
    };

    const selectedOption = options.find(opt => opt.value === selectedValue);
    const displayText = selectedOption ? selectedOption.text : placeholder;

    return (
        <div 
            id={id}
            className={`plus-product-area-dropdown ${isOpen ? 'plus-product-area-dropdown--open' : 'plus-product-area-dropdown--closed'} ${className}`}
            ref={dropdownRef}
        >
            <div className="plus-product-area-dropdown-form">
                <div className="plus-product-area-dropdown-label">
                    <span className="body3-txt">{label}</span>
                </div>
                <div 
                    className="plus-product-area-dropdown-input"
                    onClick={toggleDropdown}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown();
                        }
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className="plus-product-area-dropdown-text body2-txt">
                        {displayText}
                    </span>
                    <div className="plus-product-area-dropdown-icon">
                        <i className="fa-solid fa-caret-down" aria-hidden="true"></i>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="plus-product-area-dropdown-menu">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`plus-product-area-dropdown-item ${selectedValue === option.value ? 'plus-product-area-dropdown-item--selected' : ''}`}
                            onClick={() => handleSelect(option)}
                            role="option"
                            aria-selected={selectedValue === option.value}
                        >
                            <div className="plus-product-area-dropdown-item-checkmark">
                                <i className="fa-solid fa-check" aria-hidden="true"></i>
                            </div>
                            <span className="plus-product-area-dropdown-item-text body2-txt">
                                {option.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

ProductAreaDropdown.propTypes = {
    /** Label text for the dropdown */
    label: PropTypes.string,
    /** Placeholder text when no option is selected */
    placeholder: PropTypes.string,
    /** Array of option objects with value and text */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
    })),
    /** Controlled value */
    value: PropTypes.string,
    /** Callback when selection changes */
    onChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Element ID */
    id: PropTypes.string,
    /** Whether dropdown starts open */
    defaultOpen: PropTypes.bool
};

export default ProductAreaDropdown;

