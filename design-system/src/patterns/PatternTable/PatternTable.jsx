import React, { Children, Fragment, isValidElement, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { TableBodyMotion } from '@/lib/listMotion';
import './PatternTable.scss';

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
 * Table pattern for PLUS design system.
 * Table shell: table children (consumers pass their own thead/tbody), a
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
 *
 * Mirrors the "Table" slot component in the Figma design system file.
 */
const PatternTable = ({
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
        'plus-pattern-table',
        pinsHeader ? 'plus-pattern-table--sticky-header' : '',
        stickyColumn ? 'plus-pattern-table--sticky-column' : '',
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
                <div
                    className="plus-pattern-table-empty"
                    role={emptyLabel || emptyLabelledBy ? 'region' : undefined}
                    aria-label={emptyLabel}
                    aria-labelledby={emptyLabelledBy}
                >
                    {emptyState}
                </div>
            ) : (
                <div
                    className="plus-pattern-table-scroll"
                    style={bounded ? { maxHeight } : undefined}
                    tabIndex={scrollable ? 0 : undefined}
                    onScroll={tracksScroll ? onScroll : undefined}
                    data-scrolled-x={tracksScroll && scrolled.x ? '' : undefined}
                    data-scrolled-y={tracksScroll && scrolled.y ? '' : undefined}
                >
                    <table
                        {...tableProps}
                        className={['plus-pattern-table-table', tableProps?.className].filter(Boolean).join(' ')}
                    >
                        {withBodyMotion(children)}
                    </table>
                </div>
            )}
            {footer && !showEmptyState && (
                <div className="plus-pattern-table-footer">{footer}</div>
            )}
        </div>
    );
};

PatternTable.propTypes = {
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

export default PatternTable;
