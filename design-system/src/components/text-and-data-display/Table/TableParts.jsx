import { HeightCell } from '@/lib/heightMotion';
import React, { Children, Fragment, isValidElement, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { TableBodyMotion } from '@/lib/listMotion';
import { ClippedTooltip } from '@/lib/ClippedTooltip';
import './Table.scss';
import './TableShell.scss';

/**
 * The shared `_Table` parts: the row, the cell, the message row, the summary
 * row and the footer. The Static, Dynamic and Tree tables are built from them.
 */

/**
 * `align` takes the three names the Figma cell uses (`text`, `number`, `icon`)
 * and, so no caller breaks, the older `left`, `right`, `center`, `start`, `end`.
 */
export const alignName = (align) => {
    if (align === 'number' || align === 'right' || align === 'end') return 'number';
    if (align === 'icon' || align === 'center') return 'icon';
    return 'text';
};

const classes = (...names) => names.filter(Boolean).join(' ');

/**
 * Single-line text that ends in an ellipsis. The full text rides in a tooltip,
 * and only while it is clipped, so a name that fits never shows one. A clipped
 * cell takes a tab stop, so the tooltip is reachable by keyboard.
 */
const ClippedText = ({ children, className }) => {
    const readable = typeof children === 'string' || typeof children === 'number';
    return (
        <ClippedTooltip text={readable ? String(children) : ''}>
            {({ measureRef, truncated }) => (
                <span ref={measureRef} className={className} tabIndex={truncated ? 0 : undefined}>
                    {children}
                </span>
            )}
        </ClippedTooltip>
    );
};

ClippedText.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

/**
 * `_Table cell`. Fills the row height; one line that truncates by default.
 *
 * - `align`: `text` | `number` | `icon`
 * - `emphasis`: `default` | `title`, the one column that names the record
 * - `overflow`: `truncate` (one line, ellipsis, and a tooltip and a tab stop only while clipped) | `wrap`
 * - `secondary`: a muted second line under the text (the `lines=2` cell)
 * - `elemBefore`: a slot before the text, for an avatar, an icon or a Status
 * - `state`: `rest` | `error`; `loading` draws a placeholder bar
 */
export const TableCell = ({
    children,
    align = 'text',
    emphasis = 'default',
    overflow = 'truncate',
    secondary,
    elemBefore,
    state = 'rest',
    loading = false,
    className = '',
    style,
    colSpan,
    ...props
}) => {
    const lines = secondary != null && secondary !== false ? 2 : 1;
    const truncate = overflow !== 'wrap';
    const cellClass = classes(
        'plus-table-cell',
        `plus-table-cell--align-${alignName(align)}`,
        emphasis === 'title' && 'plus-table-cell--title',
        truncate ? 'plus-table-cell--truncate' : 'plus-table-cell--wrap',
        `plus-table-cell--lines-${lines}`,
        state === 'error' && 'plus-table-cell--error',
        loading && 'plus-table-cell--loading',
        className
    );
    const textClass = 'plus-table-cell-text';
    return (
        <td
            className={cellClass}
            style={style}
            colSpan={colSpan}
            aria-busy={loading ? 'true' : undefined}
            {...props}
        >
            <HeightCell><div className="plus-table-cell-inner">
                {elemBefore != null && elemBefore !== false && <span className="plus-table-cell-leading">{elemBefore}</span>}
                <span className="plus-table-cell-body">
                    {truncate
                        ? <ClippedText className={textClass}>{children}</ClippedText>
                        : <span className={textClass}>{children}</span>}
                    {lines === 2 && <span className="plus-table-cell-secondary">{secondary}</span>}
                </span>
            </div></HeightCell>
        </td>
    );
};

TableCell.propTypes = {
    children: PropTypes.node,
    align: PropTypes.oneOf(['text', 'number', 'icon', 'left', 'right', 'center', 'start', 'end']),
    emphasis: PropTypes.oneOf(['default', 'title']),
    overflow: PropTypes.oneOf(['truncate', 'wrap']),
    secondary: PropTypes.node,
    elemBefore: PropTypes.node,
    state: PropTypes.oneOf(['rest', 'error']),
    loading: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    colSpan: PropTypes.number,
};

/**
 * `_Table row`. Owns the fill for hover, selected and highlighted, and the
 * hairline under it.
 *
 * - `state`: `rest` | `highlighted` | `selected` | `disabled`
 * - `divider`: the hairline under the row (default on)
 *
 * Hover and pressed come from the table (`hover`) or from a row that takes
 * `onClick`; focus is a ring on the control inside the row, never a fill.
 */
export const TableRow = ({
    children,
    state = 'rest',
    divider = true,
    className = '',
    onClick,
    ...props
}) => (
    <tr
        className={classes(
            'plus-table-row',
            state !== 'rest' && `plus-table-row--${state}`,
            !divider && 'plus-table-row--no-divider',
            onClick && 'plus-table-row--clickable',
            className
        )}
        aria-selected={state === 'selected' ? 'true' : undefined}
        aria-disabled={state === 'disabled' ? 'true' : undefined}
        onClick={onClick}
        {...props}
    >
        {children}
    </tr>
);

TableRow.displayName = 'TableRow';

TableRow.propTypes = {
    children: PropTypes.node,
    state: PropTypes.oneOf(['rest', 'highlighted', 'selected', 'disabled']),
    divider: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func,
};

/**
 * `_Table message row`. One cell across every column for the states that
 * replace or follow the rows: `empty`, `no results`, `error`, `loading`,
 * `load more`.
 */
export const TableMessageRow = ({
    children,
    type = 'empty',
    colSpan = 1,
    className = '',
    ...props
}) => {
    const slug = String(type).replace(/\s+/g, '-');
    return (
        <tr
            className={classes('plus-table-message-row', `plus-table-message-row--${slug}`, className)}
            aria-busy={type === 'loading' ? 'true' : undefined}
            {...props}
        >
            <td className="plus-table-message" colSpan={colSpan}>
                <div className="plus-table-message-body">{children}</div>
            </td>
        </tr>
    );
};

TableMessageRow.propTypes = {
    children: PropTypes.node,
    type: PropTypes.oneOf(['empty', 'no results', 'error', 'loading', 'load more']),
    colSpan: PropTypes.number,
    className: PropTypes.string,
};

/**
 * `_Table summary row`. A muted row with one calculation per column and no
 * rule under it; `cells` is one node per column, in column order.
 */
export const TableSummaryRow = ({ cells = [], aligns = [], className = '', ...props }) => (
    <tr className={classes('plus-table-summary-row', className)} {...props}>
        {cells.map((cell, index) => (
            <td
                key={index}
                className={classes('plus-table-summary-cell', `plus-table-cell--align-${alignName(aligns[index])}`)}
            >
                {cell}
            </td>
        ))}
    </tr>
);

TableSummaryRow.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node),
    aligns: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
};

