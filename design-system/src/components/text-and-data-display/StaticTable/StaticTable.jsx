import React from 'react';
import PropTypes from 'prop-types';
import { TableBase } from '../Table/TableParts';

const SIZES = [32, 40, 48];

/**
 * The Static table: a fixed grid people read. Rows rest or are highlighted
 * (`rowStates`); there is nothing to sort, select, page or expand, so it takes
 * no hover and no row click. Reach for the Dynamic table when rows act or
 * people work the data.
 *
 * Takes `headers` and `rows`, plus `size`, `frame`, `titleColumn`, `summary`,
 * `verticalLines` and `striped`.
 */
const StaticTable = ({ className = '', onRowClick: _onRowClick, ...props }) => (
    <TableBase {...props} hover={false} className={['plus-static-table', className].filter(Boolean).join(' ')} />
);

const cellAlign = PropTypes.oneOf(['text', 'number', 'icon', 'left', 'right', 'center', 'start', 'end']);

StaticTable.propTypes = {
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
    /** Extra class names added to the `table` element beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the table's wrapper element. */
    style: PropTypes.object,
};

export default StaticTable;
