import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from './Checkbox';
import Radio from './Radio';
import useFieldId from './useFieldId';
import './ChoiceGrid.scss';

/**
 * ChoiceGrid — the same question asked of several rows, as a table.
 * Each cell is the real Checkbox or Radio, named by its row and its column.
 */
const ChoiceGrid = ({
    id,
    name,
    type = 'radio', // 'radio' or 'checkbox'
    rows = [],
    columns = [],
    values = {}, // { rowId: { columnId: boolean } } for checkbox, { rowId: columnId } for radio
    disabled = false,
    readOnly = false,
    size = 'medium',
    onChange,
    className = '',
    style,
    ...props
}) => {
    const handleChange = (rowId, columnId, checked) => {
        if (disabled || readOnly) return;

        if (onChange) {
            if (type === 'radio') {
                // For radio, only one column can be selected per row
                onChange(rowId, columnId);
            } else {
                /*
                 * #325. Copy the ROW as well as the top level. A spread of
                 * `values` shares its row objects, so writing into
                 * `newValues[rowId]` wrote into the object the caller passed in
                 * — the previous state and the next one were the same object
                 * one level down, which defeats an identity comparison and
                 * silently rewrites history for anything holding the old value.
                 */
                const newValues = {
                    ...values,
                    [rowId]: { ...(values[rowId] || {}), [columnId]: checked },
                };
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

    /*
     * One base per grid. It used to fall back to the literal 'choice-grid', so
     * two grids without an id shared every cell id and, in radio mode, every
     * row's radio name: answering a row in one grid cleared it in the other.
     */
    const fieldId = useFieldId(id);
    const baseId = id || name || fieldId;
    const rowHeaderId = `${baseId}-row-header`;

    return (
        <div className={wrapperClasses} style={style} {...props}>
            <table className="plus-choice-grid-table">
                <thead>
                    <tr>
                        <th className="plus-choice-grid-row-header">
                            <span className="plus-choice-grid-visually-hidden" id={rowHeaderId}>Row</span>
                        </th>
                        {columns.map((column) => (
                            <th
                                key={column.id}
                                id={`${baseId}-col-${column.id}`}
                                className="plus-choice-grid-column-header"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const rowLabelId = `${baseId}-row-${row.id}-label`;

                        return (
                            <tr key={row.id} className="plus-choice-grid-row">
                                <td id={rowLabelId} className="plus-choice-grid-row-label">
                                    {row.label}
                                </td>
                                {columns.map((column) => {
                                    const checked = isChecked(row.id, column.id);
                                    const inputId = `${baseId}-${row.id}-${column.id}`;
                                    const inputName = type === 'radio' ? `${baseId}-${row.id}` : inputId;
                                    const columnHeaderId = `${baseId}-col-${column.id}`;
                                    const Control = type === 'radio' ? Radio : Checkbox;

                                    return (
                                        <td key={column.id} className="plus-choice-grid-cell">
                                            <Control
                                                id={inputId}
                                                name={inputName}
                                                value={column.id}
                                                checked={checked}
                                                disabled={disabled}
                                                readOnly={readOnly}
                                                size={size}
                                                className="plus-choice-grid-control"
                                                aria-labelledby={`${rowLabelId} ${columnHeaderId}`}
                                                onChange={(e) => handleChange(
                                                    row.id,
                                                    column.id,
                                                    type === 'radio' ? true : e.target.checked,
                                                )}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
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
    /** Radio: `{ rowId: columnId }`. Checkbox: `{ rowId: { columnId: boolean } }`. */
    values: PropTypes.object,
    disabled: PropTypes.bool,
    /** Shown and focusable, not changeable. */
    readOnly: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default ChoiceGrid;
