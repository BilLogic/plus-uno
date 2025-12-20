import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './ChoiceGrid.scss';

/**
 * ChoiceGrid Component
 * A grid-based selection component that supports both radio buttons and checkboxes.
 * Displays rows and columns with interactive selection elements.
 */
const ChoiceGrid = ({
    id,
    name,
    type = 'radio', // 'radio' or 'checkbox'
    rows = [],
    columns = [],
    values = {}, // { rowId: { columnId: boolean } } for checkbox, { rowId: columnId } for radio
    disabled = false,
    size = 'medium',
    onChange,
    className = '',
    style,
    ...props
}) => {
    const handleChange = (rowId, columnId, checked) => {
        if (disabled) return;
        
        if (onChange) {
            if (type === 'radio') {
                // For radio, only one column can be selected per row
                onChange(rowId, columnId);
            } else {
                // For checkbox, multiple columns can be selected per row
                const newValues = { ...values };
                if (!newValues[rowId]) {
                    newValues[rowId] = {};
                }
                newValues[rowId][columnId] = checked;
                onChange(newValues);
            }
        }
    };

    const isChecked = (rowId, columnId) => {
        if (type === 'radio') {
            return values[rowId] === columnId;
        } else {
            return values[rowId]?.[columnId] === true;
        }
    };

    const wrapperClasses = [
        'plus-choice-grid-wrapper',
        `plus-choice-grid-${type}`,
        disabled ? 'plus-choice-grid-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    return (
        <div className={wrapperClasses} style={style} {...props}>
            <table className="plus-choice-grid-table">
                <thead>
                    <tr>
                        <th className="plus-choice-grid-row-header"></th>
                        {columns.map((column) => (
                            <th key={column.id} className={`plus-choice-grid-column-header ${sizeClass}`}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="plus-choice-grid-row">
                            <td className={`plus-choice-grid-row-label ${sizeClass}`}>
                                {row.label}
                            </td>
                            {columns.map((column) => {
                                const checked = isChecked(row.id, column.id);
                                const inputId = `${id || name || 'choice-grid'}-${row.id}-${column.id}`;
                                const inputName = type === 'radio' ? `${name || id || 'choice-grid'}-${row.id}` : inputId;

                                return (
                                    <td key={column.id} className="plus-choice-grid-cell">
                                        {type === 'radio' ? (
                                            <ChoiceGridRadioItem
                                                id={inputId}
                                                name={inputName}
                                                checked={checked}
                                                disabled={disabled}
                                                size={size}
                                                onChange={() => handleChange(row.id, column.id, true)}
                                            />
                                        ) : (
                                            <ChoiceGridCheckboxItem
                                                id={inputId}
                                                name={inputName}
                                                checked={checked}
                                                disabled={disabled}
                                                size={size}
                                                onChange={(e) => handleChange(row.id, column.id, e.target.checked)}
                                            />
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

ChoiceGrid.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.oneOf(['radio', 'checkbox']),
    rows: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.node.isRequired
    })).isRequired,
    columns: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.node.isRequired
    })).isRequired,
    values: PropTypes.oneOfType([
        PropTypes.object, // For checkbox: { rowId: { columnId: boolean } }
        PropTypes.object // For radio: { rowId: columnId }
    ]),
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

/**
 * Sub-component: ChoiceGridCheckboxItem
 * Individual checkbox item for grid cells
 */
const ChoiceGridCheckboxItem = ({
    id,
    name,
    checked = false,
    disabled = false,
    size = 'medium',
    onChange,
    className = '',
    ...props
}) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const wrapperClasses = [
        'plus-choice-grid-checkbox-wrapper',
        `plus-choice-grid-checkbox-${size}`,
        sizeClass,
        disabled ? 'plus-choice-grid-checkbox-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses}>
            <Form.Check
                type="checkbox"
                id={id}
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                className="plus-choice-grid-checkbox"
                {...props}
            />
        </div>
    );
};

ChoiceGridCheckboxItem.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    onChange: PropTypes.func,
    className: PropTypes.string
};

/**
 * Sub-component: ChoiceGridRadioItem
 * Individual radio button item for grid cells
 */
const ChoiceGridRadioItem = ({
    id,
    name,
    checked = false,
    disabled = false,
    size = 'medium',
    onChange,
    className = '',
    ...props
}) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const wrapperClasses = [
        'plus-choice-grid-radio-wrapper',
        `plus-choice-grid-radio-${size}`,
        sizeClass,
        disabled ? 'plus-choice-grid-radio-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses}>
            <Form.Check
                type="radio"
                id={id}
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                className="plus-choice-grid-radio"
                {...props}
            />
        </div>
    );
};

ChoiceGridRadioItem.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    onChange: PropTypes.func,
    className: PropTypes.string
};

// Attach subcomponents
ChoiceGrid.CheckboxItem = ChoiceGridCheckboxItem;
ChoiceGrid.RadioItem = ChoiceGridRadioItem;

export default ChoiceGrid;
