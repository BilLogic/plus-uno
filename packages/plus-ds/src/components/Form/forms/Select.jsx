import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Checkbox from './Checkbox';
import Radio from './Radio';
import './Select.scss';

/**
 * Enhanced Select Component
 * Uses existing design system components:
 * - Checkbox for multi-select options
 * - Radio for single-select options
 * - Badge (dismissible) for selected values
 * - Ghost Button for creatable option
 */
const Select = ({
    id,
    name,
    mode = 'single', // 'single' or 'multi'
    options = [],
    value, // For single mode (string) or multi (array)
    defaultValue,
    placeholder = 'Select...',
    searchable = false,
    creatable = false, // Allow adding new values
    displayMode = 'badges', // 'badges' or 'text' for multi-select display
    lineWrap = true, // true = multiline badges, false = single line with overflow
    truncate = false, // true = truncate overflowing badges, false = show all
    size = 'medium',
    disabled = false,
    required = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    // State
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [internalValue, setInternalValue] = useState(
        defaultValue || (mode === 'multi' ? [] : '')
    );
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Controlled vs uncontrolled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // For multi-select, ensure value is always an array
    const selectedValues = mode === 'multi'
        ? (Array.isArray(currentValue) ? currentValue : [])
        : currentValue;

    // Filter options based on search
    const filteredOptions = options.filter(opt => {
        const label = opt.label || opt.text || opt.value;
        return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Check if search term can be added as new value
    const canAddNew = creatable && searchTerm.trim() &&
        !options.some(opt => (opt.value || opt.label || opt.text) === searchTerm.trim());

    // Handle selection
    const handleSelect = (optValue) => {
        let newValue;

        if (mode === 'multi') {
            const vals = Array.isArray(selectedValues) ? selectedValues : [];
            if (vals.includes(optValue)) {
                newValue = vals.filter(v => v !== optValue);
            } else {
                newValue = [...vals, optValue];
            }
        } else {
            newValue = optValue;
            setIsOpen(false); // Close on single select
        }

        if (!isControlled) {
            setInternalValue(newValue);
        }

        if (onChange) {
            onChange(newValue);
        }
    };

    // Handle adding new value
    const handleAddNew = () => {
        if (!canAddNew) return;
        const newVal = searchTerm.trim();
        handleSelect(newVal);
        setSearchTerm('');
    };

    // Handle badge dismiss
    const handleBadgeDismiss = (val) => {
        handleSelect(val); // Toggles off
    };

    // Get display text for selected value(s)
    const getDisplayText = () => {
        if (mode === 'multi') {
            if (selectedValues.length === 0) return placeholder;
            if (displayMode === 'text') {
                return selectedValues.map(v => {
                    const opt = options.find(o => o.value === v);
                    return opt ? (opt.label || opt.text || opt.value) : v;
                }).join(', ');
            }
            return ''; // Badges shown separately
        } else {
            if (!selectedValues) return placeholder;
            const opt = options.find(o => o.value === selectedValues);
            return opt ? (opt.label || opt.text || opt.value) : selectedValues;
        }
    };

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    // Size classes
    const sizeClass = size === 'small' ? 'plus-select-sm' :
        size === 'large' ? 'plus-select-lg' : 'plus-select-md';

    const wrapperClasses = [
        'plus-select-wrapper',
        sizeClass,
        mode === 'multi' ? 'plus-select-multi' : 'plus-select-single',
        disabled ? 'plus-select-disabled' : '',
        isOpen ? 'plus-select-open' : '',
        lineWrap ? '' : 'plus-select-nowrap',
        truncate ? 'plus-select-truncate' : '',
        className
    ].filter(Boolean).join(' ');

    // Show badges in trigger area or text?
    const showBadgesInTrigger = mode === 'multi' && displayMode === 'badges' && selectedValues.length > 0;

    return (
        <Dropdown
            ref={dropdownRef}
            show={isOpen}
            onToggle={(nextShow) => !disabled && setIsOpen(nextShow)}
            className={wrapperClasses}
            style={style}
        >
            {/* Trigger / Input Field */}
            <Dropdown.Toggle
                as="div"
                id={id}
                className="plus-select-trigger"
                disabled={disabled}
            >
                {/* Badges for multi-select using Badge component */}
                {showBadgesInTrigger && (
                    <div className="plus-select-badges">
                        {selectedValues.map((val) => {
                            const opt = options.find(o => o.value === val);
                            const label = opt ? (opt.label || opt.text || opt.value) : val;
                            return (
                                <Badge
                                    key={val}
                                    text={label}
                                    dismissible
                                    onDismiss={() => handleBadgeDismiss(val)}
                                    size="b3"
                                    style="secondary"
                                />
                            );
                        })}
                    </div>
                )}

                {/* Text display - only show if no badges or in text mode */}
                {!showBadgesInTrigger && (
                    <span className={`plus-select-text ${!selectedValues || (Array.isArray(selectedValues) && selectedValues.length === 0) ? 'plus-select-placeholder' : ''}`}>
                        {getDisplayText()}
                    </span>
                )}

                {/* Chevron icon */}
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} plus-select-chevron`} />
            </Dropdown.Toggle>

            {/* Dropdown Menu */}
            <Dropdown.Menu className="plus-select-menu">
                {/* Search input */}
                {searchable && (
                    <div className="plus-select-search">
                        <i className="fas fa-search plus-select-search-icon" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="plus-select-search-input"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {/* Options list */}
                <div className="plus-select-options">
                    {filteredOptions.map((opt, idx) => {
                        const optValue = opt.value;
                        const optLabel = opt.label || opt.text || opt.value;
                        const isSelected = mode === 'multi'
                            ? selectedValues.includes(optValue)
                            : selectedValues === optValue;
                        const isDisabled = opt.disabled;

                        return (
                            <div
                                key={idx}
                                className={`plus-select-option ${isSelected ? 'plus-select-option-selected' : ''} ${isDisabled ? 'plus-select-option-disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDisabled) handleSelect(optValue);
                                }}
                            >
                                {/* Using Checkbox or Radio components */}
                                {mode === 'multi' ? (
                                    <Checkbox
                                        id={`${id || name}-opt-${idx}`}
                                        name={`${name || id}-option`}
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        label={optLabel}
                                        size="small"
                                        onChange={() => { }} // Handled by parent div onClick
                                        className="plus-select-option-checkbox"
                                    />
                                ) : (
                                    <Radio
                                        id={`${id || name}-opt-${idx}`}
                                        name={`${name || id}-radio`}
                                        value={optValue}
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        label={optLabel}
                                        size="small"
                                        onChange={() => { }} // Handled by parent div onClick
                                        className="plus-select-option-radio"
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* Add new option using ghost Button */}
                    {canAddNew && (
                        <div className="plus-select-option plus-select-option-add">
                            <Button
                                text={`Add "${searchTerm}"`}
                                style="ghost"
                                size="small"
                                leadingVisual={<i className="fas fa-plus" />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddNew();
                                }}
                                className="plus-select-add-button"
                            />
                        </div>
                    )}

                    {/* No results */}
                    {filteredOptions.length === 0 && !canAddNew && (
                        <div className="plus-select-no-results">
                            No options found
                        </div>
                    )}
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
};

Select.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    mode: PropTypes.oneOf(['single', 'multi']),
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string,
        text: PropTypes.string,
        disabled: PropTypes.bool
    })),
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    defaultValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    placeholder: PropTypes.string,
    searchable: PropTypes.bool,
    creatable: PropTypes.bool,
    displayMode: PropTypes.oneOf(['badges', 'text']),
    lineWrap: PropTypes.bool,
    truncate: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Select;
