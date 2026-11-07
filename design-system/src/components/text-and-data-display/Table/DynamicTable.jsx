import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import PatternTable from '@/patterns/PatternTable';
import Pagination from '@/components/navigation/Pagination';
import Spinner from '@/components/loading/Spinner';
import HeadCell from './HeadCell';
import { TableCell, TableRow, TableFooter } from './TableParts';
import './Table.scss';
import './DynamicTable.scss';

const classes = (...names) => names.filter(Boolean).join(' ');

const STATES = ['default', 'empty', 'no results', 'loading', 'refreshing', 'error'];

const DEFAULT_MESSAGES = {
    empty: 'Nothing here yet',
    'no results': 'No results. Try other filters.',
    error: 'Couldn’t load the rows. Try again.',
};

/** A cell's sort value: its `key`, else its content when that is plain text or a number. */
const sortValue = (cell) => {
    if (!cell) return '';
    if (cell.key !== undefined) return cell.key;
    return typeof cell.content === 'string' || typeof cell.content === 'number' ? cell.content : '';
};

const compare = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

/** The rows ordered by the column whose head cell has `sortKey`. A stable sort, so ties keep their order. */
export const sortRows = (head, rows, sortKey, sortOrder) => {
    if (!sortKey || sortOrder === 'none' || !sortOrder) return rows;
    const column = head.cells.findIndex((cell) => cell.key === sortKey);
    if (column < 0) return rows;
    const direction = sortOrder === 'descending' ? -1 : 1;
    return rows
        .map((row, index) => ({ row, index }))
        .sort((x, y) => compare(sortValue(x.row.cells[column]), sortValue(y.row.cells[column])) * direction || x.index - y.index)
        .map(({ row }) => row);
};

/** Which state the body draws, from what the table was given. */
const deriveState = (state, isLoading, rowCount) => {
    if (state && STATES.includes(state)) return state;
    if (isLoading) return rowCount > 0 ? 'refreshing' : 'loading';
    return rowCount > 0 ? 'default' : 'empty';
};

/**
 * Dynamic table. A table people sort, page or act on, built on the
 * `PatternTable` shell: its `pagination` and `emptyState` slots,
 * sortable `HeadCell`s in the head row and the shared `TableRow` and
 * `TableCell` parts in the body.
 *
 * - **Data.** `head.cells` is one `{ key, content, isSortable, width, align }`
 *   per column; `rows` is `{ key, cells, onClick }` with one `{ key, content }`
 *   per column. A column sorts by its cells' `key`.
 * - **Stateful or stateless.** Left alone it holds its own sort and page,
 *   seeded by `defaultSortKey`, `defaultSortOrder` and `defaultPage`. Pass
 *   `sortKey` and `sortOrder`, or `page`, and the page owns that state: the
 *   table reports a press through `onSort` or `onSetPage` and draws only what
 *   it is given. With `totalRows`, `rows` is already the current page (paged
 *   on a server) and the footer counts against `totalRows`.
 * - **States.** `default`, `empty`, `no results`, `loading`, `refreshing` and
 *   `error`. Every state but `default` and `refreshing` keeps the head row and
 *   swaps the body for one message row; `refreshing` keeps the rows at the
 *   loading opacity under a spinner. `isLoading` and an empty `rows` choose
 *   the state on their own; `state` names one outright (`no results` and
 *   `error` are only ever named).
 * - **Width.** Under the content minimum the table scrolls sideways instead of
 *   squeezing. The first column fills the room and the rest size to their
 *   content, unless a head cell sets `width`; `isFixedSize` holds every column
 *   to its set width.
 */
