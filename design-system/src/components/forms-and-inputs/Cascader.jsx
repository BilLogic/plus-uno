import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Cascader.scss';

const Cascader = ({
    id,
    value = [],
    options = [],
    onChange,
    placeholder = 'Please select',
    disabled = false,
    className = '',
    style,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPath, setSelectedPath] = useState(value || []);
    const [activeColumns, setActiveColumns] = useState([options]); // Array of option arrays for each column
    const wrapperRef = useRef(null);

    // Sync with value prop
    useEffect(() => {
        setSelectedPath(value || []);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Get display text for input field
    const displayText = useMemo(() => {
        if (selectedPath.length === 0) return '';
        
        const items = [];
        let levelOptions = options;
        
        for (let i = 0; i < selectedPath.length; i++) {
            const pathValue = selectedPath[i];
            const foundOption = levelOptions.find(opt => {
                const optValue = typeof opt === 'string' ? opt : (opt.value || opt.text || opt.label);
                return optValue === pathValue;
            });
            
            if (foundOption) {
                const text = typeof foundOption === 'string' ? foundOption : (foundOption.text || foundOption.label || foundOption.value);
                items.push(text);
                
                if (typeof foundOption === 'object' && foundOption.children) {
                    levelOptions = foundOption.children;
                }
            }
        }
        
        return items.join(' / ');
    }, [options, selectedPath]);

    const handleInputClick = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Reset to first level when opening
            setActiveColumns([options]);
        }
    };

    const handleOptionClick = (option, columnIndex) => {
        if (disabled) return;
        
        const optionValue = typeof option === 'string' ? option : (option.value || option.text || option.label);
        const hasChildren = typeof option === 'object' && option.children && option.children.length > 0;
        
        // Build path: use selectedPath up to this column, then add new selection
        const newPath = selectedPath.slice(0, columnIndex);
        newPath.push(optionValue);
        
        // Update selected path
        setSelectedPath(newPath);
        
        // If has children, show next column
        if (hasChildren) {
            const newColumns = activeColumns.slice(0, columnIndex + 1);
            newColumns.push(option.children);
            setActiveColumns(newColumns);
        } else {
            // Final selection - close and update
            setIsOpen(false);
            if (onChange) {
                onChange(newPath);
            }
        }
    };

    const handleOptionHover = (option, columnIndex) => {
        if (disabled) return;
        const isOptionDisabled = typeof option === 'object' && option.disabled;
        if (isOptionDisabled) return;

        const hasChildren = typeof option === 'object' && option.children && option.children.length > 0;

        // On hover, preview the next column (without committing selection).
        // If the hovered option has no children, trim any deeper columns.
        if (hasChildren) {
            const newColumns = activeColumns.slice(0, columnIndex + 1);
            newColumns.push(option.children);
            setActiveColumns(newColumns);
        } else {
            setActiveColumns((cols) => cols.slice(0, columnIndex + 1));
        }
    };

    // Rebuild columns based on selected path when opening
    const rebuildColumnsFromPath = useMemo(() => {
        if (!isOpen) return [options];
        
        if (selectedPath.length === 0) {
            return [options];
        }
        
        const columns = [options];
        let levelOptions = options;
        
        for (let i = 0; i < selectedPath.length; i++) {
            const pathValue = selectedPath[i];
            const foundOption = levelOptions.find(opt => {
                const optValue = typeof opt === 'string' ? opt : (opt.value || opt.text || opt.label);
                return optValue === pathValue;
            });
            
            if (foundOption && typeof foundOption === 'object' && foundOption.children) {
                columns.push(foundOption.children);
                levelOptions = foundOption.children;
            } else {
                break;
            }
        }
        
        return columns;
    }, [isOpen, selectedPath, options]);

    // When opening, rebuild columns from selected path
    useEffect(() => {
        if (isOpen) {
            setActiveColumns(rebuildColumnsFromPath);
        }
    }, [isOpen, rebuildColumnsFromPath]);

    return (
        <div className={`plus-cascader-wrapper ${className}`} id={id} style={style} ref={wrapperRef}>
            {/* Input Field */}
            <div className="plus-cascader-input-container">
                <Form.Control
                    type="text"
                    readOnly
                    value={displayText}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`plus-cascader-input ${isOpen ? 'plus-cascader-input-open' : ''}`}
                    onClick={handleInputClick}
                    {...props}
                />
                <i className={`fa-solid fa-caret-down plus-cascader-arrow ${isOpen ? 'plus-cascader-arrow-open' : ''}`} aria-hidden="true" />
            </div>

            {/* Dropdown Menu with Columns */}
            {isOpen && (
                <div className="plus-cascader-menu">
                    <div className="plus-cascader-columns">
                        {activeColumns.map((columnOptions, columnIndex) => (
                            <div key={columnIndex} className="plus-cascader-column">
                                {columnOptions.map((option, optionIndex) => {
                                    const optionText = typeof option === 'string' ? option : (option.text || option.label || 'Option');
                                    const optionValue = typeof option === 'string' ? option : (option.value || optionText);
                                    const hasChildren = typeof option === 'object' && option.children && option.children.length > 0;
                                    const isDisabled = disabled || (typeof option === 'object' && option.disabled);
                                    
                                    // Check if this option is selected (part of selectedPath)
                                    const isSelected = columnIndex < selectedPath.length && 
                                        (typeof option === 'string' ? option === selectedPath[columnIndex] : 
                                         (option.value || option.text || option.label) === selectedPath[columnIndex]);

                                    return (
                                        <div
                                            key={optionIndex}
                                            className={`plus-cascader-option ${isSelected ? 'plus-cascader-option-selected' : ''} ${isDisabled ? 'plus-cascader-option-disabled' : ''}`}
                                            onClick={() => !isDisabled && handleOptionClick(option, columnIndex)}
                                            onMouseEnter={() => handleOptionHover(option, columnIndex)}
                                        >
                                            <span className="plus-cascader-option-text">{optionText}</span>
                                            {hasChildren && (
                                                <i className="fas fa-caret-right plus-cascader-option-chevron" aria-hidden="true" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

Cascader.propTypes = {
    id: PropTypes.string,
    value: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ),
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                text: PropTypes.string,
                label: PropTypes.string,
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                children: PropTypes.array,
                disabled: PropTypes.bool
            })
        ])
    ),
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Cascader;



