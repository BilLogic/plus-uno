import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './TreeSelect.scss';

// ---------------------------------------------------------------------------
// Option helpers — tolerate { label | text, value, children } shapes as well
// as plain strings, mirroring the Cascader normalization rules.
// ---------------------------------------------------------------------------
const getOptionValue = (option) =>
    typeof option === 'string' ? option : (option.value ?? option.label ?? option.text);

const getOptionLabel = (option) =>
    typeof option === 'string' ? option : (option.label ?? option.text ?? String(option.value));

const getOptionChildren = (option) =>
    (typeof option === 'object' && Array.isArray(option.children)) ? option.children : [];

const isOptionDisabled = (option) =>
    typeof option === 'object' && Boolean(option.disabled);

/** Collect the value of a node plus every descendant value (pre-order). */
const collectSubtreeValues = (option) => {
    const values = [getOptionValue(option)];
    getOptionChildren(option).forEach((child) => {
        values.push(...collectSubtreeValues(child));
    });
    return values;
};

/** Depth-first search for the option carrying `value`. */
const findOptionByValue = (options, value) => {
    for (const option of options) {
        if (getOptionValue(option) === value) return option;
        const found = findOptionByValue(getOptionChildren(option), value);
        if (found) return found;
    }
    return null;
};

/** Values of every ancestor of `value` (outermost first). */
const findAncestorValues = (options, value, trail = []) => {
    for (const option of options) {
        if (getOptionValue(option) === value) return trail;
        const children = getOptionChildren(option);
        if (children.length > 0) {
            const found = findAncestorValues(children, value, [...trail, getOptionValue(option)]);
            if (found) return found;
        }
    }
    return null;
};

/**
 * After a toggle, reconcile ancestors bottom-up: a parent is checked when all
 * of its children are checked, otherwise it is removed from the set.
 */
const syncAncestorStates = (options, valueSet) => {
    options.forEach((option) => {
        const children = getOptionChildren(option);
        if (children.length === 0) return;
        syncAncestorStates(children, valueSet);
        const allChecked = children.every((child) => valueSet.has(getOptionValue(child)));
        if (allChecked) {
            valueSet.add(getOptionValue(option));
        } else {
            valueSet.delete(getOptionValue(option));
        }
    });
};

/** Walk the tree in order and keep only values present in the set. */
const orderValues = (options, valueSet) => {
    const ordered = [];
    const walk = (nodes) => {
        nodes.forEach((node) => {
            if (valueSet.has(getOptionValue(node))) ordered.push(getOptionValue(node));
            walk(getOptionChildren(node));
        });
    };
    walk(options);
    return ordered;
};

/** Checkbox that supports the indeterminate visual state. */
const TreeSelectCheckbox = ({ checked, indeterminate, disabled, onChange, inputId }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        <Form.Check
            ref={inputRef}
            type="checkbox"
            id={inputId}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            onClick={(event) => event.stopPropagation()}
            className="plus-tree-select-checkbox"
            aria-label="Toggle selection"
        />
    );
};

TreeSelectCheckbox.propTypes = {
    checked: PropTypes.bool,
    indeterminate: PropTypes.bool,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    inputId: PropTypes.string
};

