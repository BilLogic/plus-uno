import React, { useState, useEffect, useRef, useMemo } from 'react';
import useFieldId from './useFieldId';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Cascader.scss';

/**
 * The value and label of an option, for either supported shape (#323).
 *
 * These were three copies of the same expression inline. They are lifted here
 * because the key handler needs them too, and a fourth copy of
 * `opt.value || opt.text || opt.label` is a fourth chance to get it wrong.
 */
const optionValueOf = (option) => (
    typeof option === 'string' ? option : (option.value || option.text || option.label)
);

const optionLabelOf = (option) => (
    typeof option === 'string' ? option : (option.text || option.label || 'Option')
);

const optionChildrenOf = (option) => (
    (typeof option === 'object' && Array.isArray(option.children)) ? option.children : []
);

const optionIsDisabled = (option) => typeof option === 'object' && Boolean(option.disabled);

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
    const inputRef = useRef(null);
    /**
     * #323. Where the keyboard cursor is: which column, and which row of it.
     * The options are real elements, so focus moves between them with a roving
     * `tabIndex` rather than through `aria-activedescendant`.
     */
    const optionRefs = useRef(new Map());
    const [activeCell, setActiveCell] = useState(null);
    const fieldId = useFieldId(id);
    const menuId = `${fieldId}-menu`;

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

    /* ---------------------------------------------------------------------
     * #323. The keyboard half. Everything below this comment exists because the
     * menu was reachable only by pointer: the options were `div`s with an
     * `onClick`, no role, no tab stop and no key handler, and the trigger said
     * nothing about a menu existing at all.
     * ------------------------------------------------------------------- */

    /** Put the cursor on a cell and remember it; the effect below moves focus. */
    const focusCell = (column, index) => setActiveCell({ column, index });

    /** The next selectable row in `column`, walking `step` at a time. Disabled
     *  options are skipped rather than landed on and refused. */
    const nextEnabledIndex = (column, from, step) => {
        const rows = activeColumns[column] || [];
        for (let i = from; i >= 0 && i < rows.length; i += step) {
            if (!optionIsDisabled(rows[i])) return i;
        }
        return null;
    };

    useEffect(() => {
        if (!isOpen) {
            setActiveCell(null);
            return;
        }
        // Enter on the row the current path already names, or the first one.
        const first = nextEnabledIndex(0, 0, 1);
        if (first !== null) setActiveCell({ column: 0, index: first });
        // Entry point only — re-running would drag the cursor back mid-walk.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !activeCell) return;
        const element = optionRefs.current.get(`${activeCell.column}:${activeCell.index}`);
        if (element && element !== document.activeElement) element.focus();
    }, [isOpen, activeCell, activeColumns]);

    const closeAndReturnFocus = () => {
        setIsOpen(false);
        if (inputRef.current) inputRef.current.focus();
    };

    /**
     * Down and Up walk a column; Right opens the child column and steps into it;
     * Left goes back to the column that produced this one; Enter opens a branch
     * or commits a leaf; Escape closes and hands focus back.
     *
     * @param {React.KeyboardEvent} event
     */
    const handleMenuKeyDown = (event) => {
        if (disabled || !activeCell) return;

        const { column, index } = activeCell;
        const rows = activeColumns[column] || [];
        const option = rows[index];
        if (!option) return;

        const children = optionChildrenOf(option);

        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                const next = nextEnabledIndex(column, index + 1, 1);
                if (next !== null) focusCell(column, next);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                const next = nextEnabledIndex(column, index - 1, -1);
                if (next !== null) focusCell(column, next);
                return;
            }
            case 'Home': {
                event.preventDefault();
                const next = nextEnabledIndex(column, 0, 1);
                if (next !== null) focusCell(column, next);
                return;
            }
            case 'End': {
                event.preventDefault();
                const next = nextEnabledIndex(column, rows.length - 1, -1);
                if (next !== null) focusCell(column, next);
                return;
            }
            case 'ArrowRight': {
                event.preventDefault();
                if (children.length === 0) return;
                // Opening a column is the same state change a click makes, so it
                // goes through the same path — the path also updates selectedPath,
                // which is what keeps the highlighted trail correct.
                handleOptionClick(option, column);
                focusCell(column + 1, 0);
                return;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                if (column === 0) return;
                setActiveColumns((columns) => columns.slice(0, column + 1));
                const parentIndex = (activeColumns[column - 1] || []).findIndex(
                    (candidate) => optionValueOf(candidate) === selectedPath[column - 1],
                );
                focusCell(column - 1, parentIndex >= 0 ? parentIndex : 0);
                return;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                handleOptionClick(option, column);
                if (children.length > 0) {
                    focusCell(column + 1, 0);
                } else if (inputRef.current) {
                    // A leaf commits and closes, so focus goes back to the field.
                    inputRef.current.focus();
                }
                return;
            }
            case 'Escape':
                event.preventDefault();
                closeAndReturnFocus();
                return;
            default:
        }
    };

    /**
     * @param {React.KeyboardEvent} event
     */
    const handleTriggerKeyDown = (event) => {
        if (disabled) return;
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!isOpen) {
                setActiveColumns([options]);
                setIsOpen(true);
            }
        } else if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            setIsOpen(false);
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

    /*
     * #323. `id` used to be applied to the wrapper, so a `label` pointing at it
     * named a `div`. It now names the input, which is the element focus lands on.
     */
    return (
        <div className={`plus-cascader-wrapper ${className}`} style={style} ref={wrapperRef}>
            {/* Input Field */}
            <div className="plus-cascader-input-container">
                <Form.Control
                    ref={inputRef}
                    id={fieldId}
                    type="text"
                    readOnly
                    value={displayText}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`plus-cascader-input ${isOpen ? 'plus-cascader-input-open' : ''}`}
                    onClick={handleInputClick}
                    onKeyDown={handleTriggerKeyDown}
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? menuId : undefined}
                    {...props}
                />
                <i className={`fa-solid fa-caret-down plus-cascader-arrow ${isOpen ? 'plus-cascader-arrow-open' : ''}`} aria-hidden="true" />
            </div>

            {/* Dropdown Menu with Columns */}
            {isOpen && (
                <div className="plus-cascader-menu" id={menuId} onKeyDown={handleMenuKeyDown}>
                    <div className="plus-cascader-columns">
                        {activeColumns.map((columnOptions, columnIndex) => (
                            <div
                                key={columnIndex}
                                className="plus-cascader-column"
                                role="listbox"
                                aria-label={columnIndex === 0
                                    ? 'Options'
                                    : `Options under ${selectedPath[columnIndex - 1]}`}
                            >
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
                                            role="option"
                                            aria-selected={isSelected}
                                            aria-disabled={isDisabled || undefined}
                                            /*
                                             * #323. One tab stop per open menu,
                                             * on the cursor. Every option used
                                             * to have none at all.
                                             */
                                            tabIndex={activeCell
                                                && activeCell.column === columnIndex
                                                && activeCell.index === optionIndex ? 0 : -1}
                                            ref={(element) => {
                                                const key = `${columnIndex}:${optionIndex}`;
                                                if (element) optionRefs.current.set(key, element);
                                                else optionRefs.current.delete(key);
                                            }}
                                            onFocus={() => setActiveCell({ column: columnIndex, index: optionIndex })}
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