const DynamicTable = ({
    head,
    rows = [],
    caption,
    label,
    rowsPerPage,
    page: pageProp,
    defaultPage = 1,
    onSetPage,
    totalRows,
    sortKey: sortKeyProp,
    sortOrder: sortOrderProp,
    defaultSortKey,
    defaultSortOrder = 'ascending',
    onSort,
    isLoading = false,
    state,
    emptyView,
    noResultsView,
    errorView,
    highlightedRowIndex,
    isFixedSize = false,
    verticalLines = false,
    wrap = false,
    size = 40,
    className = '',
    testId,
    ...props
}) => {
    const sortControlled = sortKeyProp !== undefined;
    const [ownSort, setOwnSort] = useState({ key: defaultSortKey, order: defaultSortKey ? defaultSortOrder : 'none' });
    const sortKey = sortControlled ? sortKeyProp : ownSort.key;
    const sortOrder = sortControlled ? (sortOrderProp || 'none') : ownSort.order;

    const pageControlled = pageProp !== undefined;
    const [ownPage, setOwnPage] = useState(defaultPage);
    const page = pageControlled ? pageProp : ownPage;

    const serverPaged = totalRows !== undefined;
    const sorted = useMemo(
        () => (serverPaged ? rows : sortRows(head, rows, sortKey, sortOrder)),
        [head, rows, sortKey, sortOrder, serverPaged]
    );

    const total = serverPaged ? totalRows : sorted.length;
    const pages = rowsPerPage ? Math.max(1, Math.ceil(total / rowsPerPage)) : 1;
    const currentPage = Math.min(Math.max(1, page), pages);
    const start = rowsPerPage ? (currentPage - 1) * rowsPerPage : 0;
    const visible = rowsPerPage && !serverPaged ? sorted.slice(start, start + rowsPerPage) : sorted;

    const bodyState = deriveState(state, isLoading, rows.length);
    const showsMessage = !['default', 'refreshing'].includes(bodyState);

    const handleSort = (key) => (order) => {
        if (!sortControlled) setOwnSort({ key, order });
        if (onSort) onSort({ key, sortOrder: order });
    };

    const handlePage = (next) => {
        if (!pageControlled) setOwnPage(next);
        if (onSetPage) onSetPage(next);
    };

    const message = {
        empty: emptyView ?? DEFAULT_MESSAGES.empty,
        'no results': noResultsView ?? DEFAULT_MESSAGES['no results'],
        error: errorView ?? DEFAULT_MESSAGES.error,
        // The words carry the state; the spinner beside them is not read twice.
        loading: <><span aria-hidden="true"><Spinner size={24} /></span><span>Loading rows</span></>,
    }[bodyState];

    const footer = rowsPerPage && !showsMessage ? (
        <TableFooter range={`${total === 0 ? 0 : start + 1}–${Math.min(start + rowsPerPage, total)} of ${total}`}>
            {pages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pages}
                    onPageChange={handlePage}
                    spacing="compact"
                    // Two tables on a page need two pager landmarks with different names.
                    label={label ? `${label} pages` : undefined}
                />
            )}
        </TableFooter>
    ) : null;

    const anyWidth = head.cells.some((cell) => cell.width);

    return (
        <div
            className={classes(
                'plus-dynamic-table',
                wrap && 'plus-dynamic-table--wrap',
                className
            )}
            data-state={bodyState}
            aria-busy={isLoading ? 'true' : undefined}
            data-testid={testId}
            {...props}
        >
            <PatternTable
                pagination={footer}
                empty={showsMessage}
                emptyState={showsMessage ? (
                    <span className={classes('plus-dynamic-table-message', `plus-dynamic-table-message--${bodyState.replace(/\s+/g, '-')}`)}>
                        {message}
                    </span>
                ) : null}
                tableProps={{
                    'aria-label': caption ? undefined : label,
                    className: classes(
                        'plus-table',
                        `plus-table-${size}`,
                        'plus-dynamic-table-table',
                        isFixedSize && 'plus-dynamic-table-table--fixed',
                        verticalLines && 'plus-table-vertical-lines'
                    ),
                }}
            >
                {caption && <caption className="plus-dynamic-table-caption">{caption}</caption>}
                <thead>
                    <tr>
                        {head.cells.map((cell, index) => (
                            <HeadCell
                                key={cell.key ?? index}
                                label={typeof cell.content === 'string' ? cell.content : String(cell.key ?? '')}
                                icon={cell.icon}
                                isSortable={Boolean(cell.isSortable)}
                                sort={cell.isSortable && cell.key === sortKey ? sortOrder : 'none'}
                                onSort={cell.isSortable ? handleSort(cell.key) : undefined}
                                align={cell.align}
                                width={cell.width}
                                shouldTruncate={cell.shouldTruncate ?? true}
                                className={classes(
                                    !isFixedSize && !anyWidth && index > 0 && 'plus-dynamic-table-col--fit'
                                )}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {visible.map((row, rowIndex) => (
                        <TableRow
                            key={row.key ?? rowIndex}
                            className={classes(
                                start + rowIndex === highlightedRowIndex && 'plus-dynamic-table-row--highlighted'
                            )}
                            onClick={row.onClick}
                        >
                            {row.cells.map((cell, cellIndex) => {
                                const { key, content, ...rest } = cell || {};
                                return (
                                    <TableCell
                                        key={cellIndex}
                                        align={head.cells[cellIndex]?.align}
                                        emphasis={cellIndex === 0 ? 'title' : 'default'}
                                        overflow={wrap ? 'wrap' : 'truncate'}
                                        {...rest}
                                    >
                                        {content}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </tbody>
            </PatternTable>
            {bodyState === 'refreshing' && (
                <div className="plus-dynamic-table-overlay">
                    <Spinner size={24} label="Refreshing rows" />
                </div>
            )}
        </div>
    );
};

const cellAlign = PropTypes.oneOf(['text', 'number', 'icon']);

DynamicTable.propTypes = {
    /** The head row: one cell per column. `key` names the column for sorting. */
    head: PropTypes.shape({
        cells: PropTypes.arrayOf(PropTypes.shape({
            key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            content: PropTypes.string,
            isSortable: PropTypes.bool,
            width: PropTypes.string,
            align: cellAlign,
            icon: PropTypes.string,
            shouldTruncate: PropTypes.bool,
        })).isRequired,
    }).isRequired,
    /** One `{ key, cells, onClick }` per row; each cell `{ key, content }` plus any `TableCell` prop. A column sorts by its cells' `key`. */
    rows: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        cells: PropTypes.arrayOf(PropTypes.object).isRequired,
        onClick: PropTypes.func,
    })),
    /** A visible caption that names the table. */
    caption: PropTypes.node,
    /** The table's accessible name when there is no caption. */
    label: PropTypes.string,
    /** Rows per page; leave it out and the table does not page. */
    rowsPerPage: PropTypes.number,
    /** The current page, owned by the page (stateless). */
    page: PropTypes.number,
    /** The first page when the table holds its own page. */
    defaultPage: PropTypes.number,
    /** Called with the page the pager asks for. */
    onSetPage: PropTypes.func,
    /** The full count when `rows` is already one page, paged on a server. */
    totalRows: PropTypes.number,
    /** The sorted column's key, owned by the page (stateless). */
    sortKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** The sort direction, owned by the page. */
    sortOrder: PropTypes.oneOf(['ascending', 'descending', 'none']),
    /** The column the table starts sorted by when it holds its own sort. */
    defaultSortKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultSortOrder: PropTypes.oneOf(['ascending', 'descending']),
    /** Called with `{ key, sortOrder }` when a head cell asks for a sort. */
    onSort: PropTypes.func,
    /** Rows are on their way: `loading` with no rows, `refreshing` over them. */
    isLoading: PropTypes.bool,
    /** Names the body's state outright. */
    state: PropTypes.oneOf(STATES),
    /** The message for the `empty` state. */
    emptyView: PropTypes.node,
    /** The message for the `no results` state. */
    noResultsView: PropTypes.node,
    /** The message for the `error` state. */
    errorView: PropTypes.node,
    /** The index (across every page) of the row to highlight. */
    highlightedRowIndex: PropTypes.number,
    /** Hold every column to its head cell's `width`. */
    isFixedSize: PropTypes.bool,
    /** Rules between the columns. */
    verticalLines: PropTypes.bool,
    /** Every cell wraps instead of truncating. */
    wrap: PropTypes.bool,
    /** Row height: 32, 40 or 48. */
    size: PropTypes.oneOf([32, 40, 48]),
    className: PropTypes.string,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default DynamicTable;
