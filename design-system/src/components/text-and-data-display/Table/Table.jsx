import React from 'react';
import PropTypes from 'prop-types';
import { TableCell, TableRow, TableMessageRow, TableSummaryRow, alignName } from './TableParts';
import './Table.scss';

const SIZES = [32, 40, 48];

const isCellObject = (cell) => typeof cell === 'object' && cell !== null
    && !React.isValidElement(cell) && cell.content !== undefined;

/**
 * Table component for PLUS design system.
 * Standard table component for displaying tabular data, built from the shared
 * `_Table` parts (`TableRow`, `TableCell`, `TableMessageRow`,
 * `TableSummaryRow`, `TableFooter`).
 *
 * The feel: hairline horizontal dividers, no outer frame, a quiet header over
 * a stronger rule, single-line cells that end in an ellipsis with a tooltip,
 * no zebra. Rows are 32, 40 or 48 tall (`size`). `StaticTable` is this table for a fixed grid people read.
 */
const Table = ({
    id,
    headers = [],
    rows = [],
    striped = false,
    hover = true,
    bordered = false,
    verticalLines = false,
    frame = 'plain',
    size,
    titleColumn,
    rowStates,
    summary,
    emptyState,
    footer,
    className = '',
    style,
    onRowClick,
    ...props
}) => {
    const rowSize = size || 40;
    const framed = frame === 'framed' || bordered;
    const lines = verticalLines || bordered;
    const tableClasses = [
        'plus-table',
        striped ? 'plus-table-striped' : '',
        hover ? 'plus-table-hover' : '',
        lines ? 'plus-table-vertical-lines' : '',
        bordered ? 'plus-table-bordered' : '',
        `plus-table-${rowSize}`,
        className
    ].filter(Boolean).join(' ');

    const columnCount = headers.length || (rows[0] ? rows[0].length : 1);
    const showEmpty = rows.length === 0 && emptyState != null && emptyState !== false;

    return (
        <div
            id={id ? `${id}-wrapper` : undefined}
            className={['plus-table-wrapper', framed ? 'plus-table-framed' : ''].filter(Boolean).join(' ')}
            style={style}
            {...props}
        >
            <div className="plus-table-scroll">
                <table id={id} className={tableClasses}>
                    {headers && headers.length > 0 && (
                        <thead>
                            <tr>
                                {headers.map((header, index) => {
                                    const isString = typeof header === 'string';
                                    const content = isString ? header : header.text;
                                    const headerStyle = !isString ? {
                                        width: header.width,
                                        ...header.style
                                    } : {};
                                    const headerClass = [
                                        'plus-table-head-cell',
                                        `plus-table-cell--align-${alignName(isString ? undefined : header.align)}`,
                                        !isString && header.className ? header.className : ''
                                    ].filter(Boolean).join(' ');

                                    return (
                                        <th key={index} scope="col" style={headerStyle} className={headerClass}>
                                            {content}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                    )}
                    {(rows.length > 0 || showEmpty) && (
                        <tbody>
                            {showEmpty && (
                                <TableMessageRow type="empty" colSpan={columnCount}>{emptyState}</TableMessageRow>
                            )}
                            {rows.map((row, rowIndex) => (
                                /*
                                 * NO `role="button"` ON A ROW. It used to be added
                                 * whenever `onRowClick` was passed, and it was
                                 * wrong twice over: it replaced the row's own
                                 * `row` semantics inside the table, and it made
                                 * every focusable cell a nested control — axe's
                                 * `nested-interactive`, 20 nodes on the tutor
                                 * training page alone.
                                 *
                                 * It also promised something it never delivered:
                                 * there was no `tabIndex` and no key handler, so
                                 * the row announced itself as a button that no
                                 * keyboard could press. Dropping the role loses
                                 * nothing that worked and restores the table
                                 * structure a screen reader navigates by. A row
                                 * that needs a keyboard action needs a real
                                 * control INSIDE a cell, which is where the ARIA
                                 * grid pattern puts it.
                                 */
                                <TableRow
                                    key={rowIndex}
                                    state={rowStates && rowStates[rowIndex] ? rowStates[rowIndex] : 'rest'}
                                    onClick={onRowClick ? () => onRowClick(rowIndex) : undefined}
                                >
                                    {row.map((cell, cellIndex) => {
                                        const isObject = isCellObject(cell);
                                        const cellProps = isObject ? cell : {};
                                        const { content: objectContent, ...rest } = cellProps;
                                        return (
                                            <TableCell
                                                key={cellIndex}
                                                {...rest}
                                                emphasis={rest.emphasis || (cellIndex === titleColumn ? 'title' : 'default')}
                                            >
                                                {isObject ? objectContent : cell}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </tbody>
                    )}
                    {summary && summary.length > 0 && (
                        <tfoot>
                            <TableSummaryRow
                                cells={summary}
                                aligns={headers.map((header) => (typeof header === 'string' ? undefined : header.align))}
                            />
                        </tfoot>
                    )}
                </table>
            </div>
            {footer}
        </div>
    );
};

const cellAlign = PropTypes.oneOf(['text', 'number', 'icon', 'left', 'right', 'center', 'start', 'end']);

Table.propTypes = {
    id: PropTypes.string,
    headers: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
            text: PropTypes.node,
            width: PropTypes.string,
            align: cellAlign,
            className: PropTypes.string,
            style: PropTypes.object
        })
    ])),
    rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.shape({
            content: PropTypes.node,
            align: cellAlign,
            emphasis: PropTypes.oneOf(['default', 'title']),
            overflow: PropTypes.oneOf(['truncate', 'wrap']),
            secondary: PropTypes.node,
            leading: PropTypes.node,
            state: PropTypes.oneOf(['rest', 'error']),
            loading: PropTypes.bool,
            className: PropTypes.string,
            colSpan: PropTypes.number,
            style: PropTypes.object
        })
    ]))),
    striped: PropTypes.bool,
    hover: PropTypes.bool,
    bordered: PropTypes.bool,
    verticalLines: PropTypes.bool,
    frame: PropTypes.oneOf(['plain', 'framed']),
    size: PropTypes.oneOf(SIZES),
    titleColumn: PropTypes.number,
    rowStates: PropTypes.arrayOf(PropTypes.oneOf(['rest', 'highlighted', 'selected', 'disabled'])),
    summary: PropTypes.arrayOf(PropTypes.node),
    emptyState: PropTypes.node,
    footer: PropTypes.node,
    onRowClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Table;
