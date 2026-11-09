import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import useFieldId from '../useFieldId';
import PropTypes from 'prop-types';
import FieldBox from '../_internal/FieldBox';
import { FieldCaption, FieldLabel, FieldFrame, fieldDescription, toneProps } from '../_internal/FieldFrame';
import OptionRow from '../_internal/OptionRow';
import { useAnchoredPopup } from '../_internal/anchorPlacement';
import Icon from '../../images-and-icons/Icon';
import '../_internal/Listbox.scss';
import './Cascader.scss';

/**
 * The value and label of an option, for either supported shape.
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

/**
 * The default `value`, one array for every render. A fresh `[]` each render
 * would re-run the value sync on every render, which never settles.
 */
const NO_PATH = [];

export const CASCADER_SPACINGS = ['default', 'compact'];

/** Cascader: a field that picks one path through nested options, one level at a time. */
const Cascader = ({
    id,
    name,
    label,
    caption,
    info,
    value = NO_PATH,
    options = [],
    onChange,
    placeholder = 'Please select',
    spacing = 'default',
    isDisabled = false,
    isRequired = false,
    isInvalid = false,
    errorMessage,
    className = '',
    style,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPath, setSelectedPath] = useState(value || []);
    const [activeColumns, setActiveColumns] = useState([options]); // Array of option arrays for each column
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const menuRef = useRef(null);
    const close = useCallback(() => setIsOpen(false), []);
    const place = useAnchoredPopup({ open: isOpen, anchorRef: wrapperRef, popupRef: menuRef, onClose: close });
    /**
     * Where the keyboard cursor is: which column, and which row of it. The
     * options are real elements, so focus moves between them with a roving
     * `tabIndex` rather than through `aria-activedescendant`.
     */
    const optionRefs = useRef(new Map());
    const [activeCell, setActiveCell] = useState(null);
    const fieldId = useFieldId(id);
    const menuId = `${fieldId}-menu`;
    const labelId = label ? `${fieldId}-label` : undefined;

    // Sync with value prop
    useEffect(() => {
        setSelectedPath(value || []);
    }, [value]);

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
        if (isDisabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Reset to first level when opening
            setActiveColumns([options]);
        }
    };

    /* ---------------------------------------------------------------------
     * The keyboard half. Everything below this comment exists because the
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
        if (isDisabled || !activeCell) return;

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
        if (isDisabled) return;
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
        if (isDisabled) return;

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
        if (isDisabled) return;
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

    const tone = isInvalid ? 'invalid' : 'help';
    const tones = toneProps(tone);
    const message = (isInvalid && errorMessage) || caption;
    const { messageId, describedBy } = fieldDescription({
        fieldId,
        message,
        describedBy: props['aria-describedby'],
    });

    /*
     * `id` names the input, which is the element focus lands on, so a `label`
     * pointing at it names the combobox.
     */
    return (
        <FieldFrame disabled={isDisabled} invalid={tone === 'invalid'} className={className} style={style}>
            {label && (
                <FieldLabel htmlFor={fieldId} required={isRequired} info={info} name={typeof label === 'string' ? label : undefined}>
                    <span id={labelId}>{label}</span>
                </FieldLabel>
            )}
            <div ref={wrapperRef} className="plus-cascader-wrapper">
                <FieldBox
                    spacing={spacing}
                    disabled={isDisabled}
                    state={isOpen ? 'focus' : undefined}
                    className="plus-cascader-field"
                    {...tones.field}
                    onClick={handleInputClick}
                    trailing={(
                        <Icon name="caret-down" className={`plus-cascader-arrow ${isOpen ? 'plus-cascader-arrow-open' : ''}`} />
                    )}
                >
                    <input
                        ref={inputRef}
                        id={fieldId}
                        type="text"
                        readOnly
                        value={displayText}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className="plus-field__control plus-cascader-input"
                        onKeyDown={handleTriggerKeyDown}
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? menuId : undefined}
                        aria-labelledby={props['aria-labelledby'] || labelId}
                        aria-required={isRequired || undefined}
                        aria-describedby={describedBy}
                        {...tones.control}
                        {...props}
                    />
                </FieldBox>

                {/* The listbox surface; its body holds one column per level. */}
                {isOpen && (
                    <div
                        ref={menuRef}
                        className="plus-listbox plus-listbox--anchored plus-cascader-menu"
                        id={menuId}
                        data-placement={place?.placement}
                        data-side={place?.side}
                    >
                        <div className="plus-listbox-body plus-cascader-columns">
                            {activeColumns.map((columnOptions, columnIndex) => (
                                <div
                                    key={columnIndex}
                                    className="plus-listbox-options plus-cascader-column"
                                    role="listbox"
                                    aria-label={columnIndex === 0
                                        ? 'Options'
                                        : `Options under ${selectedPath[columnIndex - 1]}`}
                                >
                                    {columnOptions.map((option, optionIndex) => {
                                        const optionValue = optionValueOf(option);
                                        const hasChildren = optionChildrenOf(option).length > 0;
                                        // Part of the path so far, in this column.
                                        const isSelected = columnIndex < selectedPath.length
                                            && optionValue === selectedPath[columnIndex];
                                        const key = `${columnIndex}:${optionIndex}`;

                                        return (
                                            <OptionRow
                                                key={key}
                                                value={optionValue}
                                                label={optionLabelOf(option)}
                                                selected={isSelected}
                                                disabled={isDisabled || optionIsDisabled(option)}
                                                // The path is the value, so a row shows no check of its own.
                                                check={false}
                                                spacing={spacing}
                                                trailing={hasChildren ? <OptionRow.Chevron /> : undefined}
                                                /* One tab stop per open menu, on the cursor. */
                                                tabbable={Boolean(activeCell
                                                    && activeCell.column === columnIndex
                                                    && activeCell.index === optionIndex)}
                                                ref={(element) => {
                                                    if (element) optionRefs.current.set(key, element);
                                                    else optionRefs.current.delete(key);
                                                }}
                                                onFocus={() => setActiveCell({ column: columnIndex, index: optionIndex })}
                                                // The menu's keys, handled before the row's own Enter and Space.
                                                onKeyDown={handleMenuKeyDown}
                                                onSelect={() => handleOptionClick(option, columnIndex)}
                                                onMouseEnter={() => handleOptionHover(option, columnIndex)}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {name && selectedPath.map((v) => (
                <input key={v} type="hidden" name={name} value={v} disabled={isDisabled} />
            ))}
            <FieldCaption messageId={messageId} message={message} tone={tone} />
        </FieldFrame>
    );
};

Cascader.propTypes = {
    id: PropTypes.string,
    /** Submitted with a form through hidden inputs, one per path segment. */
    name: PropTypes.string,
    /** The visible label above the field. Without one, pass `aria-label` or `aria-labelledby`. */
    label: PropTypes.node,
    /** Help under the field. With `isInvalid`, `errorMessage` takes its place and is announced. */
    caption: PropTypes.node,
    /** Text for the info tooltip beside the label. */
    info: PropTypes.node,
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
    /** Hint text shown in the field while no path is selected. Defaults to `Please select`. */
    placeholder: PropTypes.string,
    /** `default` draws 40 and `compact` draws 32. */
    spacing: PropTypes.oneOf(CASCADER_SPACINGS),
    isDisabled: PropTypes.bool,
    /** Shows an asterisk on the label and sets `aria-required`. */
    isRequired: PropTypes.bool,
    /** Draws the error border, sets `aria-invalid`, and `errorMessage` becomes the announced caption. */
    isInvalid: PropTypes.bool,
    errorMessage: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Cascader;
