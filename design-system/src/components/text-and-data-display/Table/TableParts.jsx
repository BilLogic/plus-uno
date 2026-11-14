import { HeightCell } from '@/lib/heightMotion';
import React from 'react';
import PropTypes from 'prop-types';
import { ClippedTooltip } from '@/lib/ClippedTooltip';
import './Table.scss';

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