/**
 * `_Table footer`. The range text on the start side; `children` (a pager, or
 * its disabled ends) on the end side. Its inset matches the cells.
 *
 * - `type`: `full` | `compact`
 */
export const TableFooter = ({ range, type = 'full', children, className = '', ...props }) => (
    <div className={classes('plus-table-footer', `plus-table-footer--${type}`, className)} {...props}>
        {range != null && <span className="plus-table-footer-range">{range}</span>}
        {children != null && <div className="plus-table-footer-actions">{children}</div>}
    </div>
);

TableFooter.propTypes = {
    range: PropTypes.node,
    type: PropTypes.oneOf(['full', 'compact']),
    children: PropTypes.node,
    className: PropTypes.string,
};

/**
 * The empty state box that replaces an empty table: a sunken, rounded block
 * with no head row, caption or footer. It keeps the table's accessible name
 * (`label` or `labelledBy`) on a `region`, so no table semantics are left.
 */
export const TableEmptyBox = ({ label, labelledBy, className = '', children }) => (
    <div
        className={classes('plus-table-shell-empty', className)}
        role={label || labelledBy ? 'region' : undefined}
        aria-label={label}
        aria-labelledby={labelledBy}
    >
        {children}
    </div>
);

TableEmptyBox.propTypes = {
    label: PropTypes.string,
    labelledBy: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};

