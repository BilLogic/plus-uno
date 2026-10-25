import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import './PatternTable.scss';

/**
 * Table pattern for PLUS design system.
 * Table shell: toolbar slot, table children (consumers pass their own
 * thead/tbody), pagination slot, and an empty-state slot. The table itself is
 * no-fill (transparent): the surrounding card or surface provides the
 * background, and row states are layered over each cell's fill rather than
 * replacing it.
 *
 * - **Row states**: hovered and pressed rows take the neutral subtle steps; a
 *   row with `aria-selected="true"` (in a `role="grid"` table) takes the
 *   selected ladder and a 2px Lagoon bar at its leading edge.
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

    const showEmptyState = empty && emptyState;
    const tracksScroll = pinsHeader || stickyColumn;
    // A region that scrolls must be reachable by keyboard: a bounded region
    // scrolls vertically, and a sticky column exists for a table that scrolls
    // sideways. A plain table that only might overflow gets no tab stop.
    const scrollable = bounded || stickyColumn;

    return (
        <div id={id} className={classes} style={style} {...props}>
            {toolbar && <div className="plus-pattern-table-toolbar">{toolbar}</div>}
            {showEmptyState ? (
                <div className="plus-pattern-table-empty">{emptyState}</div>
            ) : (
                <div
                    className="plus-pattern-table-scroll"
                    style={bounded ? { maxHeight } : undefined}
                    tabIndex={scrollable ? 0 : undefined}
                    onScroll={tracksScroll ? onScroll : undefined}
                    data-scrolled-x={tracksScroll && scrolled.x ? '' : undefined}
                    data-scrolled-y={tracksScroll && scrolled.y ? '' : undefined}
                >
                    <table className="plus-pattern-table-table">{children}</table>
                </div>
            )}
            {pagination && !showEmptyState && (
                <div className="plus-pattern-table-pagination">{pagination}</div>
            )}
        </div>
    );
};

PatternTable.propTypes = {
    id: PropTypes.string,
    /** Toolbar slot above the table (search, filters, bulk actions) */
    toolbar: PropTypes.node,
    /** Pagination slot below the table */
    pagination: PropTypes.node,
    /** Empty-state slot, rendered instead of the table when `empty` is true */
    emptyState: PropTypes.node,
    /** Show the empty-state slot instead of the table */
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
