import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import ListGroup, { ListGroupItem } from '@/components/ListGroup/ListGroup';
import Input from './Input';
import './Select.scss';

/**
 * Enhanced Select Component
 * 
 * Uses existing design system components:
 * - **ListGroup.Item** with selectable prop for options
 * - **Badge** (dismissible) for selected values
 * - **Button** (ghost) for creatable option
 * - **InputGroup** for search field
 */
// Custom Toggle to ensure proper click handling
const CustomSelectToggle = React.forwardRef(({ children, onClick, className, disabled, ...props }, ref) => (
    <div
        ref={ref}
        className={`plus-select-trigger ${className || ''}`}
        onClick={(e) => {
            e.preventDefault();
            if (!disabled) {
                onClick(e);
            }
        }}
        aria-disabled={disabled}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...props}
    >
        {children}
    </div>
));

CustomSelectToggle.displayName = 'CustomSelectToggle';

const Select = ({
    id,
    name,
    mode = 'single', // 'single' or 'multi'
    options = [],
    value,
    defaultValue,
    placeholder = 'Select...',
    searchable = false,
    creatable = false,
    open,
    defaultOpen = false,
    defaultSearchTerm = '',
    displayMode = 'badges',
    lineWrap = true,
    truncate = false,
    size = 'medium', // 'small', 'medium', 'large'
    disabled = false,
    readonly = false,
    required = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    // State
    const [isOpen, setIsOpen] = useState(Boolean(open ?? defaultOpen));
    const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);
    const [addValue, setAddValue] = useState('');
    const [internalValue, setInternalValue] = useState(
        defaultValue || (mode === 'multi' ? [] : '')
    );
    const [createdOptions, setCreatedOptions] = useState([]);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Allow controlled open state for Storybook demos
    useEffect(() => {
        if (open !== undefined) setIsOpen(Boolean(open));
    }, [open]);

    // Keep searchTerm in sync for Storybook demos
    useEffect(() => {
        setSearchTerm(defaultSearchTerm || '');
    }, [defaultSearchTerm]);

    // Controlled vs uncontrolled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Combine original options with options created via "Add new value"
    const allOptions = [...options, ...createdOptions];

    // For multi-select, ensure value is always an array
    const selectedValues = mode === 'multi'
        ? (Array.isArray(currentValue) ? currentValue : [])
        : currentValue;

    // Map Select size to ListGroup.Item size
    const listItemSize = size === 'small' ? 'b3' : size === 'large' ? 'b1' : 'b2';

    // Filter options based on search
    const filteredOptions = allOptions.filter(opt => {
        const label = opt.label || opt.text || opt.value;
        return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Check if Add row input can be added as new value
    const trimmedAddValue = addValue.trim();
    const canAddNew = creatable && trimmedAddValue &&
        !allOptions.some(opt => (opt.value || opt.label || opt.text) === trimmedAddValue);

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
        const newVal = trimmedAddValue;

        // Add new option to local list so it appears in dropdown
        setCreatedOptions(prev => [...prev, { value: newVal, label: newVal }]);

        handleSelect(newVal);
        setAddValue('');
    };

    // Handle badge dismiss
    const handleBadgeDismiss = (val) => {
        handleSelect(val);
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
            return '';
        } else {
            if (!selectedValues) return placeholder;
            const opt = options.find(o => o.value === selectedValues);
            return opt ? (opt.label || opt.text || opt.value) : selectedValues;
        }
    };

    // Intentionally do not auto-focus search on open.
    // Users should click into the search field if they want to type.

    // Keep dropdown menu anchored to trigger when trigger height changes
    // (e.g. multi-select chips wrap/unwrap while menu is open).
    useEffect(() => {
        if (!isOpen) return;
        const notifyLayoutChange = () => window.dispatchEvent(new Event('resize'));
        notifyLayoutChange();
        const rafId = requestAnimationFrame(notifyLayoutChange);
        return () => cancelAnimationFrame(rafId);
    }, [isOpen, selectedValues]);

    // Size classes
    const sizeClass = size === 'small' ? 'plus-select-sm' :
        size === 'large' ? 'plus-select-lg' : 'plus-select-md';

    const wrapperClasses = [
        'plus-select-wrapper',
        sizeClass,
        mode === 'multi' ? 'plus-select-multi' : 'plus-select-single',
        disabled ? 'plus-select-disabled' : '',
        readonly ? 'plus-select-readonly' : '',
        isOpen ? 'plus-select-open' : '',
        lineWrap ? '' : 'plus-select-nowrap',
        truncate ? 'plus-select-truncate' : '',
        className
    ].filter(Boolean).join(' ');

    const showBadgesInTrigger = mode === 'multi' && displayMode === 'badges' && selectedValues.length > 0;
    const badgesDismissible = !disabled && !readonly;

    return (
            <Dropdown
                ref={dropdownRef}
                show={isOpen}
                onToggle={(nextShow) => !disabled && !readonly && setIsOpen(nextShow)}
                className={wrapperClasses}
                style={style}
            >
                {/* Trigger / Input Field */}
                <Dropdown.Toggle as={CustomSelectToggle} id={id} disabled={disabled || readonly}>
                <div className="plus-select-value">
                    {showBadgesInTrigger && (
                        <div className="plus-select-badges">
                            {selectedValues.map((val) => {
                                const opt = allOptions.find(o => o.value === val);
                                const label = opt ? (opt.label || opt.text || opt.value) : val;
                                return (
                                    <Badge
                                        key={val}
                                        text={label}
                                        dismissible={badgesDismissible}
                                        onDismiss={(e) => {
                                            // Stop propagation to prevent toggling dropdown when dismissing badge
                                            e && e.stopPropagation && e.stopPropagation();
                                            handleBadgeDismiss(val);
                                        }}
                                        size="b2"
                                        style="secondary"
                                    />
                                );
                            })}
                        </div>
                    )}

                    {!showBadgesInTrigger && (
                        <span className={`plus-select-text ${!selectedValues || (Array.isArray(selectedValues) && selectedValues.length === 0) ? 'plus-select-placeholder' : ''}`}>
                            {getDisplayText()}
                        </span>
                    )}
                </div>

                <div className="plus-select-icon" aria-hidden="true">
                    <i
                        className={`fa-solid ${isOpen ? 'fa-caret-up' : 'fa-caret-down'} plus-select-chevron`}
                    />
                </div>
            </Dropdown.Toggle>

            {/* Dropdown Menu */}
            <Dropdown.Menu className="plus-select-menu" flip={false}>
                <div className="plus-select-options-list">
                    {/* Search input */}
                    {searchable && (
                        <div className="plus-select-search">
                            <Input
                                id={`${id || name}-search`}
                                showLabel={false}
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={(e) => e && e.stopPropagation && e.stopPropagation()}
                                onBlur={(e) => e && e.stopPropagation && e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                size="medium"
                                inputRef={searchInputRef}
                            />
                        </div>
                    )}

                    {/* Add new value row (inline input, independent from Search) */}
                    {creatable && (
                        <div className="plus-select-add-row">
                            <i className="fa-solid fa-plus plus-select-add-icon" aria-hidden="true" />
                            <input
                                type="text"
                                className="plus-select-add-input"
                                value={addValue}
                                placeholder="Add new value"
                                onChange={(e) => setAddValue(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNew();
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Options list */}
                    {mode === 'multi' ? (
                        <ListGroup flush className="plus-select-options">
                            {filteredOptions.map((opt, idx) => {
                                const optValue = opt.value;
                                const optLabel = opt.label || opt.text || opt.value;
                                const isSelected = selectedValues.includes(optValue);
                                const isDisabled = Boolean(opt.disabled);

                                return (
                                    <ListGroupItem
                                        key={idx}
                                        value={optValue}
                                        label={optLabel}
                                        selectable="multi"
                                        name={`${name || id}-option`}
                                        selected={isSelected}
                                        disabled={isDisabled}
                                        size={listItemSize}
                                        className="plus-select-option-item"
                                        onClick={() => handleSelect(optValue)}
                                    />
                                );
                            })}
                        </ListGroup>
                    ) : (
                        <div className="plus-select-options">
                            {filteredOptions.map((opt, idx) => {
                                const optValue = opt.value;
                                const optLabel = opt.label || opt.text || opt.value;
                                const isSelected = selectedValues === optValue;
                                const isDisabled = Boolean(opt.disabled);

                                const itemClass = [
                                    'dropdown-item',
                                    isSelected ? 'selected' : '',
                                    isDisabled ? 'disabled' : ''
                                ].filter(Boolean).join(' ');

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={itemClass}
                                        disabled={isDisabled}
                                        onClick={() => !isDisabled && handleSelect(optValue)}
                                    >
                                        <span className="plus-select-option-label">
                                            {optLabel}
                                        </span>
                                    </button>
                                );
                            })}
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
    open: PropTypes.bool,
    defaultOpen: PropTypes.bool,
    defaultSearchTerm: PropTypes.string,
    displayMode: PropTypes.oneOf(['badges', 'text']),
    lineWrap: PropTypes.bool,
    truncate: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    required: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Select;