const TreeSelect = ({
    id,
    value,
    options = [],
    onChange,
    multiple = false,
    placeholder = 'Please select',
    disabled = false,
    className = '',
    style,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedValues, setExpandedValues] = useState(() => new Set());
    const wrapperRef = useRef(null);

    const selectedValues = useMemo(() => {
        if (multiple) return Array.isArray(value) ? value : [];
        return value === undefined || value === null || value === '' ? [] : [value];
    }, [value, multiple]);

    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    // Close the panel when clicking outside the component.
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

    // When opening, reveal the branches that contain the current selection.
    useEffect(() => {
        if (!isOpen) return;
        setExpandedValues((previous) => {
            const next = new Set(previous);
            selectedValues.forEach((selectedValue) => {
                const ancestors = findAncestorValues(options, selectedValue);
                if (ancestors) ancestors.forEach((ancestor) => next.add(ancestor));
            });
            return next;
        });
        // Only re-run when the panel opens, not on every selection change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Trigger text: single shows the node label; multiple shows the top-most
    // checked nodes (a fully-checked parent stands in for its children).
    const displayText = useMemo(() => {
        if (selectedValues.length === 0) return '';

        if (!multiple) {
            const option = findOptionByValue(options, selectedValues[0]);
            return option ? getOptionLabel(option) : String(selectedValues[0]);
        }

        const labels = [];
        const walk = (nodes) => {
            nodes.forEach((node) => {
                if (selectedSet.has(getOptionValue(node))) {
                    labels.push(getOptionLabel(node));
                } else {
                    walk(getOptionChildren(node));
                }
            });
        };
        walk(options);
        return labels.join(', ');
    }, [options, selectedValues, selectedSet, multiple]);

    const handleInputClick = () => {
        if (disabled) return;
        setIsOpen((open) => !open);
    };

    const toggleExpanded = (optionValue) => {
        setExpandedValues((previous) => {
            const next = new Set(previous);
            if (next.has(optionValue)) {
                next.delete(optionValue);
            } else {
                next.add(optionValue);
            }
            return next;
        });
    };

    const handleSingleSelect = (option) => {
        if (disabled || isOptionDisabled(option)) return;
        setIsOpen(false);
        if (onChange) onChange(getOptionValue(option));
    };

    const handleMultipleToggle = useCallback((option) => {
        if (disabled || isOptionDisabled(option)) return;
        const subtreeValues = collectSubtreeValues(option);
        const next = new Set(selectedSet);
        const isChecked = next.has(getOptionValue(option));
        subtreeValues.forEach((subtreeValue) => {
            if (isChecked) {
                next.delete(subtreeValue);
            } else {
                next.add(subtreeValue);
            }
        });
        syncAncestorStates(options, next);
        if (onChange) onChange(orderValues(options, next));
    }, [disabled, selectedSet, options, onChange]);

    /** Checked / indeterminate visual state for a branch node. */
    const getNodeCheckState = (option) => {
        const optionValue = getOptionValue(option);
        if (selectedSet.has(optionValue)) return { checked: true, indeterminate: false };
        const children = getOptionChildren(option);
        if (children.length === 0) return { checked: false, indeterminate: false };
        const someChecked = collectSubtreeValues(option)
            .some((subtreeValue) => selectedSet.has(subtreeValue));
        return { checked: false, indeterminate: someChecked };
    };

    const renderNode = (option, depth, keyPrefix) => {
        const optionValue = getOptionValue(option);
        const optionLabel = getOptionLabel(option);
        const children = getOptionChildren(option);
        const hasChildren = children.length > 0;
        const isExpanded = expandedValues.has(optionValue);
        const nodeDisabled = disabled || isOptionDisabled(option);
        const isSelected = !multiple && selectedSet.has(optionValue);
        const { checked, indeterminate } = getNodeCheckState(option);

        const nodeClasses = [
            'plus-tree-select-node',
            isSelected ? 'plus-tree-select-node-selected' : '',
            nodeDisabled ? 'plus-tree-select-node-disabled' : ''
        ].filter(Boolean).join(' ');

        return (
            <React.Fragment key={`${keyPrefix}-${optionValue}`}>
                <div
                    className={nodeClasses}
                    style={{ paddingLeft: `calc(var(--size-element-pad-x-md, 10px) + ${depth} * 20px)` }}
                    role="treeitem"
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    aria-selected={multiple ? checked : isSelected}
                    aria-disabled={nodeDisabled || undefined}
                    onClick={() => {
                        if (nodeDisabled) return;
                        if (multiple) {
                            handleMultipleToggle(option);
                        } else {
                            handleSingleSelect(option);
                        }
                    }}
                >
                    <span
                        className={`plus-tree-select-node-toggle ${hasChildren ? '' : 'plus-tree-select-node-toggle-empty'}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (hasChildren && !disabled) toggleExpanded(optionValue);
                        }}
                        aria-hidden="true"
                    >
                        {hasChildren && (
                            <i className={`fa-solid fa-caret-right plus-tree-select-node-caret ${isExpanded ? 'plus-tree-select-node-caret-open' : ''}`} />
                        )}
                    </span>
                    {multiple && (
                        <TreeSelectCheckbox
                            inputId={`${id || 'plus-tree-select'}-checkbox-${optionValue}`}
                            checked={checked}
                            indeterminate={indeterminate}
                            disabled={nodeDisabled}
                            onChange={() => handleMultipleToggle(option)}
                        />
                    )}
                    <span className="plus-tree-select-node-label">{optionLabel}</span>
                </div>
                {hasChildren && isExpanded && children.map((child) =>
                    renderNode(child, depth + 1, `${keyPrefix}-${optionValue}`)
                )}
            </React.Fragment>
        );
    };

    return (
        <div className={`plus-tree-select-wrapper ${className}`} id={id} style={style} ref={wrapperRef}>
            {/* Trigger input */}
            <div className="plus-tree-select-input-container">
                <Form.Control
                    type="text"
                    readOnly
                    value={displayText}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`plus-tree-select-input ${isOpen ? 'plus-tree-select-input-open' : ''}`}
                    onClick={handleInputClick}
                    aria-haspopup="tree"
                    aria-expanded={isOpen}
                    {...props}
                />
                <i className={`fa-solid fa-caret-down plus-tree-select-arrow ${isOpen ? 'plus-tree-select-arrow-open' : ''}`} aria-hidden="true" />
            </div>

            {/* Tree panel */}
            {isOpen && (
                <div className="plus-tree-select-menu" role="tree">
                    {options.map((option) => renderNode(option, 0, 'root'))}
                </div>
            )}
        </div>
    );
};

const optionShape = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
        label: PropTypes.string,
        text: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        children: PropTypes.array,
        disabled: PropTypes.bool
    })
]);

TreeSelect.propTypes = {
    id: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    options: PropTypes.arrayOf(optionShape),
    onChange: PropTypes.func,
    multiple: PropTypes.bool,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object
};

export default TreeSelect;