/** The row under a table's rows that holds the range, the page-size Select and the Pagination. */
export const TableFooterRow = ({ className = '', children }) => (
    <div className={classes('plus-table-shell-footer', className)}>{children}</div>
);

TableFooterRow.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
};

/** Children with fragments opened, so a `caption` or `tbody` passed inside one is found. */
const flatten = (children) => Children.toArray(children).flatMap((child) => (
    isValidElement(child) && child.type === Fragment ? flatten(child.props.children) : [child]
));

const isElementOf = (type) => (child) => isValidElement(child) && child.type === type;

/** Wrap `tbody` children in `TableBodyMotion` so keyed rows animate presence and reorder. */
const withBodyMotion = (children) => flatten(children).map((child, index) => (
    isElementOf('tbody')(child)
        ? <TableBodyMotion key={child.key ?? `tbody-${index}`} tbodyElement={child} />
        : child
));

const textOf = (node) => {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join('');
    if (isValidElement(node)) return textOf(node.props.children);
    return '';
};

const captionLabel = (children) => {
    const caption = flatten(children).find(isElementOf('caption'));
    const text = caption ? textOf(caption).trim() : '';
    return text || undefined;
};

/**
 * The table shell the Dynamic and Tree tables draw on: table children (consumers pass their own thead/tbody), a
 * footer slot under the rows, and an empty-state slot. The table has no
 * toolbar of its own: the Section header above it carries the title, search,
 * filters and actions. With `empty`, the empty state replaces the whole table
 * (no column headers, no caption, no footer). The table itself is
 * no-fill (transparent): the surrounding card or surface provides the
 * background, and row states are layered over each cell's fill rather than
 * replacing it.
 *
 * - **Row states**: hovered and pressed rows take the neutral subtle steps; a
 *   row with `aria-selected="true"` (in a `role="grid"` table) takes the
 *   selected ladder across the whole row, with no stripe on its leading edge;
 *   the row's checkbox is the cue that does not rest on color.
 * - **Sticky cells**: `stickyHeader` pins the head row and `stickyColumn` the
 *   first column. They paint the current surface, so they match the page or
 *   the card they sit in, and take the overflow shadow only while content is
 *   scrolled under them. `stickyHeader` pairs with `maxHeight`: only a
 *   bounded region scrolls vertically, so without `maxHeight` the header is
 *   not pinned. A bounded region, or one with a sticky column, takes keyboard
 *   focus so it can be scrolled without a pointer.
 */
