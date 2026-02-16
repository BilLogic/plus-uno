import React from 'react';
import PropTypes from 'prop-types';

/**
 * Table component for PLUS design system.
 * Standard table component for displaying tabular data.
 */
const Table = ({
    id,
    headers = [],
    rows = [],
    striped = false,
    hover = true,
    bordered = false,
    density = 'md',
    className = '',
    style,
    onRowClick,
    ...props
}) => {
    const tableClasses = [
        'plus-table',
        striped ? 'plus-table-striped' : '',
        hover ? 'plus-table-hover' : '',
        bordered ? 'plus-table-bordered' : '',
        density ? `plus-table-${density}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div id={id ? `${id}-wrapper` : undefined} className="plus-table-wrapper" style={style} {...props}>
            <table id={id} className={tableClasses}>
                {headers && headers.length > 0 && (
                    <thead>
                        <tr>
                            {headers.map((header, index) => {
                                const isString = typeof header === 'string';
                                const content = isString ? header : header.text;
                                const headerStyle = !isString ? {
                                    width: header.width,
                                    textAlign: header.align,
                                    ...header.style
                                } : {};
                                const headerClass = !isString && header.className ? header.className : '';

                                return (
                                    <th key={index} style={headerStyle} className={headerClass}>
                                        {content}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                )}
                {rows && rows.length > 0 && (
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick && onRowClick(rowIndex)}
                                style={onRowClick ? { cursor: 'pointer' } : undefined}
                                role={onRowClick ? 'button' : undefined}
                            >
                                {row.map((cell, cellIndex) => {
                                    const isObject = typeof cell === 'object' && cell !== null && !React.isValidElement(cell) && cell.content !== undefined;
                                    const content = isObject ? cell.content : cell;
                                    const cellStyle = isObject ? { textAlign: cell.align, ...cell.style } : {};
                                    const cellClass = isObject && cell.className ? cell.className : '';
                                    const colSpan = isObject ? cell.colSpan : undefined;

                                    return (
                                        <td key={cellIndex} style={cellStyle} className={cellClass} colSpan={colSpan}>
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                )}
            </table>
        </div>
    );
};

Table.propTypes = {
    id: PropTypes.string,
    headers: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
            text: PropTypes.node,
            width: PropTypes.string,
            align: PropTypes.string,
            className: PropTypes.string,
            style: PropTypes.object
        })
    ])),
    rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.shape({
            content: PropTypes.node,
            align: PropTypes.string,
            className: PropTypes.string,
            colSpan: PropTypes.number,
            style: PropTypes.object
        })
    ]))),
    striped: PropTypes.bool,
    hover: PropTypes.bool,
    bordered: PropTypes.bool,
    density: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Table;
