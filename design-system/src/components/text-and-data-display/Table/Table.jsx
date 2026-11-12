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
    /** The `id` of the `table` element. The wrapper takes `{id}-wrapper`. */
    id: PropTypes.string,
    /** The column headers. A string is the header text; an object adds `width`, `align`, `className` and `style` to `text`. */
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
    /** The body rows, each an array of cells. A cell is a node, or an object with `content` plus `align`, `emphasis`, `overflow`, `secondary`, `elemBefore`, `state`, `loading`, `className`, `colSpan` or `style`. */
    rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.shape({
            content: PropTypes.node,
            align: cellAlign,
            emphasis: PropTypes.oneOf(['default', 'title']),
            overflow: PropTypes.oneOf(['truncate', 'wrap']),
            secondary: PropTypes.node,
            elemBefore: PropTypes.node,
            state: PropTypes.oneOf(['rest', 'error']),
            loading: PropTypes.bool,
            className: PropTypes.string,
            colSpan: PropTypes.number,
            style: PropTypes.object
        })
    ]))),
    /** Shades alternate rows. */
    striped: PropTypes.bool,
    /** Highlights a row on hover. On by default. */
    hover: PropTypes.bool,
    /** Draws a frame around the table and lines between columns. Shorthand for `frame="framed"` plus `verticalLines`. */
    bordered: PropTypes.bool,
    /** Draws lines between columns. */
    verticalLines: PropTypes.bool,
    /** `plain` (default) draws no outer frame; `framed` draws a border around the table. */
    frame: PropTypes.oneOf(['plain', 'framed']),
    /** Row height in px: 32 for dense tables, 40 (default) or 48 for roomy ones. */
    size: PropTypes.oneOf(SIZES),
    /** The index of the column drawn in the title emphasis, for the row's main label. */
    titleColumn: PropTypes.number,
    /** A state per row, by index: `rest`, `highlighted`, `selected` or `disabled`. */
    rowStates: PropTypes.arrayOf(PropTypes.oneOf(['rest', 'highlighted', 'selected', 'disabled'])),
    /** Cells for a summary row at the bottom of the table, one per column, such as totals. */
    summary: PropTypes.arrayOf(PropTypes.node),
    /** Content shown in a single row spanning all columns when `rows` is empty. */
    emptyState: PropTypes.node,
    /** Content drawn under the table inside its wrapper, such as pagination. */
    footer: PropTypes.node,
    /** Called with the row index when a row is clicked. The row gets no button role or key handling, so put any keyboard action in a control inside a cell. */
    onRowClick: PropTypes.func,
    /** Extra class names added to the `table` element beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the table's wrapper element. */
    style: PropTypes.object,
};

export default Table;