export const TableShell = ({
    id,
    footer,
    emptyState,
    empty = false,
    stickyHeader = false,
    stickyColumn = false,
    maxHeight,
    tableProps,
    className = '',
    style,
    children,
    ...props
}) => {
    const [scrolled, setScrolled] = useState({ x: false, y: false });
    const onScroll = useCallback((event) => {
        const { scrollLeft, scrollTop } = event.currentTarget;
        const next = { x: scrollLeft > 0, y: scrollTop > 0 };
        setScrolled((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
    }, []);

    // Only a bounded region scrolls vertically, so a sticky header needs
    // `maxHeight`; without it the head row would have nothing to stick within.
    const bounded = maxHeight != null && maxHeight !== '';
    const pinsHeader = stickyHeader && bounded;

    const classes = [
        'plus-table-shell',
        pinsHeader ? 'plus-table-shell--sticky-header' : '',
        stickyColumn ? 'plus-table-shell--sticky-column' : '',
        className,
    ].filter(Boolean).join(' ');

    const showEmptyState = Boolean(empty && emptyState);
    const emptyLabel = showEmptyState
        ? (tableProps?.['aria-label'] ?? (tableProps?.['aria-labelledby'] ? undefined : captionLabel(children)))
        : undefined;
    const emptyLabelledBy = showEmptyState ? tableProps?.['aria-labelledby'] : undefined;
    const tracksScroll = pinsHeader || stickyColumn;
    // A region that scrolls must be reachable by keyboard: a bounded region
    // scrolls vertically, and a sticky column exists for a table that scrolls
    // sideways. A plain table that only might overflow gets no tab stop.
    const scrollable = bounded || stickyColumn;

    return (
        <div id={id} className={classes} style={style} {...props}>
            {showEmptyState ? (
                <TableEmptyBox label={emptyLabel} labelledBy={emptyLabelledBy}>
                    {emptyState}
                </TableEmptyBox>
            ) : (
                <div
                    className="plus-table-shell-scroll"
                    style={bounded ? { maxHeight } : undefined}
                    tabIndex={scrollable ? 0 : undefined}
                    onScroll={tracksScroll ? onScroll : undefined}
                    data-scrolled-x={tracksScroll && scrolled.x ? '' : undefined}
                    data-scrolled-y={tracksScroll && scrolled.y ? '' : undefined}
                >
                    <table
                        {...tableProps}
                        className={['plus-table-shell-table', tableProps?.className].filter(Boolean).join(' ')}
                    >
                        {withBodyMotion(children)}
                    </table>
                </div>
            )}
            {footer && !showEmptyState && (
                <TableFooterRow>{footer}</TableFooterRow>
            )}
        </div>
    );
};

TableShell.propTypes = {
    id: PropTypes.string,
    /** Footer slot under the rows (range, page-size Select, Pagination); hidden while the empty state shows
     * @ds-context Used in: Table.footer (ds guide table)
     * @ds-context Governed by: Empty (ds guide empty)
     */
    footer: PropTypes.node,
    /** Empty-state slot: replaces the entire table (no head row, caption, or footer) when `empty` is true
     * @ds-context Used in: Table.emptyState (ds guide table)
     * @ds-context Governed by: Empty (ds guide empty)
     */
    emptyState: PropTypes.node,
    /** Replace the table with the `emptyState` slot; with `empty` and no `emptyState`, the table renders normally */
    empty: PropTypes.bool,
    /** Pin the head row while the rows scroll under it; needs `maxHeight`, since only a bounded region scrolls vertically */
    stickyHeader: PropTypes.bool,
    /** Pin the first column while the other columns scroll under it */
    stickyColumn: PropTypes.bool,
    /** Bound the scroll region's height (number of px or any CSS length); a sticky header pins only within it */
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Props for the `table` element itself: an accessible name, a class a wrapper styles it by */
    tableProps: PropTypes.object,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Table content slot — pass thead/tbody elements
     * @ds-context Used in: Table.children (ds guide table)
     */
    children: PropTypes.node,
};


const SIZES = [32, 40, 48];

const isCellObject = (cell) => typeof cell === 'object' && cell !== null
    && !React.isValidElement(cell) && cell.content !== undefined;

/**
 * The base table element: tabular data built from the shared
 * `_Table` parts (`TableRow`, `TableCell`, `TableMessageRow`,
 * `TableSummaryRow`, `TableFooter`).
 *
 * The feel: hairline horizontal dividers, no outer frame, a quiet header over
 * a stronger rule, single-line cells that end in an ellipsis with a tooltip,
 * no zebra. Rows are 32, 40 or 48 tall (`size`). `StaticTable` is this table for a fixed grid people read; it is not
 * exported on its own.
 */
export const TableBase = ({
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

TableBase.propTypes = {
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

