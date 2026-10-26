import React, { Children, Fragment, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './PatternTable.scss';

let toolbarWarned = false;

/**
 * The table has no toolbar of its own: search, filters, the record count and
 * bulk actions belong to the Section header above it, where they stay in reach
 * while the rows scroll. The slot still renders, and says so once.
 */
const warnToolbar = () => {
    if (toolbarWarned || process.env.NODE_ENV === 'production') return;
    toolbarWarned = true;
    // eslint-disable-next-line no-console
    console.warn('[PatternTable] `toolbar` is deprecated: the table has no toolbar of its own. Put search, filters and actions in the Section header above the table.');
};

/** Children with fragments opened, so a `thead` passed inside one is found. */
const flatten = (children) => Children.toArray(children).flatMap((child) => (
    isValidElement(child) && child.type === Fragment ? flatten(child.props.children) : [child]
));

const isElementOf = (type) => (child) => isValidElement(child) && child.type === type;

/** The rows an empty table drops; the head row, a caption and column groups stay. */
const isBody = (child) => isElementOf('tbody')(child) || isElementOf('tfoot')(child);

/** How many columns the head row spans, counting each cell's `colSpan`; 1 with no head row. */
const columnCount = (kept) => {
    const firstRow = kept.filter(isElementOf('thead'))
        .flatMap((head) => flatten(head.props.children))
        .find(isElementOf('tr'));
    if (!firstRow) return 1;
    const count = flatten(firstRow.props.children)
        .filter((cell) => isElementOf('th')(cell) || isElementOf('td')(cell))
        .reduce((sum, cell) => sum + (Number(cell.props.colSpan) || 1), 0);
    return Math.max(count, 1);
};

/** The rendered head row's span, which also counts cells a wrapper component draws. */
const renderedColumnCount = (table) => {
    const row = table?.tHead?.rows[0];
    if (!row) return null;
    return Array.from(row.cells).reduce((sum, cell) => sum + (cell.colSpan || 1), 0) || null;
};

/**
 * Table pattern for PLUS design system.
 * Table shell: table children (consumers pass their own thead/tbody), a
 * pagination slot under the rows, and an empty-state slot. The table has no
 * toolbar of its own: the Section header above it carries the title, search,
 * filters and actions. With `empty`, the header stays and the empty state
 * takes the body as one message row spanning every column, so the columns
 * still say what will appear. The table itself is
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
 *
 * Mirrors the "Table" slot component in the Figma design system file.
 */
const PatternTable = ({
    id,
    toolbar,
    pagination,
    emptyState,
    empty = false,
    stickyHeader = false,
    stickyColumn = false,
    maxHeight,
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
        'plus-pattern-table',
        pinsHeader ? 'plus-pattern-table--sticky-header' : '',
        stickyColumn ? 'plus-pattern-table--sticky-column' : '',
        className,
    ].filter(Boolean).join(' ');

    const hasToolbar = Boolean(toolbar);
    useEffect(() => {
        if (hasToolbar) warnToolbar();
    }, [hasToolbar]);

    const showEmptyState = Boolean(empty && emptyState);
    // An empty table keeps its head row and swaps its body for the message row.
    const kept = showEmptyState ? flatten(children).filter((child) => !isBody(child)) : null;
    // The span is read from the children first, then from the rendered head
    // row, so a head row drawn by a wrapper component is still spanned.
    const tableRef = useRef(null);
    const [measuredSpan, setMeasuredSpan] = useState(null);
    useLayoutEffect(() => {
        if (!showEmptyState) return;
        const span = renderedColumnCount(tableRef.current);
        setMeasuredSpan((prev) => (prev === span ? prev : span));
    });
    const messageSpan = showEmptyState ? (measuredSpan ?? columnCount(kept)) : null;
    const tracksScroll = pinsHeader || stickyColumn;
    // A region that scrolls must be reachable by keyboard: a bounded region
    // scrolls vertically, and a sticky column exists for a table that scrolls
    // sideways. A plain table that only might overflow gets no tab stop.
    const scrollable = bounded || stickyColumn;

    return (
        <div id={id} className={classes} style={style} {...props}>
            {toolbar && <div className="plus-pattern-table-toolbar">{toolbar}</div>}
            <div
                className="plus-pattern-table-scroll"
                style={bounded ? { maxHeight } : undefined}
                tabIndex={scrollable ? 0 : undefined}
                onScroll={tracksScroll ? onScroll : undefined}
                data-scrolled-x={tracksScroll && scrolled.x ? '' : undefined}
                data-scrolled-y={tracksScroll && scrolled.y ? '' : undefined}
            >
                <table ref={tableRef} className="plus-pattern-table-table">
                    {showEmptyState ? (
                        <>
                            {kept}
                            <tbody>
                                <tr className="plus-pattern-table-message-row">
                                    <td className="plus-pattern-table-message" colSpan={messageSpan}>
                                        <div className="plus-pattern-table-message-body">{emptyState}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </>
                    ) : children}
                </table>
            </div>
            {pagination && !showEmptyState && (
                <div className="plus-pattern-table-pagination">{pagination}</div>
            )}
        </div>
    );
};

PatternTable.propTypes = {
    id: PropTypes.string,
    /**
     * Deprecated: the table has no toolbar of its own. Put search, filters and
     * actions in the Section header above the table. Still rendered, with a
     * one-time development warning.
     */
    toolbar: PropTypes.node,
    /** Pagination slot under the rows; hidden while the empty state shows */
    pagination: PropTypes.node,
    /** Empty-state slot: a message row under the head row, spanning every column, when `empty` is true */
    emptyState: PropTypes.node,
    /** Swap the body rows for the empty-state message row; the head row stays */
    empty: PropTypes.bool,
    /** Pin the head row while the rows scroll under it; needs `maxHeight`, since only a bounded region scrolls vertically */
    stickyHeader: PropTypes.bool,
    /** Pin the first column while the other columns scroll under it */
    stickyColumn: PropTypes.bool,
    /** Bound the scroll region's height (number of px or any CSS length); a sticky header pins only within it */
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    style: PropTypes.object,
    /** Table content slot — pass thead/tbody elements */
    children: PropTypes.node,
};

export default PatternTable;
